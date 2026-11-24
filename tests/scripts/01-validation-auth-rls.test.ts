import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { cleanupTestRun } from './helpers/cleanup.js';
import {
  apiRequest,
  createSupabaseAdmin,
  createSupabaseAnon,
  loadTestEnv,
  signInTestReviewer,
  type TestEnvConfig,
} from './helpers/env.js';
import { buildScopedLeadPayload } from './helpers/mockLeads.js';

interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown[] } | null;
}

describe('Suite 01 — Input Validation, Auth Guards, RLS & Secret Hygiene', () => {
  let cfg: TestEnvConfig;
  let adminSb: ReturnType<typeof createSupabaseAdmin>;
  let anonSb: ReturnType<typeof createSupabaseAnon>;
  let reviewerToken = '';

  beforeAll(async () => {
    cfg = loadTestEnv();
    adminSb = createSupabaseAdmin(cfg);
    anonSb = createSupabaseAnon(cfg);
    const auth = await signInTestReviewer(cfg);
    reviewerToken = auth.accessToken;
  });

  afterAll(async () => {
    await cleanupTestRun(adminSb, cfg.runPrefix);
  });

  it('IT-01: GET /api/health returns 200 with standard ok envelope', async () => {
    const res = await apiRequest<ApiEnvelope<{ status: string; timestamp: string }>>(
      cfg.apiBaseUrl,
      '/api/health',
    );
    expect(res.status).toBe(200);
    expect(res.json?.ok).toBe(true);
    expect(res.json?.data?.status).toBe('ok');
    expect(res.json?.error).toBeNull();
  });

  it('IT-02 (TC11): Rejects invalid email format with 400 VALIDATION_ERROR and 0 DB writes', async () => {
    const payload = buildScopedLeadPayload('TC11', cfg.runPrefix, {
      preserveInvalidEmail: true,
    });

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: payload,
    });

    expect(res.status).toBe(400);
    expect(res.json?.ok).toBe(false);
    expect(res.json?.error?.code).toBe('VALIDATION_ERROR');

    // Dual verification: DB must contain zero rows for this submission_id
    const { data: inqs, error } = await adminSb
      .from('inquiries')
      .select('id')
      .eq('submission_id', payload.submission_id);
    expect(error).toBeNull();
    expect(inqs).toHaveLength(0);
  });

  it('IT-03 (TC12): Rejects missing required fields with 400 VALIDATION_ERROR and 0 DB writes', async () => {
    const payload = buildScopedLeadPayload('TC12', cfg.runPrefix);

    const res = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/leads', {
      method: 'POST',
      body: payload,
    });

    expect(res.status).toBe(400);
    expect(res.json?.ok).toBe(false);
    expect(res.json?.error?.code).toBe('VALIDATION_ERROR');

    const { data: inqs, error } = await adminSb
      .from('inquiries')
      .select('id')
      .eq('submission_id', payload.submission_id);
    expect(error).toBeNull();
    expect(inqs).toHaveLength(0);
  });

  it('IT-04: Enforces JWT auth on protected routes (401 without token, 200 with valid JWT)', async () => {
    const fakeId = '00000000-0000-4000-8000-000000000001';

    const unauthInquiries = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/inquiries');
    expect(unauthInquiries.status).toBe(401);
    expect(unauthInquiries.json?.error?.code).toBe('UNAUTHORIZED');

    const unauthApprove = await apiRequest<ApiEnvelope>(
      cfg.apiBaseUrl,
      `/api/inquiries/${fakeId}/approve`,
      { method: 'POST', body: {} },
    );
    expect(unauthApprove.status).toBe(401);
    expect(unauthApprove.json?.error?.code).toBe('UNAUTHORIZED');

    const unauthErrors = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/workflow-errors');
    expect(unauthErrors.status).toBe(401);
    expect(unauthErrors.json?.error?.code).toBe('UNAUTHORIZED');

    const invalidJwt = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/inquiries', {
      token: 'invalid.jwt.token',
    });
    expect(invalidJwt.status).toBe(401);

    const authInquiries = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/inquiries?limit=5', {
      token: reviewerToken,
    });
    expect(authInquiries.status).toBe(200);
    expect(authInquiries.json?.ok).toBe(true);

    const authErrors = await apiRequest<ApiEnvelope>(cfg.apiBaseUrl, '/api/workflow-errors?limit=5', {
      token: reviewerToken,
    });
    expect(authErrors.status).toBe(200);
    expect(authErrors.json?.ok).toBe(true);
  });

  it('IT-05: Enforces Supabase RLS for anon role across all 6 tables and zero frontend secret leaks', async () => {
    const tables = [
      'contacts',
      'inquiries',
      'lead_analyses',
      'email_messages',
      'activity_logs',
      'workflow_errors',
    ] as const;

    for (const table of tables) {
      const { data, error } = await anonSb.from(table).select('*').limit(1);
      // Either explicit permission denied error or 0 rows exposed to anon
      const blocked = Boolean(error) || (Array.isArray(data) && data.length === 0);
      expect(blocked, `anon should not read rows from ${table}`).toBe(true);
    }

    // Verify frontend/src contains zero references to server-only secrets
    const srcRoot = path.resolve(process.cwd(), 'frontend', 'src');
    const forbidden = /SUPABASE_SERVICE_ROLE_KEY|N8N_WEBHOOK_SECRET|N8N_API_KEY/;
    const stack = [srcRoot];
    const hits: string[] = [];

    while (stack.length > 0) {
      const current = stack.pop()!;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(full);
        } else if (entry.isFile()) {
          const text = fs.readFileSync(full, 'utf8');
          if (forbidden.test(text)) hits.push(full);
        }
      }
    }

    expect(hits).toEqual([]);
  });
});
