import { env } from '../config/env.js';
import { AppError, type ApiErrorDetail } from '../utils/apiResponse.js';
import type { NormalizedLeadPayload } from '../validators/lead.validator.js';

export interface Wf01ForwardResult {
  httpStatus: number;
  workflow: string;
  receivedAt: string;
  contactId?: string;
  inquiryId?: string;
}

export interface Wf02ApprovalPayload {
  inquiry_id: string;
  email_message_id: string;
  action: 'approve' | 'reject';
  approved_by: string;
  subject?: string;
  body?: string;
  rejection_reason?: string;
}

export interface Wf02ForwardResult {
  httpStatus: number;
  workflow: string;
  receivedAt: string;
  action: 'approve' | 'reject';
  emailStatus?: string;
  providerMessageId?: string;
}

function parseJsonObject(rawText: string): Record<string, unknown> {
  if (!rawText) return {};
  try {
    const json = JSON.parse(rawText) as unknown;
    if (json && typeof json === 'object' && !Array.isArray(json)) {
      return json as Record<string, unknown>;
    }
  } catch {
    // Non-JSON upstream body
  }
  return {};
}

export async function forwardLeadToWf01(
  payload: NormalizedLeadPayload,
): Promise<Wf01ForwardResult> {
  const targetUrl = `${env.N8N_WEBHOOK_BASE_URL}${env.N8N_WF01_PATH}`;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-webhook-secret': env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(env.N8N_REQUEST_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    throw new AppError(
      502,
      'UPSTREAM_ERROR',
      isTimeout
        ? 'Lead intake workflow timed out'
        : 'Unable to reach lead intake workflow',
    );
  }

  const rawText = await response.text();
  const parsedBody = parseJsonObject(rawText);

  if (response.status === 409) {
    const upstreamError =
      parsedBody.error &&
      typeof parsedBody.error === 'object' &&
      !Array.isArray(parsedBody.error)
        ? (parsedBody.error as Record<string, unknown>)
        : {};
    const message =
      typeof upstreamError.message === 'string' && upstreamError.message.trim()
        ? upstreamError.message
        : 'Duplicate submission_id';
    const details = Array.isArray(upstreamError.details)
      ? (upstreamError.details as ApiErrorDetail[])
      : [{ field: 'submission_id', message: 'An inquiry with this submission_id already exists' }];

    throw new AppError(409, 'CONFLICT', message, details);
  }

  if (!response.ok) {
    throw new AppError(
      502,
      'UPSTREAM_ERROR',
      `Lead intake workflow rejected the request (upstream HTTP ${response.status})`,
    );
  }

  return {
    httpStatus: response.status,
    workflow:
      typeof parsedBody.workflow === 'string'
        ? parsedBody.workflow
        : 'wf01-lead-intake-qualification',
    receivedAt:
      typeof parsedBody.received_at === 'string'
        ? parsedBody.received_at
        : new Date().toISOString(),
    ...(typeof parsedBody.contact_id === 'string'
      ? { contactId: parsedBody.contact_id }
      : {}),
    ...(typeof parsedBody.inquiry_id === 'string'
      ? { inquiryId: parsedBody.inquiry_id }
      : {}),
  };
}

export async function forwardApprovalToWf02(
  payload: Wf02ApprovalPayload,
): Promise<Wf02ForwardResult> {
  const targetUrl = `${env.N8N_WEBHOOK_BASE_URL}${env.N8N_WF02_PATH}`;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-webhook-secret': env.N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(env.N8N_REQUEST_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    throw new AppError(
      502,
      'UPSTREAM_ERROR',
      isTimeout
        ? 'Approval workflow timed out'
        : 'Unable to reach approval workflow (WF02)',
    );
  }

  const rawText = await response.text();
  const parsedBody = parseJsonObject(rawText);

  if (response.status === 409) {
    const upstreamError =
      parsedBody.error &&
      typeof parsedBody.error === 'object' &&
      !Array.isArray(parsedBody.error)
        ? (parsedBody.error as Record<string, unknown>)
        : {};
    const message =
      typeof upstreamError.message === 'string' && upstreamError.message.trim()
        ? upstreamError.message
        : 'Approval action conflicts with current inquiry or email state';
    throw new AppError(409, 'CONFLICT', message);
  }

  if (!response.ok) {
    throw new AppError(
      502,
      'UPSTREAM_ERROR',
      `Approval workflow rejected the request (upstream HTTP ${response.status})`,
    );
  }

  return {
    httpStatus: response.status,
    workflow:
      typeof parsedBody.workflow === 'string'
        ? parsedBody.workflow
        : 'wf02-human-approval-email',
    receivedAt:
      typeof parsedBody.received_at === 'string'
        ? parsedBody.received_at
        : new Date().toISOString(),
    action: payload.action,
    ...(typeof parsedBody.email_status === 'string'
      ? { emailStatus: parsedBody.email_status }
      : {}),
    ...(typeof parsedBody.provider_message_id === 'string'
      ? { providerMessageId: parsedBody.provider_message_id }
      : {}),
  };
}
