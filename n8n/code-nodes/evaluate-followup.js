/**
 * LeadFlow AI — Deterministic Follow-up Eligibility & Template Engine (WF03)
 *
 * Implements:
 * - docs/architecture/02-dataflow-and-states.md (WF03 follow-up rules & state machine)
 * - docs/architecture/03-api-and-rls-contract.md (Section 3 idempotency key convention)
 * - docs/DECISIONS.md (ADR-008 deterministic follow-up template & reconciliation)
 *
 * Non-Negotiable Invariant #1:
 *   No LLM call is used for automated follow-ups. Eligibility, stop rules,
 *   reconciliation, and fixed-template email rendering are pure deterministic JS.
 */

const FOLLOWUP_DELAY_HOURS = 24;
const MAX_BATCH = 25;
const STOP_LEAD_STATUSES = ['replied', 'closed', 'won'];

function firstNameOf(fullName) {
  const first = String(fullName || '').trim().split(/\s+/)[0];
  return first || 'there';
}

function buildFollowupEmail(firstName, serviceType) {
  const topic = serviceType ? `your ${serviceType} project` : 'your project';
  return {
    subject: 'Following up on your project inquiry',
    body: [
      `Hi ${firstName},`,
      '',
      `I wanted to follow up on your recent inquiry with Veloce Digital about ${topic}. If you are still exploring options, we would be glad to answer questions or set up a short call to talk through scope and timeline.`,
      '',
      'Simply reply to this email and we will pick the conversation up from there. If you would rather not receive further emails from us, just let us know and we will stop.',
      '',
      'Best regards,',
      'Veloce Digital Team',
    ].join('\n'),
  };
}

function evaluateFollowups({ inquiries, initialEmails, followupEmails, contacts, now = new Date() }) {
  const valid = (rows) => (rows || []).filter((r) => r && r.id);
  const contactById = new Map(valid(contacts).map((c) => [c.id, c]));
  const nowMs = now.getTime();
  const out = [];

  for (const inq of valid(inquiries)) {
    if (inq.followup_status !== 'scheduled') continue;

    // 1. Stop rules (sequence ends permanently)
    let stopReason = null;
    if (inq.unsubscribed_at) stopReason = 'unsubscribed';
    else if (STOP_LEAD_STATUSES.includes(inq.lead_status)) stopReason = `lead_${inq.lead_status}`;
    else if (inq.consent_to_email !== true) stopReason = 'consent_missing';
    if (stopReason) {
      out.push({
        action: 'finalize',
        inquiry_id: inq.id,
        next_followup_status: 'stopped',
        reason: stopReason,
        lead_status: inq.lead_status,
      });
      continue;
    }

    // 2. Only `contacted` leads are eligible; everything else is left untouched
    if (inq.lead_status !== 'contacted') continue;

    // 3. Reconcile: follow-up already exists
    const existing = valid(followupEmails).filter((m) => m.inquiry_id === inq.id);
    if (existing.length > 0) {
      if (existing.some((m) => m.status === 'sent')) {
        out.push({
          action: 'finalize',
          inquiry_id: inq.id,
          next_followup_status: 'sent',
          reason: 'follow_up_already_sent',
          lead_status: inq.lead_status,
        });
      }
      // queued / failed rows are never re-sent automatically (idempotency_key is unique)
      continue;
    }

    // 4. Need a delivered initial email older than the delay window
    const sentInitials = valid(initialEmails)
      .filter((m) => m.inquiry_id === inq.id && m.status === 'sent' && m.sent_at)
      .sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    const initial = sentInitials[0];
    if (!initial) continue;
    const ageHours = (nowMs - new Date(initial.sent_at).getTime()) / 3600000;
    if (!(ageHours >= FOLLOWUP_DELAY_HOURS)) continue;

    const recipient = String(initial.recipient_email || '').trim().toLowerCase();
    if (!recipient) continue;

    const contact = contactById.get(inq.contact_id);
    const email = buildFollowupEmail(firstNameOf(contact && contact.full_name), inq.service_type);
    out.push({
      action: 'send',
      inquiry_id: inq.id,
      submission_id: inq.submission_id,
      recipient_email: recipient,
      subject: email.subject,
      body: email.body,
      idempotency_key: `email:${inq.id}:follow_up_1`,
      initial_email_id: initial.id,
      hours_since_initial: Math.floor(ageHours),
    });
  }

  // Cap sends per run; finalize actions are cheap and always processed
  let sends = 0;
  return out.filter((o) => (o.action === 'send' ? ++sends <= MAX_BATCH : true));
}

module.exports = {
  FOLLOWUP_DELAY_HOURS,
  MAX_BATCH,
  STOP_LEAD_STATUSES,
  firstNameOf,
  buildFollowupEmail,
  evaluateFollowups,
};
