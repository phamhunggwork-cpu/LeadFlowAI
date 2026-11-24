# End-to-End Integration Test Report — LeadFlow AI

> **Date Executed:** 2026-11-24 (`18:05–18:08 +07:00`)  
> **Strategy Reference:** [docs/TESTING_STRATEGY.md](../../docs/TESTING_STRATEGY.md) (ADR-006, ADR-010)  
> **Overall Verdict:** **PASS — `20 / 20` test cases passed** (`15 / 15` automated Vitest + `5 / 5` `test-form.html` manual harness scenarios)

---

## 1. Executive Summary & Verification Gates

| Check | Command / Target | Result | Notes |
|---|---|---|---|
| Backend TypeScript Check | `npm --prefix backend run typecheck` | **PASS** | `tsc --noEmit` — 0 errors |
| Frontend TypeScript Check | `npm --prefix frontend run typecheck` | **PASS** | `tsc --noEmit` — 0 errors |
| Frontend Secret Leak Scan | `Select-String` across `frontend/src/**/*` & `frontend/.env*` | **PASS** | 0 secret leaks (only security warning comments in `.env*`) |
| Automated Vitest Suite | `npx vitest run` (`3` test files, `15` cases) | **PASS** | `15 / 15` passed in `48.09s` (Dual API + DB verified) |
| Manual `test-form.html` Scenarios | `5` scenarios (`MT-01`–`MT-05`) vs Express + n8n + Supabase | **PASS** | `5 / 5` passed; default endpoint updated to `http://localhost:4000/api/leads` |
| Active n8n Workflows | `WF01`, `WF02`, `WF03`, `WF04` (`errorWorkflow` wired) | **PASS** | All `4 / 4` workflows `[ACTIVE]` |
| Post-Test DB Teardown | FK-safe `afterAll` cleanup (`vitest_leadflow_%`, `manual_form_%`) | **PASS** | `0` residual test inquiries, contacts, or workflow errors |

### Environment & Isolation Note (ADR-010)
- Executed against live local stack: Express API (`http://localhost:4000`), local n8n (`http://localhost:5678`, `WF01`–`WF04` active), DeepSeek `deepseek-chat`, HubSpot CRM, Resend (`delivered+<prefix>@resend.dev` safe sink), Slack `#sales-leads`, and Supabase `leadflow-ai` dev project via `TEST_SUPABASE_URL`.
- Every synthetic record used an isolated per-run prefix (`vitest_leadflow_<runId>_` / `manual_form_<runId>_`) and was deleted in strict FK order (`workflow_errors` → `activity_logs` → `email_messages` → `lead_analyses` → `inquiries` → `contacts`) inside `afterAll` / `finally`, leaving `0` leftover rows and zero impact on existing demo records. In production/CI, point `TEST_SUPABASE_URL` to a dedicated Supabase test project without changing test code.

---

## 2. Automated Integration Test Results (`npx vitest run` — `15 / 15 PASS`)

### Suite 01 — Input Validation, Auth Guards, RLS & Secret Hygiene ([01-validation-auth-rls.test.ts](../scripts/01-validation-auth-rls.test.ts))

| Test ID | Mock Case | API Layer Assertion | Database / Security Layer Assertion | Duration | Status |
|---|---|---|---|---|---|
| `IT-01` | — | `GET /api/health` → HTTP `200`, `{ ok: true, data: { status: "ok" }, error: null }` | N/A (liveness endpoint) | `6ms` | **PASS** |
| `IT-02` | `TC11` | `POST /api/leads` invalid email → HTTP `400` (`VALIDATION_ERROR`) | `0` rows inserted in `public.inquiries` | `134ms` | **PASS** |
| `IT-03` | `TC12` | `POST /api/leads` missing `full_name` & `project_description` → HTTP `400` (`VALIDATION_ERROR`) | `0` rows inserted in `public.inquiries` | `124ms` | **PASS** |
| `IT-04` | — | Unauthenticated `GET /api/inquiries`, `POST /api/inquiries/:id/approve`, `GET /api/workflow-errors`, invalid JWT → HTTP `401` (`UNAUTHORIZED`); valid reviewer JWT → HTTP `200` | Verified live Supabase Auth session (`signInWithPassword`) | `880ms` | **PASS** |
| `IT-05` | — | N/A | Supabase `anon` client denied read access on all `6 / 6` tables (`contacts`, `inquiries`, `lead_analyses`, `email_messages`, `activity_logs`, `workflow_errors`); `0` secret references in `frontend/src/` | `788ms` | **PASS** |

### Suite 02 — Lead Intake, AI Qualification, Deterministic Scoring & Deduplication ([02-intake-scoring-dedup.test.ts](../scripts/02-intake-scoring-dedup.test.ts))

| Test ID | Mock Case | API Layer Assertion | Database / Downstream Layer Assertion | Duration | Status |
|---|---|---|---|---|---|
| `IT-06` | `TC01` | `POST /api/leads` (SaaS MVP $12k–$18k) → HTTP `202` accepted | Polled `inquiries`: `lead_status='qualified'`, `priority='high'`, `approval_status='pending'`, `followup_status='not_eligible'`; `lead_analyses`: score `75–100` + `score_breakdown` + `draft_email`; `email_messages`: `1` `pending_approval` draft (`email:<id>:initial`); `contacts.hubspot_contact_id` set; `activity_logs` contains `lead_scored_and_draft_created` & `hubspot_contact_synced` | `6644ms` | **PASS** |
| `IT-07` | `TC04` | `POST /api/leads` (undisclosed budget / missing scope) → HTTP `202` | Polled `inquiries`: `lead_status='needs_review'`, `priority='medium'`, `approval_status='pending'`; `1` `pending_approval` email draft created (never auto-rejected) | `4978ms` | **PASS** |
| `IT-08` | `TC05` | `POST /api/leads` (budget `<$1,500` deal-breaker) → HTTP `202` | Polled `inquiries`: `lead_status='not_qualified'`, `priority='low'`, `approval_status='not_required'`, `followup_status='not_eligible'`; score `<45`; `0` `email_messages` drafts | `4876ms` | **PASS** |
| `IT-09` | `TC07` | `POST /api/leads` (spam cold pitch) → HTTP `202` | Polled `inquiries`: `lead_status='not_qualified'`, `approval_status='not_required'`; `lead_analyses.spam_suspected=true`; `0` drafts; `activity_logs` records `hubspot_sync_skipped` and zero `slack_alert_sent` | `4827ms` | **PASS** |
| `IT-10` | `TC08` | Replay exact `TC01` `submission_id` → HTTP `409` (`CONFLICT`) | DB still holds exactly `1` `inquiries` row, `1` `lead_analyses` row, `1` `email_messages` row | `432ms` | **PASS** |
| `IT-11` | `TC09` | New `submission_id` with uppercase/padded `TC01` email → HTTP `202` | Normalized email reused exact `contact_id` & `hubspot_contact_id` (`is_new: false`, `0` duplicate CRM contacts), created 2nd distinct `inquiries` row | `8486ms` | **PASS** |

### Suite 03 — Human Approval (WF02), Follow-up Guards (WF03) & Error Isolation (WF04) ([03-approval-followup-errors.test.ts](../scripts/03-approval-followup-errors.test.ts))

| Test ID | Mock Case | API Layer Assertion | Database / Downstream Layer Assertion | Duration | Status |
|---|---|---|---|---|---|
| `IT-12` | WF02 Approve & Replay | `POST /api/inquiries/:id/approve` (JWT) → HTTP `202`; replay same approve → HTTP `409` (`CONFLICT`) | `email_messages`: `status='sent'`, `provider_message_id` & `sent_at` saved; `inquiries`: `approval_status='approved'`, `lead_status='contacted'`, `followup_status='scheduled'`; replay sent `0` duplicate emails (`1` row total, unchanged `provider_message_id`) | `3233ms` | **PASS** |
| `IT-13` | WF02 Reject | `POST /api/inquiries/:id/reject` (JWT) → HTTP `202` | `email_messages`: `status='cancelled'`, `sent_at IS NULL`, `provider_message_id IS NULL` (`0` emails sent); `inquiries`: `approval_status='rejected'`, `lead_status='closed'`, `followup_status='not_eligible'` | `1954ms` | **PASS** |
| `IT-14` | `TC10` + WF03 Stop Rules | `POST /api/leads` (`consent_to_email=false`) → HTTP `202`; `PATCH /api/inquiries/:id/status` (`unsubscribed: true`) → HTTP `200` | `TC10` stays `followup_status='not_eligible'`; unsubscribed lead sets `unsubscribed_at` + `followup_status='stopped'` while keeping `lead_status='contacted'`; deterministic `evaluateFollowups` emits `0` sends and stops all `no-consent`, `unsubscribed`, `replied`, and `won` leads | `5803ms` | **PASS** |
| `IT-15` | WF04 & Schema Gate | Direct WF01 webhook with wrong `x-webhook-secret` → HTTP `403`; `GET /api/workflow-errors?status=open` (JWT) → HTTP `200` | `validateAiQualificationOutput` rejects malformed JSON and forbidden `qualification_score`/invalid enum (`AI_SCHEMA_VALIDATION_ERROR`); bad-secret request inserts `0` rows; open `workflow_errors` record surfaces cleanly via Express API | `547ms` | **PASS** |

---

## 3. Semi-Automated Manual Harness Verification (`tests/test-form.html` — `5 / 5 PASS`)

| Scenario ID | Preset / Action | Observed HTTP Response | Observed DB / End-to-End State | Status |
|---|---|---|---|---|
| `MT-01` | `TC01` Qualified SaaS MVP via `http://localhost:4000/api/leads` → Dashboard Detail + Approve | `POST /api/leads` → `202`; `GET /api/inquiries/:id` → `200`; `POST /approve` → `202` | `lead_status='qualified'`, `activity_logs` confirmed `inquiry_received`, `lead_scored_and_draft_created`, `hubspot_contact_synced`, `slack_alert_sent`; approved draft delivered via WF02 | **PASS** |
| `MT-02` | `TC11` (Invalid Email) & `TC12` (Missing Fields) | Both returned `400 VALIDATION_ERROR` with field-level details | `0` DB rows written | **PASS** |
| `MT-03` | `TC08` Duplicate Replay of `MT-01` `submission_id` | `409 CONFLICT` (`Duplicate submission_id`) | No duplicate inquiry or side effects | **PASS** |
| `MT-04` | Error Scenario — Direct POST to WF01 webhook with invalid `x-webhook-secret` | `403 Forbidden` | Request rejected at Webhook Auth boundary; `0` DB writes | **PASS** |
| `MT-05` | `TC04` Borderline Lead → `needs_review` + Dashboard Reject | `POST /api/leads` → `202`; `POST /reject` → `202` | Classified `needs_review`, then transitioned to `approval_status='rejected'`, `lead_status='closed'`, `email_messages.status='cancelled'`, `sent_at=NULL` | **PASS** |

---

## 4. How to Re-run Locally

```powershell
# 1. Ensure Express API (localhost:4000) and n8n (localhost:5678, WF01–WF04 active) are running
# 2. Verify TypeScript checks
npm run typecheck

# 3. Run all 15 automated Vitest integration tests (with automatic run-scoped DB cleanup)
npm test
```
