import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Send,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  ApprovalStatus,
  EmailMessageRecord,
  LeadAnalysisRecord,
} from '../../types/dashboard';
import { EmailStatusBadge, formatDateTime } from './StatusBadges';

interface Props {
  inquiryApprovalStatus: ApprovalStatus;
  unsubscribedAt: string | null;
  initialEmail: EmailMessageRecord | null;
  latestAnalysis: LeadAnalysisRecord | null;
  onApprove: (payload: {
    email_message_id: string;
    subject: string;
    body: string;
  }) => Promise<void>;
  onReject: (payload: {
    email_message_id: string;
    reason?: string;
  }) => Promise<void>;
}

export function EmailDraftCard({
  inquiryApprovalStatus,
  unsubscribedAt,
  initialEmail,
  latestAnalysis,
  onApprove,
  onReject,
}: Props) {
  const [subject, setSubject] = useState(initialEmail?.subject ?? '');
  const [body, setBody] = useState(initialEmail?.body ?? '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showRawSnapshot, setShowRawSnapshot] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    'approve' | 'reject' | null
  >(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    setSubject(initialEmail?.subject ?? '');
    setBody(initialEmail?.body ?? '');
    setRejectionReason('');
    setShowRejectBox(false);
    setFeedback(null);
  }, [initialEmail?.id, initialEmail?.subject, initialEmail?.body]);

  if (!initialEmail) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Mail className="h-4 w-4 text-sky-400" />
          Operational Email Draft
        </h3>
        <p className="mt-2 text-sm text-slate-400">
          No operational email draft was created for this lead (typically because the
          inquiry was classified as{' '}
          <span className="font-mono text-slate-300">not_qualified</span> or is still
          processing).
        </p>
      </section>
    );
  }

  const canReview =
    inquiryApprovalStatus === 'pending' &&
    initialEmail.status === 'pending_approval';
  const approveBlockedByUnsubscribe = Boolean(unsubscribedAt);

  async function handleApprove() {
    if (!initialEmail) return;
    if (!subject.trim() || !body.trim()) {
      setFeedback({
        type: 'error',
        message: 'Subject and email body are required before approving.',
      });
      return;
    }

    setSubmittingAction('approve');
    setFeedback(null);
    try {
      await onApprove({
        email_message_id: initialEmail.id,
        subject: subject.trim(),
        body: body.trim(),
      });
      setFeedback({
        type: 'success',
        message:
          'Approval accepted and forwarded to WF02 for email dispatch.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Failed to submit approval action.',
      });
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleReject() {
    if (!initialEmail) return;
    setSubmittingAction('reject');
    setFeedback(null);
    try {
      await onReject({
        email_message_id: initialEmail.id,
        ...(rejectionReason.trim() ? { reason: rejectionReason.trim() } : {}),
      });
      setShowRejectBox(false);
      setFeedback({
        type: 'success',
        message: 'Rejection accepted and forwarded to WF02.',
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Failed to submit rejection.',
      });
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail className="h-4 w-4 text-sky-400" />
            Human-in-the-Loop Email Draft
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            To:{' '}
            <span className="font-mono text-slate-200">
              {initialEmail.recipient_email}
            </span>{' '}
            · Key:{' '}
            <span className="font-mono text-slate-400">
              {initialEmail.idempotency_key}
            </span>
          </p>
        </div>
        <EmailStatusBadge status={initialEmail.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="email-draft-subject"
            className="block text-xs font-medium text-slate-300"
          >
            Subject
          </label>
          <input
            id="email-draft-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={!canReview || submittingAction !== null}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>

        <div>
          <label
            htmlFor="email-draft-body"
            className="block text-xs font-medium text-slate-300"
          >
            Email Body
          </label>
          <textarea
            id="email-draft-body"
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!canReview || submittingAction !== null}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2.5 text-sm leading-relaxed text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          />
        </div>
      </div>

      {feedback && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-xs ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {canReview ? (
        <div className="mt-4 space-y-3">
          {approveBlockedByUnsubscribe && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              This inquiry has been marked as unsubscribed. Approving outbound email
              is disabled.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleApprove}
              disabled={submittingAction !== null || approveBlockedByUnsubscribe}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submittingAction === 'approve' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Approve &amp; Send
            </button>

            <button
              type="button"
              onClick={() => setShowRejectBox((prev) => !prev)}
              disabled={submittingAction !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              Reject Draft
            </button>
          </div>

          {showRejectBox && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <label
                htmlFor="reject-reason-input"
                className="block text-xs font-medium text-slate-300"
              >
                Rejection Reason (optional)
              </label>
              <input
                id="reject-reason-input"
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Out of delivery capacity for Q4 or duplicate agency outreach"
                className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={submittingAction !== null}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
                >
                  {submittingAction === 'reject' && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Confirm Reject
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectBox(false)}
                  disabled={submittingAction !== null}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400 sm:grid-cols-3">
          <div>
            <span className="block text-slate-500">Approved At</span>
            <span className="font-medium text-slate-200">
              {formatDateTime(initialEmail.approved_at)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Sent At</span>
            <span className="font-medium text-slate-200">
              {formatDateTime(initialEmail.sent_at)}
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Provider ID</span>
            <span className="font-mono text-slate-200">
              {initialEmail.provider_message_id ?? '—'}
            </span>
          </div>
        </div>
      )}

      {latestAnalysis?.draft_email && (
        <div className="mt-4 border-t border-slate-800 pt-3">
          <button
            type="button"
            onClick={() => setShowRawSnapshot((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            {showRawSnapshot ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Original Immutable AI Snapshot (lead_analyses.draft_email)
          </button>
          {showRawSnapshot && (
            <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/90 p-3 font-mono text-xs text-slate-300">
              {latestAnalysis.draft_email}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
