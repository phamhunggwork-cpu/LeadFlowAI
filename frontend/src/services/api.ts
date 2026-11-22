import type {
  ApiEnvelope,
  ApiErrorDetail,
  LeadAcceptedData,
  LeadSubmissionInput,
} from '../types/lead';

const API_BASE_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:4000'
).replace(/\/+$/, '');

export class ApiRequestError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export async function submitLead(
  payload: LeadSubmissionInput,
): Promise<LeadAcceptedData> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the API server. Please make sure the backend is running and try again.',
    );
  }

  let envelope: ApiEnvelope<LeadAcceptedData> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<LeadAcceptedData>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.ok || !envelope.data) {
    const code = envelope?.error?.code ?? 'REQUEST_FAILED';
    const message =
      envelope?.error?.message ??
      `Request failed with status ${response.status}. Please try again.`;
    const details = envelope?.error?.details ?? [];
    throw new ApiRequestError(response.status, code, message, details);
  }

  return envelope.data;
}
