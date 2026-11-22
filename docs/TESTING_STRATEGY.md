# Testing Strategy (Hybrid Testing) — LeadFlow AI

> Single Source of Truth for verification standards across Days 3–13 (ADR-006).
> Canonical mock lead payloads live in [test-data/mock-leads.json](../test-data/mock-leads.json) — link and load them directly instead of duplicating payloads.

---

## 1. Core Verification Rule (Non-Negotiable)
- **Dual PASS Gate:** Do **NOT** mark any test case as `PASS` unless BOTH its expected HTTP API response AND the corresponding Supabase database state (`contacts`, `inquiries`, `lead_analyses`, `email_messages`, `activity_logs`, `workflow_errors`) have been explicitly verified where applicable.
- Prioritize reliable, deterministic integration tests over brittle UI/mock complexity.

---

## 2. Automated Integration Tests (Node.js + Vitest)
- **Framework:** `vitest` (`tests/scripts/*.test.ts`), executing real HTTP requests against the Express API Gateway (`TEST_API_BASE_URL`) and/or authenticated n8n webhooks.
- **Target Coverage (12–15 automated test cases):**
  1. **Valid Lead Intake & Qualification (`TC01`, `TC02`):** HTTP accepted + `contacts`, `inquiries` (`qualified`, `high`, `approval_status='pending'`), `lead_analyses` (with `score_breakdown`), and `email_messages` (`pending_approval`) created.
  2. **Borderline / Missing Info (`TC03`, `TC04`):** Routed to `needs_review` (`medium`), never auto-rejected.
  3. **Deal-breakers & Spam (`TC05`, `TC06`, `TC07`):** Routed to `not_qualified`, `approval_status='not_required'`, no `email_messages` draft created.
  4. **Input Validation (`TC11`, `TC12`):** Invalid email or missing required fields → HTTP `400`, zero DB rows inserted, AI not invoked.
  5. **Duplicate `submission_id` Replay (`TC08`):** Second request with identical `submission_id` does not create a second inquiry or duplicate side effects.
  6. **Existing Contact, New Inquiry (`TC09`):** Uppercase/padded email normalized to lowercase; reuses existing `contact_id` and inserts a new `inquiries` row.
  7. **Authentication & RLS Enforcement:** Unauthenticated call to `GET /api/inquiries` or `POST /api/inquiries/:id/approve` returns `401`; `anon` Supabase client cannot read tables directly.
  8. **Human Approval & Idempotent Email Send (WF02):** Unapproved/rejected lead sends zero emails; approved lead sends once and stores `provider_message_id`; re-triggering with same `idempotency_key` does not send a second email.
  9. **Follow-up Consent & Stop Rules (WF03, `TC10`):** `consent_to_email=false`, `unsubscribed_at IS NOT NULL`, `replied`, `closed`, or `won` leads are excluded from follow-up.
  10. **Error Isolation (WF04):** Malformed AI JSON or upstream failure logs an `open` row in `workflow_errors` without writing fabricated `lead_analyses` data.
- **Async Polling Helper:** Every async workflow assertion polls Supabase using configurable `TEST_POLL_TIMEOUT_MS` (default `20000`) and `TEST_POLL_INTERVAL_MS` (default `1000`), failing cleanly with the last observed DB state on timeout.
- **Reporting:** Generate a clear PASS/FAIL report with error details in `tests/reports/e2e-report.md`.

---

## 3. Semi-Automated Manual Tests (`tests/test-form.html`)
- **Tool:** [tests/test-form.html](../tests/test-form.html) simulating real prospect submissions with visual HTTP status badges and JSON response inspection.
- **Scope (3–5 manual scenarios):**
  1. Valid qualified SaaS MVP submission (`TC01`) → verify end-to-end Slack alert, HubSpot contact, Dashboard preview, and Approve action.
  2. Invalid input (`TC11` invalid email / `TC12` missing fields) → verify clear validation feedback.
  3. Duplicate replay (`TC08`) → verify idempotent rejection/no-op feedback.
  4. Error scenario (e.g., invalid webhook secret or simulated upstream failure) → verify clear UI error banner and `workflow_errors` log.
  5. Borderline lead (`TC04`) → verify `needs_review` display & Reject flow on Dashboard.

---

## 4. Test Environment & Safety Controls
1. **Dedicated Supabase Test Project:** All automated tests MUST run against `TEST_SUPABASE_URL` — NEVER modify production or shared demo data.
2. **Environment Variables Only:** Store all API keys, webhook secrets, and test credentials in `.env` (gitignored); commit only `.env.example`.
3. **Unique Tagging & Safe Cleanup:** Prefix every test `submission_id` and synthetic email with `${TEST_RUN_PREFIX}<runId>_` (e.g., `vitest_leadflow_1732270000_`) so `afterAll` cleanup deletes ONLY records created by that test run (in FK-safe order: `workflow_errors` → `activity_logs` → `email_messages` → `lead_analyses` → `inquiries` → `contacts`).
4. **Frontend Security Check:** Verify `frontend/` contains zero references to `SUPABASE_SERVICE_ROLE_KEY`.

---

## 5. Day 13 Deliverables Checklist
- [ ] Complete Vitest integration suite (`tests/scripts/*.test.ts`) + polling helper + `vitest.config.ts`
- [ ] Verified `tests/test-form.html` manual harness (3–5 documented scenarios)
- [ ] Test dataset (`test-data/mock-leads.json`) & `.env.example` test configuration
- [ ] Clear test execution instructions in `README.md`
- [ ] Published `tests/reports/e2e-report.md` documenting all 15–20 test cases with actual PASS/FAIL outcomes
