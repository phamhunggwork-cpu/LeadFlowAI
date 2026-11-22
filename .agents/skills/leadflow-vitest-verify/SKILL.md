---
name: leadflow-vitest-verify
description: >-
  Use when running or verifying automated Vitest integration tests for LeadFlow AI
  to enforce dedicated Supabase test environment safety, async polling assertions,
  dual API+DB PASS verification, and clean test-data teardown.
---

# Skill: LeadFlow Hybrid Integration Verification (Vitest)

Follow this runbook whenever executing or reviewing integration tests under `tests/scripts/` (per `docs/TESTING_STRATEGY.md`).

## Steps

1. **Verify Environment Isolation (Mandatory Before Execution):**
   - Confirm `.env` defines `TEST_SUPABASE_URL`, `TEST_SUPABASE_SERVICE_ROLE_KEY`, `TEST_API_BASE_URL`, `TEST_POLL_TIMEOUT_MS`, and `TEST_RUN_PREFIX`.
   - Confirm `TEST_SUPABASE_URL` is the dedicated **test** project (NEVER production or shared demo data).
   - Never print secret values to stdout or test logs.

2. **Run Frontend Secret Leak Guard:**
   Confirm zero occurrences of `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_SECRET`, or `N8N_API_KEY` inside `frontend/`:
   ```powershell
   Select-String -Path "frontend\src\**\*","frontend\.env*" -Pattern "SERVICE_ROLE|WEBHOOK_SECRET|N8N_API_KEY" -ErrorAction SilentlyContinue
   ```
   *(Ignore placeholder comments in `frontend/.env.example`.)*

3. **Execute Typecheck & Integration Suite:**
   - Run TypeScript checks (`npm --prefix backend run typecheck` / `npm --prefix frontend run typecheck` once scaffolded).
   - Run targeted or full Vitest suite (`npx vitest run`).

4. **Enforce Dual Verification PASS Gate:**
   Do NOT report a test case as `PASS` unless BOTH are verified where applicable:
   - **API layer:** Expected HTTP status (`200`/`202`/`400`/`401`/`409`) and response envelope `{ ok, data, error }`.
   - **Database layer:** Expected row state in Supabase test DB (via async polling up to `TEST_POLL_TIMEOUT_MS`), including enum accuracy (`LeadFlowAI.sql`) and absence of duplicate rows.

5. **Confirm Safe Teardown Cleanup:**
   - Verify all synthetic rows created with `${TEST_RUN_PREFIX}<runId>_` were deleted in FK-safe order (`workflow_errors` -> `activity_logs` -> `email_messages` -> `lead_analyses` -> `inquiries` -> `contacts`).
   - Record actual PASS/FAIL counts and any failure details in `tests/reports/e2e-report.md` (Day 13) and `docs/PROJECT_STATUS.md`.
