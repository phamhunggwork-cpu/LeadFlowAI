import type {
  ApprovalStatus,
  EmailStatus,
  FollowupStatus,
  LeadStatus,
  Priority,
} from '../../types/dashboard';

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'border-slate-700 bg-slate-800/80 text-slate-300',
  processing: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
  qualified: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  needs_review: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  not_qualified: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  contacted: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
  replied: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300',
  closed: 'border-slate-700 bg-slate-800/70 text-slate-400',
  won: 'border-emerald-400/40 bg-emerald-400/20 text-emerald-200',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  medium: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  low: 'border-slate-700 bg-slate-800/80 text-slate-400',
};

const APPROVAL_STYLES: Record<ApprovalStatus, string> = {
  pending: 'border-amber-400/40 bg-amber-400/15 text-amber-200',
  approved: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  rejected: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  not_required: 'border-slate-700 bg-slate-800/70 text-slate-400',
};

const EMAIL_STATUS_STYLES: Record<EmailStatus, string> = {
  draft: 'border-slate-700 bg-slate-800 text-slate-300',
  pending_approval: 'border-amber-400/40 bg-amber-400/15 text-amber-200',
  approved: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  queued: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300',
  sent: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  failed: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  cancelled: 'border-slate-700 bg-slate-800 text-slate-400',
};

const FOLLOWUP_STYLES: Record<FollowupStatus, string> = {
  not_eligible: 'border-slate-700 bg-slate-800/70 text-slate-400',
  scheduled: 'border-sky-500/30 bg-sky-500/15 text-sky-300',
  sent: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  stopped: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${LEAD_STATUS_STYLES[status] ?? LEAD_STATUS_STYLES.new}`}
    >
      {formatLabel(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.low}`}
    >
      {priority}
    </span>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${APPROVAL_STYLES[status] ?? APPROVAL_STYLES.not_required}`}
    >
      Approval: {formatLabel(status)}
    </span>
  );
}

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${EMAIL_STATUS_STYLES[status] ?? EMAIL_STATUS_STYLES.draft}`}
    >
      {formatLabel(status)}
    </span>
  );
}

export function FollowupBadge({ status }: { status: FollowupStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${FOLLOWUP_STYLES[status] ?? FOLLOWUP_STYLES.not_eligible}`}
    >
      Follow-up: {formatLabel(status)}
    </span>
  );
}

export function formatBudgetRange(
  min: number | null,
  max: number | null,
  currency = 'USD',
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(n);

  if (min !== null && max !== null) {
    return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
  }
  if (max !== null) return `Up to ${fmt(max)}`;
  if (min !== null) return `From ${fmt(min)}`;
  return 'Undisclosed';
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
