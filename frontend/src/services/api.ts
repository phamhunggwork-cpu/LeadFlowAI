import type {
  ApprovalActionResponse,
  InquiryDetailResponse,
  InquiryFilters,
  InquiryListResponse,
  ManualLeadStatus,
  StatusUpdateResponse,
  WorkflowErrorsResponse,
} from '../types/dashboard';
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

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the API server. Please make sure the backend is running and try again.',
    );
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = null;
  }

  if (!response.ok || !envelope?.ok || envelope.data === null) {
    const code = envelope?.error?.code ?? 'REQUEST_FAILED';
    const message =
      envelope?.error?.message ??
      `Request failed with status ${response.status}. Please try again.`;
    const details = envelope?.error?.details ?? [];
    throw new ApiRequestError(response.status, code, message, details);
  }

  return envelope.data;
}

export async function submitLead(
  payload: LeadSubmissionInput,
): Promise<LeadAcceptedData> {
  return apiRequest<LeadAcceptedData>('/api/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function authHeaders(accessToken: string, includeJson = false): HeadersInit {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${accessToken}`,
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function fetchInquiries(
  accessToken: string,
  filters: InquiryFilters = {},
): Promise<InquiryListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.approval_status) params.set('approval_status', filters.approval_status);
  if (filters.search?.trim()) params.set('search', filters.search.trim());

  const qs = params.toString();
  return apiRequest<InquiryListResponse>(
    `/api/inquiries${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: authHeaders(accessToken),
    },
  );
}

export async function fetchInquiryDetail(
  accessToken: string,
  inquiryId: string,
): Promise<InquiryDetailResponse> {
  return apiRequest<InquiryDetailResponse>(`/api/inquiries/${inquiryId}`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
}

export async function approveInquiry(
  accessToken: string,
  inquiryId: string,
  payload: { email_message_id?: string; subject?: string; body?: string },
): Promise<ApprovalActionResponse> {
  return apiRequest<ApprovalActionResponse>(`/api/inquiries/${inquiryId}/approve`, {
    method: 'POST',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(payload),
  });
}

export async function rejectInquiry(
  accessToken: string,
  inquiryId: string,
  payload: { email_message_id?: string; reason?: string },
): Promise<ApprovalActionResponse> {
  return apiRequest<ApprovalActionResponse>(`/api/inquiries/${inquiryId}/reject`, {
    method: 'POST',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(payload),
  });
}

export async function updateInquiryStatus(
  accessToken: string,
  inquiryId: string,
  payload: { lead_status?: ManualLeadStatus; unsubscribed?: boolean; note?: string },
): Promise<StatusUpdateResponse> {
  return apiRequest<StatusUpdateResponse>(`/api/inquiries/${inquiryId}/status`, {
    method: 'PATCH',
    headers: authHeaders(accessToken, true),
    body: JSON.stringify(payload),
  });
}

export async function fetchWorkflowErrors(
  accessToken: string,
  status?: 'open' | 'resolved' | '',
): Promise<WorkflowErrorsResponse> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest<WorkflowErrorsResponse>(`/api/workflow-errors${qs}`, {
    method: 'GET',
    headers: authHeaders(accessToken),
  });
}
