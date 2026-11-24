import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestRun } from './helpers/cleanup.js';
import {
  apiRequest,
  createSupabaseAdmin,
  loadTestEnv,
  type TestEnvConfig,
} from './helpers/env.js';
import { buildScopedLeadPayload } from './helpers/mockLeads.js';
import { pollUntil } from './helpers/poll.js';

interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown[] } | null;
}

describe('Suite 02 — Lead Intake, AI Qualification, Deterministic Scoring & Deduplication (WF01)', () => {
  let cfg: TestEnvConfig;
  let adminSb: ReturnType<typeof createSupabaseAdmin>;
  let tc01SubmissionId = '';
  let tc01Email = '';
  let tc01ContactId = '';
  let tc01HubspotId = '';
  let tc01InquiryId = '';

  beforeAll(() => {
    cfg = loadTestEnv();
    adminSb = createSupabaseAdmin(cfg);
  });

  afterAll(async () => {
    await cleanupTestRun(adminSb, cfg.runPrefix);
  });

  it('IT-06 (TC01): Qualified SaaS MVP scores 75–100, creates pending draft, syncs HubSpot & logs activity', async () => {
    const payload = buildScopedLeadPayload('TC01', cfg.runPrefix, { emailSlug: 'sarah_tc01' });
    tc01SubmissionId = payload.submission_id;
    tc01Email = payload.email;

    const res = await apiRequest<ApiEnvelope<{ submission_id: string; inquiry_id?: string }>>(
      cfg.apiBaseUrl,
      '/api/leads',
      { method: 'POST', body: payload },
    );

    expect(res.status).toBe(202);
    expect(res.json?.ok).toBe(true);
    expect(res.json?.data?.submission_id).toBe(payload.submission_id);

    const state = await pollUntil(
      'TC01 full WF01 pipeline completion',
      async () => {
        const { data: inq } = await adminSb
          .from('inquiries')
          .select('*')
          .eq('submission_id', payload.submission_id)
          .maybeSingle();
        if (!inq || inq.lead_status === 'new' || inq.lead_status === 'processing') {
          return { done: false, observed: { inq } };
        }
        const [{ data: contact }, { data: analyses }, { data: emails }, { data: logs }] =
          await Promise.all([
            adminSb.from('contacts').select('*').eq('id', inq.contact_id).single(),
            adminSb.from('lead_analyses').select('*').eq('inquiry_id', inq.id),
            adminSb.from('email_messages').select('*').eq('inquiry_id', inq.id),
            adminSb.from('activity_logs').select('event_type').eq('inquiry_id', inq.id),
          ]);
        const eventTypes = (logs ?? []).map((l) => l.event_type);
        if (
          !contact?.hubspot_contact_id ||
          !analyses?.length ||
          !emails?.length ||
          !eventTypes.includes('hubspot_contact_synced')
        ) {
          return {
            done: false,
            observed: {
              lead_status: inq.lead_status,
              hubspot_contact_id: contact?.hubspot_contact_id ?? null,
              analyses: analyses?.length ?? 0,
              emails: emails?.length ?? 0,
              eventTypes,
            },
          };
        }
        return { done: true, value: { inq, contact, analyses, emails, logs: logs ?? [] } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    tc01ContactId = state.contact.id;
    tc01HubspotId = state.contact.hubspot_contact_id;
    tc01InquiryId = state.inq.id;

    expect(state.inq.lead_status).toBe('qualified');
    expect(state.inq.priority).toBe('high');
    expect(state.inq.approval_status).toBe('pending');
    expect(state.inq.followup_status).toBe('not_eligible');

    expect(state.analyses).toHaveLength(1);
    const analysis = state.analyses[0];
    expect(analysis.qualification_score).toBeGreaterThanOrEqual(75);
    expect(analysis.qualification_score).toBeLessThanOrEqual(100);
    expect(analysis.qualification_status).toBe('qualified');
    expect(analysis.score_breakdown).toBeTruthy();
    expect(analysis.draft_email).toBeTruthy();

    expect(state.emails).toHaveLength(1);
    const draft = state.emails[0];
    expect(draft.message_type).toBe('initial');
    expect(draft.status).toBe('pending_approval');
    expect(draft.idempotency_key).toBe(`email:${state.inq.id}:initial`);
    expect(draft.sent_at).toBeNull();

    expect(state.contact.hubspot_contact_id).toBeTruthy();
    const eventTypes = state.logs.map((l) => l.event_type);
    expect(eventTypes).toContain('lead_scored_and_draft_created');
    expect(eventTypes).toContain('hubspot_contact_synced');
  });

  it('IT-07 (TC04): Undisclosed budget & missing scope routes to needs_review (never auto-rejected)', async () => {
    const payload = buildScopedLeadPayload('TC04', cfg.runPrefix, { emailSlug: 'elena_tc04' });

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: payload,
    });
    expect(res.status).toBe(202);
    expect(res.json?.ok).toBe(true);

    const state = await pollUntil(
      'TC04 needs_review classification',
      async () => {
        const { data: inq } = await adminSb
          .from('inquiries')
          .select('*')
          .eq('submission_id', payload.submission_id)
          .maybeSingle();
        if (!inq || inq.lead_status === 'new' || inq.lead_status === 'processing') {
          return { done: false, observed: { inq } };
        }
        const [{ data: analyses }, { data: emails }] = await Promise.all([
          adminSb.from('lead_analyses').select('*').eq('inquiry_id', inq.id),
          adminSb.from('email_messages').select('*').eq('inquiry_id', inq.id),
        ]);
        if (!analyses?.length || !emails?.length) {
          return { done: false, observed: { lead_status: inq.lead_status, analyses, emails } };
        }
        return { done: true, value: { inq, analysis: analyses[0], emails } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(state.inq.lead_status).toBe('needs_review');
    expect(state.inq.priority).toBe('medium');
    expect(state.inq.approval_status).toBe('pending');
    expect(state.analysis.qualification_status).toBe('needs_review');
    expect(state.emails).toHaveLength(1);
    expect(state.emails[0].status).toBe('pending_approval');
  });

  it('IT-08 (TC05): Budget below $1,500 deal-breaker forces not_qualified with 0 email drafts', async () => {
    const payload = buildScopedLeadPayload('TC05', cfg.runPrefix, { emailSlug: 'kevin_tc05' });

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: payload,
    });
    expect(res.status).toBe(202);

    const state = await pollUntil(
      'TC05 deal-breaker override',
      async () => {
        const { data: inq } = await adminSb
          .from('inquiries')
          .select('*')
          .eq('submission_id', payload.submission_id)
          .maybeSingle();
        if (!inq || inq.lead_status === 'new' || inq.lead_status === 'processing') {
          return { done: false, observed: { inq } };
        }
        const [{ data: analyses }, { data: emails }] = await Promise.all([
          adminSb.from('lead_analyses').select('*').eq('inquiry_id', inq.id),
          adminSb.from('email_messages').select('*').eq('inquiry_id', inq.id),
        ]);
        if (!analyses?.length) return { done: false, observed: { inq } };
        return { done: true, value: { inq, analysis: analyses[0], emails: emails ?? [] } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(state.inq.lead_status).toBe('not_qualified');
    expect(state.inq.priority).toBe('low');
    expect(state.inq.approval_status).toBe('not_required');
    expect(state.inq.followup_status).toBe('not_eligible');
    expect(state.analysis.qualification_score).toBeLessThan(45);
    expect(state.emails).toHaveLength(0);
  });

  it('IT-09 (TC07): Spam cold pitch routes to not_qualified, skips email draft and skips HubSpot sync', async () => {
    const payload = buildScopedLeadPayload('TC07', cfg.runPrefix, { emailSlug: 'spam_tc07' });

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: payload,
    });
    expect(res.status).toBe(202);

    const state = await pollUntil(
      'TC07 spam detection',
      async () => {
        const { data: inq } = await adminSb
          .from('inquiries')
          .select('*')
          .eq('submission_id', payload.submission_id)
          .maybeSingle();
        if (!inq || inq.lead_status === 'new' || inq.lead_status === 'processing') {
          return { done: false, observed: { inq } };
        }
        const [{ data: analyses }, { data: emails }, { data: logs }] = await Promise.all([
          adminSb.from('lead_analyses').select('*').eq('inquiry_id', inq.id),
          adminSb.from('email_messages').select('*').eq('inquiry_id', inq.id),
          adminSb.from('activity_logs').select('event_type').eq('inquiry_id', inq.id),
        ]);
        const eventTypes = (logs ?? []).map((l) => l.event_type);
        if (!analyses?.length || !eventTypes.includes('hubspot_sync_skipped')) {
          return { done: false, observed: { lead_status: inq.lead_status, eventTypes } };
        }
        return { done: true, value: { inq, analysis: analyses[0], emails: emails ?? [], eventTypes } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(state.inq.lead_status).toBe('not_qualified');
    expect(state.inq.approval_status).toBe('not_required');
    expect(state.analysis.spam_suspected).toBe(true);
    expect(state.emails).toHaveLength(0);
    expect(state.eventTypes).toContain('hubspot_sync_skipped');
    expect(state.eventTypes).not.toContain('slack_alert_sent');
  });

  it('IT-10 (TC08): Duplicate submission_id replay returns 409 CONFLICT with zero duplicate DB records', async () => {
    expect(tc01SubmissionId).toBeTruthy();
    const replayPayload = buildScopedLeadPayload('TC01', cfg.runPrefix, {
      submission_id: tc01SubmissionId,
      email: tc01Email,
    });

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: replayPayload,
    });

    expect(res.status).toBe(409);
    expect(res.json?.ok).toBe(false);
    expect(res.json?.error?.code).toBe('CONFLICT');

    const [{ data: inqs }, { data: analyses }, { data: emails }] = await Promise.all([
      adminSb.from('inquiries').select('id').eq('submission_id', tc01SubmissionId),
      adminSb.from('lead_analyses').select('id').eq('inquiry_id', tc01InquiryId),
      adminSb.from('email_messages').select('id').eq('inquiry_id', tc01InquiryId),
    ]);
    expect(inqs).toHaveLength(1);
    expect(analyses).toHaveLength(1);
    expect(emails).toHaveLength(1);
  });

  it('IT-11 (TC09): Existing contact (uppercase/padded email) reuses contact_id & HubSpot ID on new inquiry', async () => {
    expect(tc01ContactId).toBeTruthy();
    expect(tc01HubspotId).toBeTruthy();

    const payload = buildScopedLeadPayload('TC09', cfg.runPrefix, {
      email: `  ${tc01Email.toUpperCase()}  `,
    });

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: payload,
    });
    expect(res.status).toBe(202);
    expect(res.json?.ok).toBe(true);

    const state = await pollUntil(
      'TC09 existing contact second inquiry',
      async () => {
        const { data: inq } = await adminSb
          .from('inquiries')
          .select('*')
          .eq('submission_id', payload.submission_id)
          .maybeSingle();
        if (!inq || inq.lead_status === 'new' || inq.lead_status === 'processing') {
          return { done: false, observed: { inq } };
        }
        const { data: logs } = await adminSb
          .from('activity_logs')
          .select('event_type, event_data')
          .eq('inquiry_id', inq.id)
          .eq('event_type', 'hubspot_contact_synced');
        if (!logs?.length) return { done: false, observed: { lead_status: inq.lead_status } };
        return { done: true, value: { inq, syncLog: logs[0] } };
      },
      { timeoutMs: cfg.pollTimeoutMs, intervalMs: cfg.pollIntervalMs },
    );

    expect(state.inq.contact_id).toBe(tc01ContactId);
    expect(state.inq.id).not.toBe(tc01InquiryId);
    expect(state.syncLog.event_data?.is_new).toBe(false);

    const { data: contacts } = await adminSb
      .from('contacts')
      .select('id, email, hubspot_contact_id')
      .ilike('email', tc01Email);
    expect(contacts).toHaveLength(1);
    expect(contacts?.[0].hubspot_contact_id).toBe(tc01HubspotId);
  });
});
