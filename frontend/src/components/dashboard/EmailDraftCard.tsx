import {
  AlertCircle,
  CheckCircle2,
  FileCode2,
  Loader2,
  Mail,
  Send,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { EmailStatusBadge, formatDateTime } from '@/components/dashboard/StatusBadges';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type {
  ApprovalStatus,
  EmailMessageRecord,
  LeadAnalysisRecord,
} from '@/types/dashboard';

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
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
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
    setRejectDialogOpen(false);
    setFeedback(null);
  }, [initialEmail?.id, initialEmail?.subject, initialEmail?.body]);

  if (!initialEmail) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" strokeWidth={1.75} />
            Operational Email Draft
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            No operational email draft was created for this lead (typically
            because the inquiry was classified as{' '}
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
              not_qualified
            </span>{' '}
            or is still processing).
          </p>
        </CardContent>
      </Card>
    );
  }

  const canReview =
    inquiryApprovalStatus === 'pending' &&
    initialEmail.status === 'pending_approval';
  const approveBlockedByUnsubscribe = Boolean(unsubscribedAt);

  async function handleApprove() {
    if (!initialEmail) return;
    if (!subject.trim() || !body.trim()) {
      const msg = 'Subject and email body are required before approving.';
      setFeedback({ type: 'error', message: msg });
      toast.error(msg);
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
      const msg =
        'Approval accepted and forwarded to WF02 for email dispatch.';
      setFeedback({ type: 'success', message: msg });
      toast.success('Email approved & queued', { description: msg });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to submit approval action.';
      setFeedback({ type: 'error', message: msg });
      toast.error('Approval failed', { description: msg });
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
      setRejectDialogOpen(false);
      const msg = 'Rejection accepted and forwarded to WF02.';
      setFeedback({ type: 'success', message: msg });
      toast.success('Draft rejected', { description: msg });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to submit rejection.';
      setFeedback({ type: 'error', message: msg });
      toast.error('Rejection failed', { description: msg });
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" strokeWidth={1.75} />
              Human-in-the-Loop Email Draft
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                To:{' '}
                <span className="font-mono text-foreground">
                  {initialEmail.recipient_email}
                </span>
              </span>
              <span className="text-border">•</span>
              <span className="truncate font-mono text-[11px]">
                {initialEmail.idempotency_key}
              </span>
            </CardDescription>
          </div>
          <EmailStatusBadge status={initialEmail.status} />
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <Tabs defaultValue="operational">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <TabsList>
                <TabsTrigger value="operational">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Operational Draft
                </TabsTrigger>
                {latestAnalysis?.draft_email && (
                  <TabsTrigger value="snapshot">
                    <FileCode2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Raw AI Snapshot (Audit)
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="operational" className="space-y-4 pt-1">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email-draft-subject">Subject</Label>
                  <Input
                    id="email-draft-subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!canReview || submittingAction !== null}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email-draft-body">Email Body</Label>
                  <Textarea
                    id="email-draft-body"
                    rows={9}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={!canReview || submittingAction !== null}
                    className="leading-relaxed"
                  />
                </div>
              </div>

              {feedback && (
                <div
                  role="status"
                  className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                    feedback.type === 'success'
                      ? 'border-success-border bg-success-soft text-success'
                      : 'border-danger-border bg-danger-soft text-danger'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      strokeWidth={1.75}
                    />
                  ) : (
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      strokeWidth={1.75}
                    />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {canReview ? (
                <div className="space-y-3 pt-1">
                  {approveBlockedByUnsubscribe && (
                    <div className="rounded-lg border border-warning-border bg-warning-soft px-3.5 py-2.5 text-xs text-warning">
                      This inquiry has been marked as unsubscribed. Approving
                      outbound email is disabled.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      type="button"
                      variant="success"
                      onClick={handleApprove}
                      disabled={
                        submittingAction !== null || approveBlockedByUnsubscribe
                      }
                    >
                      {submittingAction === 'approve' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" strokeWidth={1.75} />
                      )}
                      Approve &amp; Send
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={submittingAction !== null}
                      className="border-danger-border text-danger hover:bg-danger-soft hover:text-danger"
                    >
                      <XCircle className="h-4 w-4" strokeWidth={1.75} />
                      Reject Draft
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-3.5 text-xs sm:grid-cols-3">
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Approved At
                    </span>
                    <span className="mt-0.5 block font-mono font-medium tabular-nums text-foreground">
                      {formatDateTime(initialEmail.approved_at)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Sent At
                    </span>
                    <span className="mt-0.5 block font-mono font-medium tabular-nums text-foreground">
                      {formatDateTime(initialEmail.sent_at)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      Provider ID
                    </span>
                    <span className="mt-0.5 block truncate font-mono font-medium text-foreground">
                      {initialEmail.provider_message_id ?? '—'}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            {latestAnalysis?.draft_email && (
              <TabsContent value="snapshot" className="pt-1">
                <p className="mb-2 text-xs text-muted-foreground">
                  Immutable raw LLM output preserved in{' '}
                  <span className="font-mono text-foreground">
                    lead_analyses.draft_email
                  </span>{' '}
                  for audit traceability.
                </p>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-secondary-foreground">
                  {latestAnalysis.draft_email}
                </pre>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Outbound Email Draft?</DialogTitle>
            <DialogDescription>
              This will mark the draft as rejected, cancel automated delivery,
              and close the approval request via WF02.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="reject-reason-input">
              Rejection Reason{' '}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="reject-reason-input"
              type="text"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Out of Q4 delivery capacity or duplicate outreach"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={submittingAction !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={submittingAction !== null}
            >
              {submittingAction === 'reject' && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
