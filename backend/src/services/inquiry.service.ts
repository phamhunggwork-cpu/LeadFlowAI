import type { AuthenticatedUser } from '../middleware/requireAuth.js';
import { AppError } from '../utils/apiResponse.js';
import type {
  ApproveInquiryInput,
  ListInquiriesQuery,
  ListWorkflowErrorsQuery,
  RejectInquiryInput,
  UpdateInquiryStatusInput,
} from '../validators/inquiry.validator.js';
import type { Wf02ApprovalPayload } from './n8n.service.js';
import { supabaseAdmin } from './supabase.service.js';

export interface ContactRow {
  id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  hubspot_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InquiryRow {
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
  lead_status: string;
  priority: string;
  approval_status: string;
  followup_status: string;
  created_at: string;
  updated_at: string;
}

export interface LeadAnalysisRow {
  id: string;
  inquiry_id: string;
  model_name: string | null;
  prompt_version: string | null;
  detected_service: string | null;
  project_summary: string | null;
  missing_information: string[];
  scope_fit: string | null;
  spam_suspected: boolean;
  qualification_score: number | null;
  qualification_status: string | null;
  priority: string | null;
  draft_email: string | null;
  score_breakdown: Record<string, unknown>;
  created_at: string;
}

export interface EmailMessageRow {
  id: string;
  inquiry_id: string;
  message_type: string;
  direction: string;
  recipient_email: string;
  subject: string | null;
  body: string;
  status: string;
  idempotency_key: string;
  provider_message_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  inquiry_id: string | null;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowErrorRow {
  id: string;
  inquiry_id: string | null;
  submission_id: string | null;
  workflow_name: string;
  execution_id: string | null;
  node_name: string | null;
  error_message: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

function unwrapSingleRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (!relation) return null;
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function normalizeError(context: string, error: { message?: string } | null): AppError {
  console.error(`[supabase] ${context}:`, error?.message ?? 'Unknown database error');
  return new AppError(500, 'INTERNAL_ERROR', `Database operation failed while ${context}`);
}

export async function listInquiries(query: ListInquiriesQuery) {
  let dbQuery = supabaseAdmin
    .from('inquiries')
    .select(
      `
      id,
      contact_id,
      submission_id,
      service_type,
      budget_min,
      budget_max,
      budget_currency,
      timeline_weeks,
      project_description,
      consent_to_email,
      consent_timestamp,
      consent_source,
      unsubscribed_at,
      lead_status,
      priority,
      approval_status,
      followup_status,
      created_at,
      updated_at,
      contact:contacts (
        id,
        full_name,
        email,
        company_name,
        phone,
        hubspot_contact_id,
        created_at,
        updated_at
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (query.status) {
    dbQuery = dbQuery.eq('lead_status', query.status);
  }
  if (query.priority) {
    dbQuery = dbQuery.eq('priority', query.priority);
  }
  if (query.approval_status) {
    dbQuery = dbQuery.eq('approval_status', query.approval_status);
  }

  const [inquiriesResult, summaryInquiriesResult, openErrorsResult] = await Promise.all([
    dbQuery,
    supabaseAdmin
      .from('inquiries')
      .select('lead_status, approval_status'),
    supabaseAdmin
      .from('workflow_errors')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
  ]);

  if (inquiriesResult.error) {
    throw normalizeError('listing inquiries', inquiriesResult.error);
  }
  if (summaryInquiriesResult.error) {
    throw normalizeError('computing inquiry summary', summaryInquiriesResult.error);
  }
  if (openErrorsResult.error) {
    throw normalizeError('counting open workflow errors', openErrorsResult.error);
  }

  const rawRows = (inquiriesResult.data ?? []).map((row) => {
    const { contact, ...inquiryFields } = row as InquiryRow & {
      contact: ContactRow | ContactRow[] | null;
    };
    return {
      ...inquiryFields,
      contact: unwrapSingleRelation(contact),
    };
  });

  const searchLower = query.search?.toLowerCase();
  const filteredRows = searchLower
    ? rawRows.filter((row) => {
        const haystack = [
          row.submission_id,
          row.service_type,
          row.project_description,
          row.contact?.full_name,
          row.contact?.email,
          row.contact?.company_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchLower);
      })
    : rawRows;

  const total = filteredRows.length;
  const pagedRows = filteredRows.slice(query.offset, query.offset + query.limit);
  const inquiryIds = pagedRows.map((row) => row.id);

  const latestAnalysisByInquiry = new Map<string, LeadAnalysisRow>();
  const initialEmailByInquiry = new Map<string, EmailMessageRow>();

  if (inquiryIds.length > 0) {
    const [analysesResult, emailsResult] = await Promise.all([
      supabaseAdmin
        .from('lead_analyses')
        .select('*')
        .in('inquiry_id', inquiryIds)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('email_messages')
        .select('*')
        .in('inquiry_id', inquiryIds)
        .eq('message_type', 'initial')
        .eq('direction', 'outbound')
        .order('created_at', { ascending: false }),
    ]);

    if (analysesResult.error) {
      throw normalizeError('loading lead analyses', analysesResult.error);
    }
    if (emailsResult.error) {
      throw normalizeError('loading email drafts', emailsResult.error);
    }

    for (const analysis of (analysesResult.data ?? []) as LeadAnalysisRow[]) {
      if (!latestAnalysisByInquiry.has(analysis.inquiry_id)) {
        latestAnalysisByInquiry.set(analysis.inquiry_id, analysis);
      }
    }

    for (const email of (emailsResult.data ?? []) as EmailMessageRow[]) {
      if (!initialEmailByInquiry.has(email.inquiry_id)) {
        initialEmailByInquiry.set(email.inquiry_id, email);
      }
    }
  }

  const items = pagedRows.map((row) => ({
    ...row,
    latest_analysis: latestAnalysisByInquiry.get(row.id) ?? null,
    initial_email: initialEmailByInquiry.get(row.id) ?? null,
  }));

  const allSummaryRows = summaryInquiriesResult.data ?? [];
  const summary = {
    total: allSummaryRows.length,
    pending_approval: allSummaryRows.filter((r) => r.approval_status === 'pending').length,
    qualified: allSummaryRows.filter((r) => r.lead_status === 'qualified').length,
    needs_review: allSummaryRows.filter((r) => r.lead_status === 'needs_review').length,
    not_qualified: allSummaryRows.filter((r) => r.lead_status === 'not_qualified').length,
    contacted: allSummaryRows.filter((r) => r.lead_status === 'contacted').length,
    replied: allSummaryRows.filter((r) => r.lead_status === 'replied').length,
    closed: allSummaryRows.filter((r) => r.lead_status === 'closed').length,
    won: allSummaryRows.filter((r) => r.lead_status === 'won').length,
    open_workflow_errors: openErrorsResult.count ?? 0,
  };

  return {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
    summary,
  };
}

export async function getInquiryDetail(inquiryId: string) {
  const [inquiryResult, analysesResult, emailsResult, logsResult, errorsResult] =
    await Promise.all([
      supabaseAdmin
        .from('inquiries')
        .select(
          `
          *,
          contact:contacts (
            id,
            full_name,
            email,
            company_name,
            phone,
            hubspot_contact_id,
            created_at,
            updated_at
          )
        `,
        )
        .eq('id', inquiryId)
        .maybeSingle(),
      supabaseAdmin
        .from('lead_analyses')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('email_messages')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('activity_logs')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('workflow_errors')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: false }),
    ]);

  if (inquiryResult.error) {
    throw normalizeError('loading inquiry detail', inquiryResult.error);
  }
  if (!inquiryResult.data) {
    throw new AppError(404, 'NOT_FOUND', 'Inquiry not found');
  }
  if (analysesResult.error) {
    throw normalizeError('loading inquiry analyses', analysesResult.error);
  }
  if (emailsResult.error) {
    throw normalizeError('loading inquiry email messages', emailsResult.error);
  }
  if (logsResult.error) {
    throw normalizeError('loading inquiry activity logs', logsResult.error);
  }
  if (errorsResult.error) {
    throw normalizeError('loading inquiry workflow errors', errorsResult.error);
  }

  const { contact, ...inquiryFields } = inquiryResult.data as InquiryRow & {
    contact: ContactRow | ContactRow[] | null;
  };
  const leadAnalyses = (analysesResult.data ?? []) as LeadAnalysisRow[];
  const emailMessages = (emailsResult.data ?? []) as EmailMessageRow[];
  const activityLogs = (logsResult.data ?? []) as ActivityLogRow[];
  const workflowErrors = (errorsResult.data ?? []) as WorkflowErrorRow[];

  const initialEmail =
    emailMessages.find(
      (msg) => msg.message_type === 'initial' && msg.direction === 'outbound',
    ) ?? null;

  return {
    inquiry: {
      ...inquiryFields,
      contact: unwrapSingleRelation(contact),
    },
    latest_analysis: leadAnalyses[0] ?? null,
    lead_analyses: leadAnalyses,
    initial_email: initialEmail,
    email_messages: emailMessages,
    activity_logs: activityLogs,
    workflow_errors: workflowErrors,
  };
}

async function resolvePendingInitialEmail(
  inquiryId: string,
  requestedEmailId?: string,
): Promise<{ inquiry: InquiryRow; emailMessage: EmailMessageRow }> {
  const { data: inquiry, error: inquiryError } = await supabaseAdmin
    .from('inquiries')
    .select('*')
    .eq('id', inquiryId)
    .maybeSingle();

  if (inquiryError) {
    throw normalizeError('loading inquiry for approval', inquiryError);
  }
  if (!inquiry) {
    throw new AppError(404, 'NOT_FOUND', 'Inquiry not found');
  }

  let emailQuery = supabaseAdmin
    .from('email_messages')
    .select('*')
    .eq('inquiry_id', inquiryId);

  if (requestedEmailId) {
    emailQuery = emailQuery.eq('id', requestedEmailId);
  } else {
    emailQuery = emailQuery
      .eq('message_type', 'initial')
      .eq('direction', 'outbound')
      .order('created_at', { ascending: false })
      .limit(1);
  }

  const { data: emailRows, error: emailError } = await emailQuery;

  if (emailError) {
    throw normalizeError('loading email draft for approval', emailError);
  }

  const emailMessage = (emailRows?.[0] ?? null) as EmailMessageRow | null;
  if (!emailMessage) {
    throw new AppError(
      404,
      'NOT_FOUND',
      'Operational email draft not found for this inquiry',
    );
  }

  return { inquiry: inquiry as InquiryRow, emailMessage };
}

export async function buildApproveWf02Payload(
  inquiryId: string,
  input: ApproveInquiryInput,
  user: AuthenticatedUser,
): Promise<Wf02ApprovalPayload> {
  const { inquiry, emailMessage } = await resolvePendingInitialEmail(
    inquiryId,
    input.email_message_id,
  );

  if (inquiry.approval_status !== 'pending') {
    throw new AppError(
      409,
      'CONFLICT',
      `Inquiry cannot be approved while approval_status is '${inquiry.approval_status}'`,
    );
  }

  if (emailMessage.status !== 'pending_approval') {
    throw new AppError(
      409,
      'CONFLICT',
      `Email draft cannot be approved while status is '${emailMessage.status}'`,
    );
  }

  if (inquiry.unsubscribed_at) {
    throw new AppError(
      409,
      'CONFLICT',
      'Cannot approve outbound email for an unsubscribed inquiry',
    );
  }

  return {
    inquiry_id: inquiry.id,
    email_message_id: emailMessage.id,
    action: 'approve',
    approved_by: user.id,
    ...(input.subject !== undefined ? { subject: input.subject } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
  };
}

export async function buildRejectWf02Payload(
  inquiryId: string,
  input: RejectInquiryInput,
  user: AuthenticatedUser,
): Promise<Wf02ApprovalPayload> {
  const { inquiry, emailMessage } = await resolvePendingInitialEmail(
    inquiryId,
    input.email_message_id,
  );

  if (inquiry.approval_status !== 'pending') {
    throw new AppError(
      409,
      'CONFLICT',
      `Inquiry cannot be rejected while approval_status is '${inquiry.approval_status}'`,
    );
  }

  if (emailMessage.status !== 'pending_approval') {
    throw new AppError(
      409,
      'CONFLICT',
      `Email draft cannot be rejected while status is '${emailMessage.status}'`,
    );
  }

  return {
    inquiry_id: inquiry.id,
    email_message_id: emailMessage.id,
    action: 'reject',
    approved_by: user.id,
    ...(input.rejection_reason !== undefined
      ? { rejection_reason: input.rejection_reason }
      : {}),
  };
}

export async function updateInquiryStatus(
  inquiryId: string,
  input: UpdateInquiryStatusInput,
  user: AuthenticatedUser,
) {
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('inquiries')
    .select('*')
    .eq('id', inquiryId)
    .maybeSingle();

  if (fetchError) {
    throw normalizeError('loading inquiry for status update', fetchError);
  }
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Inquiry not found');
  }

  const current = existing as InquiryRow;
  const updateFields: Record<string, unknown> = {};

  if (input.lead_status) {
    updateFields.lead_status = input.lead_status;
    if (current.followup_status === 'scheduled') {
      updateFields.followup_status = 'stopped';
    }
  }

  if (input.unsubscribed === true) {
    updateFields.unsubscribed_at = current.unsubscribed_at ?? new Date().toISOString();
    updateFields.followup_status = 'stopped';
  } else if (input.unsubscribed === false) {
    updateFields.unsubscribed_at = null;
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('inquiries')
    .update(updateFields)
    .eq('id', inquiryId)
    .select('*')
    .single();

  if (updateError || !updated) {
    throw normalizeError('updating inquiry status', updateError);
  }

  const updatedRow = updated as InquiryRow;
  const eventType =
    input.unsubscribed === true && !input.lead_status
      ? 'inquiry_unsubscribed'
      : 'inquiry_status_updated';

  const { data: activityLog, error: logError } = await supabaseAdmin
    .from('activity_logs')
    .insert({
      inquiry_id: inquiryId,
      event_type: eventType,
      event_data: {
        updated_by: user.id,
        updated_by_email: user.email,
        previous: {
          lead_status: current.lead_status,
          followup_status: current.followup_status,
          unsubscribed_at: current.unsubscribed_at,
        },
        current: {
          lead_status: updatedRow.lead_status,
          followup_status: updatedRow.followup_status,
          unsubscribed_at: updatedRow.unsubscribed_at,
        },
        ...(input.note ? { note: input.note } : {}),
      },
    })
    .select('*')
    .single();

  if (logError) {
    throw normalizeError('recording inquiry status activity log', logError);
  }

  return {
    inquiry: updatedRow,
    activity_log: activityLog as ActivityLogRow,
  };
}

export async function listWorkflowErrors(query: ListWorkflowErrorsQuery) {
  let dbQuery = supabaseAdmin
    .from('workflow_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(query.limit);

  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }

  const { data, error } = await dbQuery;
  if (error) {
    throw normalizeError('listing workflow errors', error);
  }

  const items = (data ?? []) as WorkflowErrorRow[];
  return {
    items,
    total: items.length,
  };
}
