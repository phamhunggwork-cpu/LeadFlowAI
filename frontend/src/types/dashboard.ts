export type LeadStatus =
  | 'new'
  | 'processing'
  | 'qualified'
  | 'needs_review'
  | 'not_qualified'
  | 'contacted'
  | 'replied'
  | 'closed'
  | 'won';

export type Priority = 'low' | 'medium' | 'high';

export type ApprovalStatus =
  | 'not_required'
  | 'pending'
  | 'approved'
  | 'rejected';

export type FollowupStatus =
  | 'not_eligible'
  | 'scheduled'
  | 'sent'
  | 'stopped';

export type EmailStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'queued'
  | 'sent'
  | 'failed'
  | 'cancelled';

export type ManualLeadStatus = 'replied' | 'closed' | 'won';

export interface ScoreAxisDetail {
  points: number;
  max: number;
  reason?: string;
  effective_budget?: number | null;
  timeline_weeks?: number | null;
  clarity_score_band?: string;
}

export interface ScoreBreakdown {
  service_fit?: ScoreAxisDetail;
  budget_fit?: ScoreAxisDetail;
  timeline_fit?: ScoreAxisDetail;
  project_clarity?: ScoreAxisDetail;
  raw_score?: number;
  final_score?: number;
  deal_breakers?: string[];
  overrides?: string[];
  missing_information_count?: number;
}

export interface ContactRecord {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  hubspot_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadAnalysisRecord {
  id: string;
  inquiry_id: string;
  model_name: string | null;
  prompt_version: string | null;
  detected_service: string | null;
  project_summary: string | null;
  missing_information: string[];
  scope_fit: 'high' | 'medium' | 'low' | null;
  spam_suspected: boolean;
  qualification_score: number | null;
  qualification_status: 'qualified' | 'needs_review' | 'not_qualified' | null;
  priority: Priority | null;
  draft_email: string | null;
  score_breakdown: ScoreBreakdown;
  created_at: string;
}

export interface EmailMessageRecord {
  id: string;
  inquiry_id: string;
  message_type: 'initial' | 'follow_up' | 'reply' | 'other';
  direction: 'outbound' | 'inbound';
  recipient_email: string;
  subject: string | null;
  body: string;
  status: EmailStatus;
  idempotency_key: string;
  provider_message_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ActivityLogRecord {
  id: string;
  inquiry_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowErrorRecord {
  id: string;
  inquiry_id: string | null;
  submission_id: string | null;
  workflow_name: string;
  execution_id: string | null;
  node_name: string | null;
  error_message: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface InquiryRecord {
  id: string;
  contact_id: string;
  submission_id: string;
  service_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  timeline_weeks: number | null;
  project_description: string;
  consent_to_email: boolean;
  consent_timestamp: string | null;
  consent_source: string | null;
  unsubscribed_at: string | null;
  lead_status: LeadStatus;
  priority: Priority;
  approval_status: ApprovalStatus;
  followup_status: FollowupStatus;
  created_at: string;
  updated_at: string;
  contact: ContactRecord | null;
}

export interface InquiryListItem extends InquiryRecord {
  latest_analysis: LeadAnalysisRecord | null;
  initial_email: EmailMessageRecord | null;
}

export interface InquirySummaryCounts {
  total: number;
  pending_approval: number;
  qualified: number;
  needs_review: number;
  not_qualified: number;
  contacted: number;
  replied: number;
  closed: number;
  won: number;
  open_workflow_errors: number;
}

export interface InquiryListResponse {
  items: InquiryListItem[];
  total: number;
  limit: number;
  offset: number;
  summary: InquirySummaryCounts;
}

export interface InquiryDetailResponse {
  inquiry: InquiryRecord;
  latest_analysis: LeadAnalysisRecord | null;
  lead_analyses: LeadAnalysisRecord[];
  initial_email: EmailMessageRecord | null;
  email_messages: EmailMessageRecord[];
  activity_logs: ActivityLogRecord[];
  workflow_errors: WorkflowErrorRecord[];
}

export interface ApprovalActionResponse {
  inquiry_id: string;
  email_message_id: string;
  action: 'approve' | 'reject';
  approved_by: string;
  status: string;
  workflow: string;
  received_at: string;
  email_status?: string;
  provider_message_id?: string;
}

export interface StatusUpdateResponse {
  inquiry: Omit<InquiryRecord, 'contact'>;
  activity_log: ActivityLogRecord;
}

export interface WorkflowErrorsResponse {
  items: WorkflowErrorRecord[];
  total: number;
}

export interface InquiryFilters {
  status?: LeadStatus | '';
  priority?: Priority | '';
  approval_status?: ApprovalStatus | '';
  search?: string;
}
