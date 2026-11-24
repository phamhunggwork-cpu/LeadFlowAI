# Architectural Decision Records (ADR) — LeadFlow AI

> Single Source of Truth for settled technical & architectural decisions. AI agents MUST NOT reverse any `Accepted` decision without explicit Developer approval.

| ID | Date | Status | Decision Summary |
|---|---|---|---|
| ADR-001 | 2026-11-22 | Accepted | Locked Tech Stack & External Providers |
| ADR-002 | 2026-11-22 | Accepted | WF01 Creates Operational Draft in `email_messages` |
| ADR-003 | 2026-11-22 | Accepted | Slack Alert Routing for `qualified` and `needs_review` |
| ADR-004 | 2026-11-22 | Accepted | Additive Migration for `score_breakdown` & `updated_at` Triggers |
| ADR-005 | 2026-11-22 | Accepted | n8n Workflow Deployment via Public REST API First (MCP Optional Later) |
| ADR-006 | 2026-11-22 | Accepted | Hybrid Testing Strategy (Vitest Integration + `test-form.html`) |
| ADR-007 | 2026-11-23 | Accepted | Switch Primary LLM Provider to DeepSeek (`deepseek-chat`) |
| ADR-008 | 2026-11-24 | Accepted | WF03 Deterministic Follow-up Template & Reconciliation |
| ADR-009 | 2026-11-24 | Accepted | WF04 Global Error Handler, Secret Redaction & Slack Alert Fallback |
| ADR-010 | 2026-11-24 | Accepted | Run-Scoped Prefix Isolation on Dev Supabase for Day 13 E2E Portfolio Runs |

---

## ADR-001: Locked Tech Stack & External Providers
- **Context:** Initial docs left frontend build tools, Node framework, LLM provider, email provider, and dashboard auth unspecified.
- **Decision:**
  - **Frontend:** React + TypeScript + Vite + Tailwind CSS + `@supabase/supabase-js` (`anon` key only).
  - **Backend:** Node.js + Express + TypeScript (`tsx`) + Zod + Helmet + `@supabase/supabase-js`.
  - **Auth:** Supabase Auth + PostgreSQL RLS (`database/policies/`).
  - **LLM:** OpenAI `gpt-4o-mini` with Structured Outputs (`json_schema` strict mode). Keep prompt/schema provider-agnostic so Gemini 2.5 Flash can be swapped in if needed.
  - **Email:** Resend REST API with `Idempotency-Key` header (24h dedup window) and `provider_message_id` persistence.
- **Consequences:** Minimal boilerplate for a 14-day solo portfolio; native alignment with Upwork portfolio title (`n8n, OpenAI, HubSpot, Supabase`).

## ADR-002: Operational Email Draft Ownership (Resolves Phase 1 Conflict)
- **Context:** `01-business-context.md` and `02-dataflow-and-states.md` assign `email_messages` draft creation to **WF01**, whereas the portfolio narrative placed draft saving under **WF02**.
- **Decision:** **WF01** creates BOTH:
  1. `lead_analyses.draft_email` (raw AI output snapshot — immutable audit record).
  2. `email_messages` row (`message_type='initial'`, `direction='outbound'`, `status='pending_approval'`, `idempotency_key='email:<inquiry_id>:initial'`) and sets `inquiries.approval_status='pending'` for `qualified` and `needs_review` leads.
  - For `not_qualified` leads, WF01 sets `inquiries.approval_status='not_required'` and does NOT create an `email_messages` row.
  - **WF02** owns human decision execution (`approved`/`rejected`), email dispatch via Resend, and post-send state transitions.
- **Consequences:** Dashboard immediately reads pending drafts from `email_messages` after WF01 finishes; clean separation of audit vs. operational state.

## ADR-003: Slack Alert Routing Condition (Resolves Phase 1 Conflict)
- **Context:** `01-business-context.md` mentioned alerting Slack for "high-priority leads", while `02-dataflow-and-states.md` routed both `Qualified` and `Needs Review` to Slack.
- **Decision:** WF01 sends Slack notifications for BOTH **`qualified`** (badged `[HIGH PRIORITY]`) and **`needs_review`** (badged `[NEEDS REVIEW]`). Leads classified as **`not_qualified`** (low budget, out-of-scope, or spam) MUST NOT trigger Slack notifications.
- **Consequences:** Sales team gets instant visibility into high-value leads and incomplete borderline leads requiring human triage without spam noise.

## ADR-004: Scoring Rationale & `updated_at` Triggers (Resolves Phase 1 Gap)
- **Context:** Day 6 requires saving qualification scores and explanations to the database, and `contacts`/`inquiries` have `updated_at` columns without an automatic update trigger in `LeadFlowAI.sql`.
- **Decision:** Keep `database/schema/LeadFlowAI.sql` as the immutable Day 2 baseline and apply an additive migration (`database/schema/002_score_breakdown_and_triggers.sql`) in Stage 2 that:
  1. Adds `score_breakdown JSONB NOT NULL DEFAULT '{}'::JSONB` to `public.lead_analyses`.
  2. Adds a `public.set_updated_at()` trigger function attached to `BEFORE UPDATE` on `public.contacts` and `public.inquiries`.
- **Consequences:** Full auditability of deterministic score breakdowns (`service_fit`, `budget_fit`, `timeline_fit`, `clarity`, `deal_breakers`) and accurate `updated_at` timestamps without breaking the initial schema file.

## ADR-005: n8n Workflow Deployment via REST API First
- **Context:** Local n8n workflows need version control in Git alongside fast iteration with AI.
- **Decision:** AI authors modular JS code in `n8n/code-nodes/`, prompts in `n8n/prompts/`, and complete workflow definitions in `n8n/workflows/wf0x-*.json`. A lightweight script (`n8n/scripts/sync-workflows.ts`) pushes workflows to local n8n via `POST /api/v1/workflows` and `PUT /api/v1/workflows/{id}` using `X-N8N-API-KEY`. Because `PUT` is a full replacement, synced JSON files must always remain complete and sanitized before commit. Live n8n MCP editing is deferred as an optional Stage 4 / v2 enhancement.
- **Consequences:** Git remains the authoritative source of workflow definitions; deterministic, reviewable diffs before pushing to n8n.

## ADR-006: Hybrid Testing Strategy (Day 13)
- **Context:** Solo portfolio needs strong engineering proof of API + workflow + DB correctness without brittle browser test maintenance.
- **Decision:** Combine **12–15 automated Vitest integration tests** (calling real Express API / n8n webhooks, polling a dedicated Supabase test environment, asserting both HTTP responses and DB rows, and cleaning up uniquely tagged test records) with **3–5 manual scenarios** in `tests/test-form.html`.
- **Consequences:** High reliability on core business guarantees (dedup, consent, HITL approval, error isolation) with zero risk to production data.

## ADR-007: Switch Primary LLM Provider to DeepSeek (`deepseek-chat`)
- **Context:** ADR-001 selected OpenAI `gpt-4o-mini` while keeping prompts and JSON schemas provider-agnostic. The developer elected to use DeepSeek (`DEEPSEEK_API_KEY`) for development and demo runs, and local n8n includes the native **DeepSeek Chat Model** node (`@n8n/n8n-nodes-langchain.lmChatDeepSeek`, credential type `deepSeekApi`).
- **Decision:**
  - Use **DeepSeek `deepseek-chat`** via native n8n `@n8n/n8n-nodes-langchain.lmChatDeepSeek` (`responseFormat: 'json_object'`, low temperature `0.2`, bounded timeout/retries) paired with `@n8n/n8n-nodes-langchain.chainLlm`.
  - Because DeepSeek uses JSON Mode (`json_object`) rather than OpenAI's `json_schema` `strict: true`, WF01 MUST enforce a **deterministic JavaScript schema validation gate** on the parsed JSON output before any Supabase write (`lead_analyses` / `email_messages`).
  - Maintain the non-negotiable AI vs. Deterministic Split: DeepSeek performs semantic extraction, spam suspicion, and email drafting ONLY — never computing `qualification_score`, `qualification_status`, or `priority`.
  - Prompt and output schema remain provider-agnostic so OpenAI `gpt-4o-mini` or Gemini can still be swapped in without changing downstream scoring or DB persistence.
- **Consequences:** Lower development/test API cost using the developer's existing DeepSeek key; strict schema gate guarantees identical safety against malformed AI JSON; portfolio narrative in `docs/portfolio/*` will be synced on Day 14.

## ADR-008: WF03 Deterministic Follow-up Template & Reconciliation
- **Context:** Day 11 needs a single automated follow-up 24h+ after the delivered initial email. Business rules forbid customer emails without human approval and forbid the LLM from sending emails.
- **Decision:**
  - The follow-up uses a **fixed deterministic template** (subject/body built in `n8n/code-nodes/evaluate-followup.js`); no LLM call. The human-approved initial email authorizes the sequence, and the template adds an opt-out line.
  - WF03 loads `followup_status='scheduled'` inquiries and evaluates stop rules in code: `unsubscribed_at` set, `lead_status` in `replied|closed|won`, or `consent_to_email != true` moves the lead to `followup_status='stopped'` and logs `follow_up_stopped` with the reason. Only `lead_status='contacted'` leads with a `sent` initial email older than 24h are sent.
  - Inserting the `follow_up` row (`idempotency_key = email:<inquiry_id>:follow_up_1`, UNIQUE) before calling Resend is the duplicate lock; the same key is sent as the Resend `Idempotency-Key`. Existing follow-up rows are never re-sent automatically (failed rows stay `failed` with a `workflow_errors` entry for Day 12 retry handling).
  - If a `sent` follow-up row already exists while the inquiry is still `scheduled` (partial failure), WF03 reconciles `followup_status='sent'` and logs `follow_up_reconciled_sent` instead of re-sending.
  - Per-run cap of 25 sends. `PostgREST in.(...)` filters are built only from regex-validated DB UUIDs.
- **Consequences:** No new enum values or schema changes. Deterministic, replay-safe follow-ups; failed sends need manual or Day 12 retry.

## ADR-009: WF04 Global Error Handler, Secret Redaction & Slack Alert Fallback
- **Context:** Unhandled production failures in WF01–WF03 (timeouts, unwired errors, trigger failures) must be persisted to `public.workflow_errors` and alerted to admins on Slack without losing lead data, leaking secrets, or breaking if Supabase is temporarily down.
- **Decision:**
  - Build **WF04 (`WF04 - Error Handling & Logging`)** as a fast 5-node Error Trigger workflow (`Workflow Error Trigger` → `Normalize Error Context` → `Record Workflow Error` → `Prepare Admin Alert` NoOp → `Send Slack Admin Alert`), with **no `errorWorkflow` set on WF04 itself** to avoid error recursion.
  - Wire WF04 as `settings.errorWorkflow` (with `saveDataErrorExecution: "all"`) on live `WF01`, `WF02`, and `WF03` in n8n. Keep instance-specific workflow IDs out of committed `wf01`–`wf03` JSON exports so `sync-workflows.ts --push` remains portable across environments.
  - `Normalize Error Context` redacts bearer tokens, API key prefixes (`sk-`, `re_`, `pat-`, `xoxb-`, `xoxp-`, `n8n_api_`), and JWTs before DB write or Slack alert, caps `error_message` at 1000 chars, extracts `submission_id` (`sub_*`) when present, and leaves `inquiry_id = NULL` on generic Error Trigger payloads to prevent FK constraint failures.
  - `Record Workflow Error` uses `onError: 'continueErrorOutput'` routed into the same `Prepare Admin Alert` NoOp convergence node so Slack still fires with an explicit DB-failure indicator if Supabase is unreachable.
  - Per developer choice, WF04 posts `[WORKFLOW ERROR]` Block Kit alerts to `#sales-leads` (reusing the existing `Slack LeadFlow` bot channel) with direct links to the failed execution, workflow editor, and LeadFlow Dashboard.
- **Consequences:** All 4 workflows (`WF01`–`WF04`) are now active and fault-isolated; safe retries are guaranteed by `inquiries.submission_id` (UNIQUE), `contacts` normalized email + HubSpot upsert, and `email_messages.idempotency_key` (UNIQUE) + Resend `Idempotency-Key`.

## ADR-010: Run-Scoped Prefix Isolation on Dev Supabase for Day 13 E2E Portfolio Runs
- **Context:** `TESTING_STRATEGY.md` (ADR-006) recommends a dedicated Supabase test project (`TEST_SUPABASE_URL`) so automated Vitest tests never affect production data. On the developer's Supabase Free tier account (2/2 active projects already provisioned), creating a 3rd project is blocked and swapping n8n's `Supabase LeadFlow` credential back and forth before Day 14 demo adds configuration drift risk, while `leadflow-ai` contains only dev/demo data.
- **Decision:**
  - Keep the Vitest harness strictly environment-driven (`TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY`, `TEST_SUPABASE_SERVICE_ROLE_KEY`, `TEST_RUN_PREFIX`) so production/CI deployments can point to a dedicated Supabase test project with zero code changes.
  - For local solo-portfolio runs on `leadflow-ai` dev, enforce 3 isolation controls: (1) unique per-run prefix (`${TEST_RUN_PREFIX}<runId>_`) on every `submission_id` and email, (2) Resend safe test sink emails (`delivered+<prefix>@resend.dev`) so no real inbox is emailed, and (3) mandatory FK-safe `afterAll` cleanup (`workflow_errors` → `activity_logs` → `email_messages` → `lead_analyses` → `inquiries` → `contacts`) verified to leave `0` residual rows.
- **Consequences:** Enables full live E2E verification across Express, n8n `WF01`–`WF04`, DeepSeek, HubSpot, Resend, Slack, and Supabase with zero leftover test data while preserving drop-in dedicated-test-DB portability.
