import { env } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';
import type { NormalizedLeadPayload } from '../validators/lead.validator.js';

export interface Wf01ForwardResult {
  httpStatus: number;
  workflow: string;
  receivedAt: string;
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
  if (!response.ok) {
    throw new AppError(
      502,
      'UPSTREAM_ERROR',
      `Lead intake workflow rejected the request (upstream HTTP ${response.status})`,
    );
  }

  let parsedBody: Record<string, unknown> = {};
  if (rawText) {
    try {
      const json = JSON.parse(rawText) as unknown;
      if (json && typeof json === 'object' && !Array.isArray(json)) {
        parsedBody = json as Record<string, unknown>;
      }
    } catch {
      // Upstream returned 2xx with non-JSON body; still treat as accepted
    }
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
  };
}
