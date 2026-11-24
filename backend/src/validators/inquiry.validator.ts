import { z } from 'zod';

// Strictly aligned with CHECK constraints in database/schema/LeadFlowAI.sql
export const LEAD_STATUS_VALUES = [
  'new',
  'processing',
  'qualified',
  'needs_review',
  'not_qualified',
  'contacted',
  'replied',
  'closed',
  'won',
] as const;

export const PRIORITY_VALUES = ['low', 'medium', 'high'] as const;

export const APPROVAL_STATUS_VALUES = [
  'not_required',
  'pending',
  'approved',
  'rejected',
] as const;

export const FOLLOWUP_STATUS_VALUES = [
  'not_eligible',
  'scheduled',
  'sent',
  'stopped',
] as const;

export const EMAIL_STATUS_VALUES = [
  'draft',
  'pending_approval',
  'approved',
  'queued',
  'sent',
  'failed',
  'cancelled',
] as const;

export const MANUAL_LEAD_STATUS_VALUES = ['replied', 'closed', 'won'] as const;

export const WORKFLOW_ERROR_STATUS_VALUES = ['open', 'resolved'] as const;

export type LeadStatus = (typeof LEAD_STATUS_VALUES)[number];
export type Priority = (typeof PRIORITY_VALUES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUS_VALUES)[number];
export type FollowupStatus = (typeof FOLLOWUP_STATUS_VALUES)[number];
export type EmailStatus = (typeof EMAIL_STATUS_VALUES)[number];
export type ManualLeadStatus = (typeof MANUAL_LEAD_STATUS_VALUES)[number];
export type WorkflowErrorStatus = (typeof WORKFLOW_ERROR_STATUS_VALUES)[number];

const inquiryIdSchema = z.string().trim().uuid('Invalid inquiry ID format');

const emptyToUndefined = (val: unknown) => {
  if (typeof val === 'string' && val.trim() === '') return undefined;
  return val;
};

const optionalTrimmedString = (maxLength: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(maxLength).optional(),
  );

const listInquiriesQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, z.enum(LEAD_STATUS_VALUES).optional()),
  priority: z.preprocess(emptyToUndefined, z.enum(PRIORITY_VALUES).optional()),
  approval_status: z.preprocess(
    emptyToUndefined,
    z.enum(APPROVAL_STATUS_VALUES).optional(),
  ),
  search: optionalTrimmedString(120),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const approveInquiryBodySchema = z
  .object({
    email_message_id: z.preprocess(
      emptyToUndefined,
      z.string().trim().uuid('Invalid email_message_id format').optional(),
    ),
    subject: optionalTrimmedString(250),
    body: optionalTrimmedString(10000),
  })
  .default({});

const rejectInquiryBodySchema = z
  .object({
    email_message_id: z.preprocess(
      emptyToUndefined,
      z.string().trim().uuid('Invalid email_message_id format').optional(),
    ),
    reason: optionalTrimmedString(1000),
    rejection_reason: optionalTrimmedString(1000),
  })
  .default({});

const updateInquiryStatusBodySchema = z
  .object({
    lead_status: z.enum(MANUAL_LEAD_STATUS_VALUES).optional(),
    unsubscribed: z.boolean().optional(),
    note: optionalTrimmedString(500),
  })
  .refine(
    (data) => data.lead_status !== undefined || data.unsubscribed !== undefined,
    {
      message: 'Provide at least lead_status (replied, closed, won) or unsubscribed',
      path: ['lead_status'],
    },
  );

const listWorkflowErrorsQuerySchema = z.object({
  status: z.preprocess(
    emptyToUndefined,
    z.enum(WORKFLOW_ERROR_STATUS_VALUES).optional(),
  ),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>;
export type ApproveInquiryInput = z.infer<typeof approveInquiryBodySchema>;
export type UpdateInquiryStatusInput = z.infer<typeof updateInquiryStatusBodySchema>;
export type ListWorkflowErrorsQuery = z.infer<typeof listWorkflowErrorsQuerySchema>;

export interface RejectInquiryInput {
  email_message_id?: string;
  rejection_reason?: string;
}

export function parseInquiryId(rawId: unknown): string {
  return inquiryIdSchema.parse(rawId);
}

export function parseListInquiriesQuery(rawQuery: unknown): ListInquiriesQuery {
  return listInquiriesQuerySchema.parse(rawQuery);
}

export function parseApproveInquiryBody(rawBody: unknown): ApproveInquiryInput {
  return approveInquiryBodySchema.parse(rawBody ?? {});
}

export function parseRejectInquiryBody(rawBody: unknown): RejectInquiryInput {
  const parsed = rejectInquiryBodySchema.parse(rawBody ?? {});
  return {
    ...(parsed.email_message_id ? { email_message_id: parsed.email_message_id } : {}),
    ...(parsed.rejection_reason ?? parsed.reason
      ? { rejection_reason: parsed.rejection_reason ?? parsed.reason }
      : {}),
  };
}

export function parseUpdateInquiryStatusBody(
  rawBody: unknown,
): UpdateInquiryStatusInput {
  return updateInquiryStatusBodySchema.parse(rawBody ?? {});
}

export function parseListWorkflowErrorsQuery(
  rawQuery: unknown,
): ListWorkflowErrorsQuery {
  return listWorkflowErrorsQuerySchema.parse(rawQuery);
}
