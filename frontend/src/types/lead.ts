export const VELOCE_SERVICES = [
  'Custom Web Applications & SaaS MVPs',
  'B2B Marketing & Corporate Websites',
  'Web App Redesign & Performance Optimization',
  'Third-party API & Database Integrations',
  'Other / Not sure yet',
] as const;

export interface LeadSubmissionInput {
  submission_id?: string;
  full_name: string;
  email: string;
  company_name?: string | null;
  phone?: string | null;
  service_type?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_currency?: string;
  timeline_weeks?: number | null;
  project_description: string;
  consent_to_email: boolean;
  consent_source?: string;
}

export interface LeadAcceptedData {
  submission_id: string;
  status: string;
  workflow: string;
  received_at: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: ApiErrorPayload | null;
}
