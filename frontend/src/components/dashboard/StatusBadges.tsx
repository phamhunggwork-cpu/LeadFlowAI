import { Badge, type BadgeProps } from '@/components/ui/badge';
import type {
  ApprovalStatus,
  EmailStatus,
  FollowupStatus,
  LeadStatus,
  Priority,
} from '@/types/dashboard';

type SemanticVariant = NonNullable<BadgeProps['variant']>;

const LEAD_STATUS_VARIANTS: Record<LeadStatus, SemanticVariant> = {
  new: 'neutral',
  processing: 'info',
  qualified: 'success',
  needs_review: 'warning',
  not_qualified: 'danger',
  contacted: 'info',
  replied: 'info',
  closed: 'neutral',
  won: 'success',
};

const PRIORITY_VARIANTS: Record<Priority, SemanticVariant> = {
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

const APPROVAL_VARIANTS: Record<ApprovalStatus, SemanticVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  not_required: 'neutral',
};

const EMAIL_STATUS_VARIANTS: Record<EmailStatus, SemanticVariant> = {
  draft: 'neutral',
  pending_approval: 'warning',
  approved: 'info',
  queued: 'info',
  sent: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

const FOLLOWUP_VARIANTS: Record<FollowupStatus, SemanticVariant> = {
  not_eligible: 'neutral',
  scheduled: 'info',
  sent: 'success',
  stopped: 'danger',
};

function formatLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant={LEAD_STATUS_VARIANTS[status] ?? 'neutral'}>
      {formatLabel(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge
      variant={PRIORITY_VARIANTS[priority] ?? 'neutral'}
      className="px-2 text-[11px] font-semibold uppercase tracking-wide"
    >
      {priority}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge variant={APPROVAL_VARIANTS[status] ?? 'neutral'}>
      Approval: {formatLabel(status)}
    </Badge>
  );
}

export function EmailStatusBadge({ status }: { status: EmailStatus }) {
  return (
    <Badge variant={EMAIL_STATUS_VARIANTS[status] ?? 'neutral'}>
      {formatLabel(status)}
    </Badge>
  );
}

export function FollowupBadge({ status }: { status: FollowupStatus }) {
  return (
    <Badge variant={FOLLOWUP_VARIANTS[status] ?? 'neutral'}>
      Follow-up: {formatLabel(status)}
    </Badge>
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
