import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  MailCheck,
  MailX,
  Phone,
  Sparkles,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmailDraftCard } from '@/components/dashboard/EmailDraftCard';
import { ScoreBreakdownCard } from '@/components/dashboard/ScoreBreakdownCard';
import {
  ApprovalBadge,
  FollowupBadge,
  LeadStatusBadge,
  PriorityBadge,
  formatBudgetRange,
  formatDateTime,
} from '@/components/dashboard/StatusBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type {
  InquiryDetailResponse,
  ManualLeadStatus,
} from '@/types/dashboard';

interface Props {
  detail: InquiryDetailResponse;
  onApprove: (payload: {
    email_message_id: string;
    subject: string;
    body: string;
  }) => Promise<void>;
  onReject: (payload: {
    email_message_id: string;
    reason?: string;
  }) => Promise<void>;
  onUpdateStatus: (payload: {
    lead_status?: ManualLeadStatus;
    unsubscribed?: boolean;
  }) => Promise<void>;
}

export function InquiryDetailPanel({
  detail,
  onApprove,
  onReject,
  onUpdateStatus,
}: Props) {
  const {
    inquiry,
    latest_analysis,
    initial_email,
    activity_logs,
    workflow_errors,
  } = detail;
  const contact = inquiry.contact;

  const [statusLoading, setStatusLoading] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  async function handleStatusAction(
    key: string,
    payload: { lead_status?: ManualLeadStatus; unsubscribed?: boolean },
    successMessage: string,
  ) {
    setStatusLoading(key);
    setStatusFeedback(null);
    try {
      await onUpdateStatus(payload);
      setStatusFeedback({ type: 'success', message: successMessage });
      toast.success(successMessage);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update inquiry status.';
      setStatusFeedback({ type: 'error', message: msg });
      toast.error('Status update failed', { description: msg });
    } finally {
      setStatusLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header & Contact Summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                  {contact?.full_name ?? 'Unknown Contact'}
                </h2>
                <PriorityBadge priority={inquiry.priority} />
                <LeadStatusBadge status={inquiry.lead_status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                  {contact?.email ?? '—'}
                </span>
                {contact?.company_name && (
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {contact.company_name}
                  </span>
                )}
                {contact?.phone && (
                  <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {contact.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {formatDateTime(inquiry.created_at)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ApprovalBadge status={inquiry.approval_status} />
              <FollowupBadge status={inquiry.followup_status} />
            </div>
          </div>

          <Separator className="my-4" />

          {/* 4 Key Commercial & Integration Specs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <DollarSign className="h-3 w-3" strokeWidth={1.75} />
                Budget
              </span>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatBudgetRange(
                  inquiry.budget_min,
                  inquiry.budget_max,
                  inquiry.budget_currency,
                )}
              </p>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" strokeWidth={1.75} />
                Timeline
              </span>
              <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                {inquiry.timeline_weeks
                  ? `${inquiry.timeline_weeks} weeks`
                  : 'Unspecified'}
              </p>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {inquiry.consent_to_email && !inquiry.unsubscribed_at ? (
                  <MailCheck
                    className="h-3 w-3 text-emerald-600"
                    strokeWidth={1.75}
                  />
                ) : (
                  <MailX
                    className="h-3 w-3 text-rose-600"
                    strokeWidth={1.75}
                  />
                )}
                Email Consent
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {inquiry.unsubscribed_at
                  ? 'Unsubscribed'
                  : inquiry.consent_to_email
                    ? 'Granted'
                    : 'No Consent'}
              </p>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
              <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                HubSpot CRM
              </span>
              <p className="mt-1 truncate font-mono text-xs font-semibold text-foreground">
                {contact?.hubspot_contact_id ?? 'Not synced'}
              </p>
            </div>
          </div>

          {/* Submitted Project Brief */}
          <div className="mt-4 rounded-lg border border-border/80 bg-muted/30 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground">
                Submitted Project Brief
                {inquiry.service_type ? (
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    · {inquiry.service_type}
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {inquiry.submission_id}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-secondary-foreground">
              {inquiry.project_description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Qualification Summary + Recharts Score Breakdown */}
      {latest_analysis ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <Card className="xl:col-span-5">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
                AI Qualification Summary
              </CardTitle>
              <Badge variant="neutral" className="font-mono text-[11px]">
                {latest_analysis.model_name ?? 'AI'}
                {latest_analysis.prompt_version
                  ? ` · ${latest_analysis.prompt_version}`
                  : ''}
              </Badge>
            </CardHeader>

            <Separator />

            <CardContent className="space-y-4 pt-4 text-sm">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Detected Service
                </span>
                <p className="mt-1 font-medium text-primary">
                  {latest_analysis.detected_service ?? '—'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Executive Summary
                </span>
                <p className="mt-1 leading-relaxed text-secondary-foreground">
                  {latest_analysis.project_summary ?? 'No summary available.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="font-normal">
                  Scope fit:{' '}
                  <strong className="ml-1 font-semibold uppercase text-foreground">
                    {latest_analysis.scope_fit ?? '—'}
                  </strong>
                </Badge>
                <Badge
                  variant={latest_analysis.spam_suspected ? 'danger' : 'neutral'}
                  className="font-normal"
                >
                  Spam suspected:{' '}
                  <strong className="ml-1 font-semibold">
                    {latest_analysis.spam_suspected ? 'YES' : 'No'}
                  </strong>
                </Badge>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Missing Information (
                  {Array.isArray(latest_analysis.missing_information)
                    ? latest_analysis.missing_information.length
                    : 0}
                  )
                </span>
                {Array.isArray(latest_analysis.missing_information) &&
                latest_analysis.missing_information.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {latest_analysis.missing_information.map((item, idx) => (
                      <li
                        key={`${idx}-${item}`}
                        className="flex items-start gap-2 rounded-md border border-warning-border bg-warning-soft px-2.5 py-1.5 text-xs text-warning"
                      >
                        <AlertTriangle
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          strokeWidth={1.75}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    All key project details provided.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="xl:col-span-7">
            <ScoreBreakdownCard analysis={latest_analysis} />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            AI qualification analysis has not been recorded for this inquiry yet.
          </CardContent>
        </Card>
      )}

      {/* Email Draft Approval Panel */}
      <EmailDraftCard
        inquiryApprovalStatus={inquiry.approval_status}
        unsubscribedAt={inquiry.unsubscribed_at}
        initialEmail={initial_email}
        latestAnalysis={latest_analysis}
        onApprove={onApprove}
        onReject={onReject}
      />

      {/* Manual Lifecycle Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Manual Lifecycle &amp; Consent Controls</CardTitle>
          <CardDescription>
            Updates inquiry state directly in Supabase and writes an audit event
            to{' '}
            <span className="font-mono text-foreground">activity_logs</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['replied', 'won', 'closed'] as const).map((targetStatus) => (
              <Button
                key={targetStatus}
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  statusLoading !== null || inquiry.lead_status === targetStatus
                }
                onClick={() =>
                  handleStatusAction(
                    targetStatus,
                    { lead_status: targetStatus },
                    `Lead status updated to '${targetStatus}'.`,
                  )
                }
              >
                {statusLoading === targetStatus && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Mark {targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1)}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={statusLoading !== null || Boolean(inquiry.unsubscribed_at)}
              onClick={() =>
                handleStatusAction(
                  'unsubscribed',
                  { unsubscribed: true },
                  'Marked unsubscribed and stopped automated follow-ups.',
                )
              }
              className="border-danger-border text-danger hover:bg-danger-soft hover:text-danger"
            >
              {statusLoading === 'unsubscribed' && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {inquiry.unsubscribed_at ? 'Unsubscribed' : 'Mark Unsubscribed'}
            </Button>
          </div>

          {statusFeedback && (
            <p
              className={`mt-3 text-xs font-medium ${
                statusFeedback.type === 'success'
                  ? 'text-success'
                  : 'text-danger'
              }`}
            >
              {statusFeedback.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Inquiry-Scoped Workflow Errors */}
      {workflow_errors.length > 0 && (
        <Card className="border-danger-border bg-danger-soft/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
              Workflow Errors ({workflow_errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {workflow_errors.map((err) => (
              <div
                key={err.id}
                className="rounded-lg border border-danger-border bg-card p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-danger">
                    {err.workflow_name}
                    {err.node_name ? ` → ${err.node_name}` : ''}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {formatDateTime(err.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-secondary-foreground">
                  {err.error_message}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Activity Logs Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Activity Timeline ({activity_logs.length})
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {activity_logs.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No activity events recorded yet.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {activity_logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-border/80 bg-muted/35 p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-primary">
                      {log.event_type}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  {log.event_data && Object.keys(log.event_data).length > 0 && (
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md border border-border/70 bg-card p-2.5 font-mono text-[11px] text-secondary-foreground">
                      {JSON.stringify(log.event_data, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
