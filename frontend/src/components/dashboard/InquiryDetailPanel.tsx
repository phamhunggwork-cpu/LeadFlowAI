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
import type {
  InquiryDetailResponse,
  ManualLeadStatus,
} from '../../types/dashboard';
import { EmailDraftCard } from './EmailDraftCard';
import { ScoreBreakdownCard } from './ScoreBreakdownCard';
import {
  ApprovalBadge,
  FollowupBadge,
  LeadStatusBadge,
  PriorityBadge,
  formatBudgetRange,
  formatDateTime,
} from './StatusBadges';

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
  const { inquiry, latest_analysis, initial_email, activity_logs, workflow_errors } =
    detail;
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
    } catch (err: unknown) {
      setStatusFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to update inquiry status.',
      });
    } finally {
      setStatusLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header & Contact Summary */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {contact?.full_name ?? 'Unknown Contact'}
              </h2>
              <PriorityBadge priority={inquiry.priority} />
              <LeadStatusBadge status={inquiry.lead_status} />
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-slate-200">
                <User className="h-3.5 w-3.5 text-sky-400" />
                {contact?.email ?? '—'}
              </span>
              {contact?.company_name && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  {contact.company_name}
                </span>
              )}
              {contact?.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  {contact.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                {formatDateTime(inquiry.created_at)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ApprovalBadge status={inquiry.approval_status} />
            <FollowupBadge status={inquiry.followup_status} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <DollarSign className="h-3 w-3" />
              Budget
            </span>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatBudgetRange(
                inquiry.budget_min,
                inquiry.budget_max,
                inquiry.budget_currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <Clock className="h-3 w-3" />
              Timeline
            </span>
            <p className="mt-1 text-sm font-semibold text-white">
              {inquiry.timeline_weeks ? `${inquiry.timeline_weeks} weeks` : 'Unspecified'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              {inquiry.consent_to_email && !inquiry.unsubscribed_at ? (
                <MailCheck className="h-3 w-3 text-emerald-400" />
              ) : (
                <MailX className="h-3 w-3 text-rose-400" />
              )}
              Email Consent
            </span>
            <p className="mt-1 text-sm font-semibold text-white">
              {inquiry.unsubscribed_at
                ? 'Unsubscribed'
                : inquiry.consent_to_email
                  ? 'Granted'
                  : 'No Consent'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <ExternalLink className="h-3 w-3" />
              HubSpot CRM
            </span>
            <p className="mt-1 truncate font-mono text-xs font-medium text-slate-200">
              {contact?.hubspot_contact_id ?? 'Not synced'}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-300">
              Submitted Project Brief{' '}
              {inquiry.service_type ? `· ${inquiry.service_type}` : ''}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {inquiry.submission_id}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {inquiry.project_description}
          </p>
        </div>
      </section>

      {/* AI Qualification Summary + Score Breakdown */}
      {latest_analysis ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-sky-400" />
                AI Qualification Summary
              </h3>
              <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-0.5 font-mono text-[11px] text-slate-300">
                {latest_analysis.model_name ?? 'AI'}
                {latest_analysis.prompt_version
                  ? ` · ${latest_analysis.prompt_version}`
                  : ''}
              </span>
            </div>

            <div className="mt-4 space-y-3.5 text-sm">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Detected Service
                </span>
                <p className="mt-1 font-medium text-sky-300">
                  {latest_analysis.detected_service ?? '—'}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Executive Summary
                </span>
                <p className="mt-1 leading-relaxed text-slate-200">
                  {latest_analysis.project_summary ?? 'No summary available.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <span className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-slate-300">
                  Scope fit:{' '}
                  <strong className="uppercase text-white">
                    {latest_analysis.scope_fit ?? '—'}
                  </strong>
                </span>
                <span
                  className={`rounded-lg border px-2.5 py-1 ${
                    latest_analysis.spam_suspected
                      ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                      : 'border-slate-800 bg-slate-950/70 text-slate-300'
                  }`}
                >
                  Spam suspected:{' '}
                  <strong>{latest_analysis.spam_suspected ? 'YES' : 'No'}</strong>
                </span>
              </div>

              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Missing Information (
                  {Array.isArray(latest_analysis.missing_information)
                    ? latest_analysis.missing_information.length
                    : 0}
                  )
                </span>
                {Array.isArray(latest_analysis.missing_information) &&
                latest_analysis.missing_information.length > 0 ? (
                  <ul className="mt-1.5 space-y-1.5">
                    {latest_analysis.missing_information.map((item, idx) => (
                      <li
                        key={`${idx}-${item}`}
                        className="flex items-start gap-2 text-xs text-amber-200"
                      >
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All key project details provided.
                  </p>
                )}
              </div>
            </div>
          </section>

          <ScoreBreakdownCard analysis={latest_analysis} />
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
          AI qualification analysis has not been recorded for this inquiry yet.
        </section>
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
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Manual Lifecycle &amp; Consent Controls
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Updates inquiry state directly in Supabase and writes an audit event to{' '}
              <span className="font-mono text-slate-300">activity_logs</span>.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {(['replied', 'won', 'closed'] as const).map((targetStatus) => (
            <button
              key={targetStatus}
              type="button"
              disabled={statusLoading !== null || inquiry.lead_status === targetStatus}
              onClick={() =>
                handleStatusAction(
                  targetStatus,
                  { lead_status: targetStatus },
                  `Lead status updated to '${targetStatus}'.`,
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/70 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {statusLoading === targetStatus && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              Mark {targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1)}
            </button>
          ))}

          <button
            type="button"
            disabled={statusLoading !== null || Boolean(inquiry.unsubscribed_at)}
            onClick={() =>
              handleStatusAction(
                'unsubscribed',
                { unsubscribed: true },
                'Marked unsubscribed and stopped automated follow-ups.',
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {statusLoading === 'unsubscribed' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            {inquiry.unsubscribed_at ? 'Unsubscribed' : 'Mark Unsubscribed'}
          </button>
        </div>

        {statusFeedback && (
          <p
            className={`mt-3 text-xs ${
              statusFeedback.type === 'success'
                ? 'text-emerald-300'
                : 'text-rose-300'
            }`}
          >
            {statusFeedback.message}
          </p>
        )}
      </section>

      {/* Inquiry-Scoped Workflow Errors */}
      {workflow_errors.length > 0 && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-200">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            Workflow Errors ({workflow_errors.length})
          </h3>
          <div className="mt-3 space-y-2.5">
            {workflow_errors.map((err) => (
              <div
                key={err.id}
                className="rounded-xl border border-rose-500/20 bg-slate-950/70 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-rose-200">
                    {err.workflow_name}
                    {err.node_name ? ` → ${err.node_name}` : ''}
                  </span>
                  <span className="text-slate-400">
                    {formatDateTime(err.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-slate-300">{err.error_message}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity Logs Timeline */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-sky-400" />
          Activity Timeline ({activity_logs.length})
        </h3>
        {activity_logs.length === 0 ? (
          <p className="mt-2 text-xs text-slate-400">No activity events recorded yet.</p>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {activity_logs.map((log) => (
              <li
                key={log.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-sky-300">
                    {log.event_type}
                  </span>
                  <span className="text-slate-500">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
                {log.event_data && Object.keys(log.event_data).length > 0 && (
                  <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-slate-400">
                    {JSON.stringify(log.event_data, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
