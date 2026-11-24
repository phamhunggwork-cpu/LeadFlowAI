import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestRun } from './helpers/cleanup.js';
import {
  apiRequest,
  createSupabaseAdmin,
  loadTestEnv,
  signInTestReviewer,
  type TestEnvConfig,
} from './helpers/env.js';
import { buildScopedLeadPayload } from './helpers/mockLeads.js';
import { pollUntil } from './helpers/poll.js';

const require = createRequire(import.meta.url);
const validateAiOutput = require('../../n8n/code-nodes/validate-ai-output.js') as {
  validateAiQualificationOutput: (raw: unknown) => {
    valid: boolean;
    error_code?: string;
    errors?: string[];
    analysis?: Record<string, unknown>;
  };
};
const evaluateFollowup = require('../../n8n/code-nodes/evaluate-followup.js') as {
  evaluateFollowups: (input: {
    inquiries: Record<string, unknown>[];
    initialEmails: Record<string, unknown>[];
    followupEmails: Record<string, unknown>[];
    contacts: Record<string, unknown>[];
    now?: Date;
  }) => Array<Record<string, unknown>>;
};

interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown[] } | null;
}

describe('Suite 03 — Human Approval (WF02), Follow-up Guards (WF03) & Error Isolation (WF04)', () => {
  let cfg: TestEnvConfig;
  let adminSb: ReturnType<typeof createSupabaseAdmin>;
  let reviewerToken = '';

  beforeAll(async () => {
    cfg = loadTestEnv();
    adminSb = createSupabaseAdmin(cfg);
    const auth = await signInTestReviewer(cfg);
    reviewerToken = auth.accessToken;
  });

  afterAll(async () => {
    await cleanupTestRun(adminSb, cfg.runPrefix);
  });

  async function seedPendingInquiry(slug: string, options: { consentToEmail?: boolean } = {}) {
    const email = `delivered+${cfg.runPrefix}${slug}@resend.dev`;
    const submissionId = `${cfg.runPrefix}${slug}`;
    const consentToEmail = options.consentToEmail ?? true;

    const { data: contact, error: cErr } = await adminSb
      .from('contacts')
      .insert({
        full_name: `Vitest ${slug}`,
        email,
        company_name: 'Vitest QA Studio',
      })
      .select('*')
      .single();
    if (cErr || !contact) throw cErr ?? new Error('Failed to seed contact');

    const { data: inquiry, error: iErr } = await adminSb
      .from('inquiries')
      .insert({
        contact_id: contact.id,
        submission_id: submissionId,
        service_type: 'Custom Web Applications & SaaS MVPs',
        budget_min: 10000,
        budget_max: 16000,
        budget_currency: 'USD',
        timeline_weeks: 8,
        project_description: 'Seeded pending inquiry for Day 13 Vitest HITL and follow-up verification.',
        consent_to_email: consentToEmail,
        consent_timestamp: consentToEmail ? new Date().toISOString() : null,
        consent_source: 'website_contact_form',
        lead_status: 'qualified',
        priority: 'high',
        approval_status: 'pending',
        followup_status: 'not_eligible',
      })
      .select('*')
      .single();
    if (iErr || !inquiry) throw iErr ?? new Error('Failed to seed inquiry');

    const { data: emailMsg, error: eErr } = await adminSb
      .from('email_messages')
      .insert({
        inquiry_id: inquiry.id,
        message_type: 'initial',
        direction: 'outbound',
        recipient_email: email,
        subject: `Vitest Initial Draft (${slug})`,
        body: 'Hi there, thank you for contacting Veloce Digital about your SaaS MVP.',
        status: 'pending_approval',
        idempotency_key: `email:${inquiry.id}:initial`,
      })
      .select('*')
      .single();
    if (eErr || !emailMsg) throw eErr ?? new Error('Failed to seed email_message');

    return { contact, inquiry, emailMsg };
  }

  it('IT-12: Approving pending draft sends 1 initial email via WF02 and blocks duplicate replay (409)', async () => {
    const { inquiry, emailMsg } = await seedPendingInquiry('wf02_approve');

    const approve1 = await apiRequest<ApiEnvelope>(
      cfg.apiBaseUrl,
      `/api/inquiries/${inquiry.id}/approve`,
      {
        method: 'POST',
        token: reviewerToken,
        body: {
          email_message_id: emailMsg.id,
          subject: 'Approved: Veloce Digital Discovery Call',
          body: 'Hi there, we reviewed your SaaS MVP scope and would love to schedule a 15-min discovery call.',
        },
      },
    );
    expect([200, 202]).toContain(approve1.status);
    expect(approve1.json?.ok).toBe(true);

    const state = await pollUntil(
      'WF02 initial email sent',
      async () => {
        const [{ data: msg }, { data: inq }] = await Promise.all([
          adminSb.from('email_messages').select('*').eq('id', emailMsg.id).single(),
          adminSb.from('inquiries').select('*').eq('id', inquiry.id).single(),
        ]);
        if (msg?.status !== 'sent' || inq?.lead_status !== 'contacted') {
          return { done: false, observed: { msgStatus: msg?.status, leadStatus: inq?.lead_status } };
        }
        return { done: true, value: { msg, inq } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(state.msg.status).toBe('sent');
    expect(state.msg.provider_message_id).toBeTruthy();
    expect(state.msg.sent_at).toBeTruthy();
    expect(state.inq.approval_status).toBe('approved');
    expect(state.inq.lead_status).toBe('contacted');
    expect(state.inq.followup_status).toBe('scheduled');

    // Replay same approve endpoint -> must return 409 CONFLICT and never send a 2nd email
    const approve2 = await apiRequest<ApiEnvelope>(
      cfg.apiBaseUrl,
      `/api/inquiries/${inquiry.id}/approve`,
      {
        method: 'POST',
        token: reviewerToken,
        body: { email_message_id: emailMsg.id },
      },
    );
    expect(approve2.status).toBe(409);
    expect(approve2.json?.error?.code).toBe('CONFLICT');

    const { data: allEmails } = await adminSb
      .from('email_messages')
      .select('*')
      .eq('inquiry_id', inquiry.id);
    expect(allEmails).toHaveLength(1);
    expect(allEmails?.[0].provider_message_id).toBe(state.msg.provider_message_id);
  });

  it('IT-13: Rejecting pending draft cancels email (0 emails sent) and closes inquiry', async () => {
    const { inquiry, emailMsg } = await seedPendingInquiry('wf02_reject');

    const rejectRes = await apiRequest<ApiEnvelope>(
      cfg.apiBaseUrl,
      `/api/inquiries/${inquiry.id}/reject`,
      {
        method: 'POST',
        token: reviewerToken,
        body: {
          email_message_id: emailMsg.id,
          reason: 'Out of capacity for requested delivery window',
        },
      },
    );
    expect([200, 202]).toContain(rejectRes.status);
    expect(rejectRes.json?.ok).toBe(true);

    const state = await pollUntil(
      'WF02 reject completion',
      async () => {
        const [{ data: msg }, { data: inq }] = await Promise.all([
          adminSb.from('email_messages').select('*').eq('id', emailMsg.id).single(),
          adminSb.from('inquiries').select('*').eq('id', inquiry.id).single(),
        ]);
        if (msg?.status !== 'cancelled' || inq?.approval_status !== 'rejected') {
          return {
            done: false,
            observed: { msgStatus: msg?.status, approvalStatus: inq?.approval_status },
          };
        }
        return { done: true, value: { msg, inq } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(state.msg.status).toBe('cancelled');
    expect(state.msg.sent_at).toBeNull();
    expect(state.msg.provider_message_id).toBeNull();
    expect(state.inq.approval_status).toBe('rejected');
    expect(state.inq.lead_status).toBe('closed');
    expect(state.inq.followup_status).toBe('not_eligible');
  });

  it('IT-14 (TC10 + WF03 Stop Rules): Enforces consent_to_email=false, unsubscribe, and replied/won stop rules', async () => {
    // Part A: TC10 real API submission with consent_to_email=false -> followup_status must stay not_eligible
    const tc10 = buildScopedLeadPayload('TC10', cfg.runPrefix, { emailSlug: 'claire_tc10' });
    const tc10Res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: tc10,
    });
    expect(tc10Res.status).toBe(202);

    const tc10Inq = await pollUntil(
      'TC10 scored without consent',
      async () => {
        const { data: inq } = await adminSb
          .from('inquiries')
          .select('*')
          .eq('submission_id', tc10.submission_id)
          .maybeSingle();
        if (!inq || inq.lead_status === 'new' || inq.lead_status === 'processing') {
          return { done: false, observed: { inq } };
        }
        return { done: true, value: inq };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(tc10Inq.consent_to_email).toBe(false);
    expect(tc10Inq.followup_status).toBe('not_eligible');

    // Part B: PATCH /api/inquiries/:id/status unsubscribe & replied transitions force followup_status='stopped'
    const { inquiry: unsubInq, contact: unsubContact } = await seedPendingInquiry('wf03_unsub');
    await adminSb
      .from('inquiries')
      .update({ lead_status: 'contacted', approval_status: 'approved', followup_status: 'scheduled' })
      .eq('id', unsubInq.id);

    const unsubRes = await apiRequest<ApiEnvelope>(
      cfg.apiBaseUrl,
      `/api/inquiries/${unsubInq.id}/status`,
      {
        method: 'PATCH',
        token: reviewerToken,
        body: { unsubscribed: true, note: 'Prospect requested opt-out' },
      },
    );
    expect(unsubRes.status).toBe(200);
    expect(unsubRes.json?.ok).toBe(true);

    const { data: unsubDb } = await adminSb
      .from('inquiries')
      .select('lead_status, followup_status, unsubscribed_at')
      .eq('id', unsubInq.id)
      .single();
    expect(unsubDb?.unsubscribed_at).toBeTruthy();
    expect(unsubDb?.followup_status).toBe('stopped');
    // Opt-out must NOT force lead_status to closed (02-dataflow-and-states.md)
    expect(unsubDb?.lead_status).toBe('contacted');

    // Part C: Deterministic WF03 evaluator guarantees zero sends for unsubscribed, replied, closed, won, no-consent
    const actions = evaluateFollowup.evaluateFollowups({
      now: new Date('2026-11-26T12:00:00Z'),
      contacts: [{ id: unsubContact.id, full_name: unsubContact.full_name }],
      inquiries: [
        {
          id: 'no-consent',
          contact_id: unsubContact.id,
          submission_id: 's1',
          followup_status: 'scheduled',
          lead_status: 'contacted',
          consent_to_email: false,
          unsubscribed_at: null,
        },
        {
          id: 'unsub',
          contact_id: unsubContact.id,
          submission_id: 's2',
          followup_status: 'scheduled',
          lead_status: 'contacted',
          consent_to_email: true,
          unsubscribed_at: '2026-11-24T00:00:00Z',
        },
        {
          id: 'replied',
          contact_id: unsubContact.id,
          submission_id: 's3',
          followup_status: 'scheduled',
          lead_status: 'replied',
          consent_to_email: true,
          unsubscribed_at: null,
        },
        {
          id: 'won',
          contact_id: unsubContact.id,
          submission_id: 's4',
          followup_status: 'scheduled',
          lead_status: 'won',
          consent_to_email: true,
          unsubscribed_at: null,
        },
      ],
      initialEmails: [
        { id: 'e1', inquiry_id: 'no-consent', status: 'sent', sent_at: '2026-11-24T00:00:00Z', recipient_email: 'delivered+a@resend.dev' },
        { id: 'e2', inquiry_id: 'unsub', status: 'sent', sent_at: '2026-11-24T00:00:00Z', recipient_email: 'delivered+b@resend.dev' },
        { id: 'e3', inquiry_id: 'replied', status: 'sent', sent_at: '2026-11-24T00:00:00Z', recipient_email: 'delivered+c@resend.dev' },
        { id: 'e4', inquiry_id: 'won', status: 'sent', sent_at: '2026-11-24T00:00:00Z', recipient_email: 'delivered+d@resend.dev' },
      ],
      followupEmails: [],
    });

    expect(actions.filter((a) => a.action === 'send')).toHaveLength(0);
    expect(actions.every((a) => a.action === 'finalize' && a.next_followup_status === 'stopped')).toBe(
      true,
    );
  });

  it('IT-15: Rejects malformed AI JSON at schema gate, blocks invalid webhook secret, and surfaces workflow_errors via API', async () => {
    // 1. Malformed AI JSON must never pass schema gate
    const malformed = validateAiOutput.validateAiQualificationOutput('not valid json {');
    expect(malformed.valid).toBe(false);
    expect(malformed.analysis).toBeUndefined();
    expect(malformed.errors?.length ?? 0).toBeGreaterThan(0);

    // 2. LLM output attempting to inject forbidden score field or invalid scope_fit enum must be rejected
    const forbiddenScore = validateAiOutput.validateAiQualificationOutput({
      detected_service: 'Custom Web Applications & SaaS MVPs',
      project_summary: 'Valid summary.',
      missing_information: [],
      scope_fit: 'super_high', // invalid enum
      spam_suspected: false,
      clarity_score_band: 'high',
      draft_email_subject: 'Hello',
      draft_email_body: 'Body text here',
      qualification_score: 99,
    });
    expect(forbiddenScore.valid).toBe(false);
    expect(forbiddenScore.analysis).toBeUndefined();
    expect(forbiddenScore.error_code).toBe('AI_SCHEMA_VALIDATION_ERROR');

    // 3. Direct WF01 webhook with wrong x-webhook-secret must be rejected (401/403) without DB write
    const badSecretSubId = `${cfg.runPrefix}bad_secret`;
    const badSecretRes = await fetch(`${cfg.n8nWebhookBaseUrl}/webhook/lead-intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'wrong-secret-value',
      },
      body: JSON.stringify(
        buildScopedLeadPayload('TC01', cfg.runPrefix, { submission_id: badSecretSubId }),
      ),
    });
    expect([401, 403]).toContain(badSecretRes.status);

    const { data: badSecretInqs } = await adminSb
      .from('inquiries')
      .select('id')
      .eq('submission_id', badSecretSubId);
    expect(badSecretInqs).toHaveLength(0);

    // 4. Open workflow_errors row is visible through authenticated GET /api/workflow-errors
    const errSubId = `${cfg.runPrefix}err_probe`;
    const { data: insertedErr, error: insErr } = await adminSb
      .from('workflow_errors')
      .insert({
        submission_id: errSubId,
        workflow_name: 'WF01 - Lead Intake & Qualification',
        execution_id: 'vitest-error-probe',
        node_name: 'Validate AI Output Schema',
        error_message: 'Malformed AI JSON rejected before DB write (Vitest probe)',
        status: 'open',
      })
      .select('*')
      .single();
    expect(insErr).toBeNull();
    expect(insertedErr?.id).toBeTruthy();

    const apiErrors = await apiRequest<ApiEnvelope<{ items: Array<{ id: string; submission_id: string }> }>>(
      cfg.apiBaseUrl,
      '/api/workflow-errors?status=open&limit=50',
      { token: reviewerToken },
    );
    expect(apiErrors.status).toBe(200);
    expect(apiErrors.json?.ok).toBe(true);
    expect(apiErrors.json?.data?.items.some((item) => item.id === insertedErr?.id)).toBe(true);
  });
});
