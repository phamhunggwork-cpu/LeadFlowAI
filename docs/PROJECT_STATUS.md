# Project Status & Session Handoff — LeadFlow AI

> **Single Source of Truth** for project progress (51 tasks across 14 days) and cross-session continuity.
> Portfolio docs in `docs/portfolio/` are frozen until Day 14 final sync — always update progress HERE only.

- **Current Workflow Stage:** Stage 2 (AI Dev Environment) — Completed
- **Current Roadmap Day:** Day 3 (Lead Intake)
- **Active Git Branch:** `feat/day3-lead-intake`
- **Overall Progress:** `7 / 51` roadmap tasks completed (`13.7%`)
- **Last Updated:** 2026-11-22

---

## Session Handoff (Read First & Update Before Closing Every Session)

1. **Last Completed:** Stage 2 AI Dev Environment + Supabase DB hardening (`leadflow-ai`): applied `002_score_breakdown_and_triggers.sql` (`score_breakdown` + 2 triggers) and full `001_rls_and_grants.sql` (`6/6` tables with RLS enabled, `6/6` `SELECT` policies for `authenticated` using initPlan-cached `auth.uid() IS NOT NULL`, `authenticated` restricted strictly to `SELECT`, `anon` revoked, `service_role` full DML; Supabase security advisors: `0` issues). Root `.env`, `backend/.env`, and `frontend/.env` are configured and gitignored.
2. **Current State / Branch:** Branch `feat/day3-lead-intake` has Stages 1 & 2 committed plus updated `database/policies/001_rls_and_grants.sql` and `docs/PROJECT_STATUS.md`. Ready to scaffold Stage 3 (Day 3).
3. **Blockers / Pending Actions:** No blockers for Day 3. Deferred non-blocking items: (a) create test/reviewer user in Supabase `auth.users` before Day 9 / Vitest; (b) confirm LLM provider (`OpenAI gpt-4o-mini` in ADRs vs `DEEPSEEK_API_KEY` in `backend/.env`) before Day 5; (c) note `TEST_SUPABASE_URL` currently points to `leadflow-ai` (separate test project or strict `TEST_RUN_PREFIX` cleanup needed before Day 13).
4. **Next Immediate Action:** Begin **Stage 3 — Day 3 Lead Intake** (create WF01 Webhook Trigger JSON synced via `sync-workflows.ts`, scaffold Express API Gateway `backend/`, and build React Lead Form `frontend/`).
5. **Key Reference Files:** `AGENTS.md`, `docs/architecture/03-api-and-rls-contract.md`, `n8n/scripts/sync-workflows.ts`, `database/policies/001_rls_and_grants.sql`.

---

## AI Development Setup Stages (4-Stage Implementation Plan)

- [x] **Stage 1 — Foundation:** Core `.md` context system, ADRs, API/RLS contract, testing spec, `.env.example` templates, Git workflow committed.
- [x] **Stage 2 — AI Dev Environment:** `.agents/rules/`, `.agents/skills/`, additive SQL migration `002`, RLS & grants SQL `001`, and `n8n/scripts/sync-workflows.ts` verified against local n8n REST API.
- [ ] **Stage 3 — Development Workflow (Days 3–13):** Full-stack + 4 n8n workflows + Supabase RLS + Hybrid Testing report (`e2e-report.md`).
- [ ] **Stage 4 — Optimization & Portfolio Handover (Day 14):** Prune unused rules/skills, sanitize n8n JSON, sync Portfolio docs, finalize `README.md`, record 60–90s demo, tag `v1.0.0`.

---

## 14-Day Master Roadmap Checklist (`7 / 51`)

### Day 1 — Business Problem & Requirements (`3 / 3`)
- [x] Write simulated company profile (Veloce Digital) and lead intake process (`docs/architecture/01-business-context.md`)
- [x] Finalize form fields and lead-scoring criteria
- [x] Draw data-flow diagram and define 4-dimension lead states (`docs/architecture/02-dataflow-and-states.md`)

### Day 2 — Environment Setup (`3 / 3`)
- [x] Run n8n local (Docker / existing instance)
- [x] Create Supabase project and initial 6 tables (`database/schema/LeadFlowAI.sql`)
- [x] Create test form (`tests/test-form.html`) and simulated mock dataset (`test-data/mock-leads.json`)

### Day 3 — Lead Intake (`0 / 3`)
- [ ] Create React form (`frontend/`)
- [ ] Create Node.js Express API Gateway calling authenticated n8n webhook (`backend/`)
- [ ] Create WF01 Webhook Trigger in n8n (`n8n/workflows/wf01-lead-intake-qualification.json`)

### Day 4 — Validation & Duplicate Prevention (`0 / 4`)
- [ ] Validate required fields and email format (Zod + WF01)
- [ ] Normalize data via JS Code node (`n8n/code-nodes/`)
- [ ] Generate/enforce unique `submission_id` and idempotency check
- [ ] Save `contacts` (normalized email upsert) and `inquiries` into Supabase

### Day 5 — AI Qualification (`0 / 4`)
- [ ] Write system prompt and extraction criteria (`n8n/prompts/`)
- [ ] Connect OpenAI `gpt-4o-mini` API
- [ ] Enforce strict JSON schema output (no score generation by LLM)
- [ ] Validate and safely handle malformed/timeout AI responses

### Day 6 — Lead Scoring & Routing (`0 / 3`)
- [ ] Write deterministic JS scoring rules (0–100 + deal-breakers) in `n8n/code-nodes/`
- [ ] Build `Qualified` / `Needs Review` / `Not Qualified` branches
- [ ] Save score, `score_breakdown`, and initial operational draft (`email_messages`) to Supabase

### Day 7 — HubSpot Integration (`0 / 4`)
- [ ] Configure HubSpot Developer / Private App access
- [ ] Configure HubSpot credential in n8n
- [ ] Create or update HubSpot contact by normalized email and save `hubspot_contact_id`
- [ ] Verify field mapping and API error handling

### Day 8 — Slack Notification (`0 / 3`)
- [ ] Create Slack app / webhook credential
- [ ] Format structured notification message with dashboard review link
- [ ] Alert only for `qualified` (`[HIGH PRIORITY]`) and `needs_review` (`[NEEDS REVIEW]`) leads

### Day 9 — Human Approval Dashboard (`1 / 4`)
- [x] Apply Supabase Auth & RLS policies (`database/policies/`) *(6/6 tables RLS + least-privilege grants verified on `leadflow-ai`; create reviewer user in `auth.users` when testing Day 9 login)*
- [ ] Build lead review dashboard screen showing AI summary, score breakdown & email draft (`frontend/`)
- [ ] Build authenticated Approve / Reject endpoints (`backend/`)
- [ ] Verify JWT authentication & authorization before executing actions

### Day 10 — Email Automation (`0 / 4`)
- [ ] Connect Resend email provider in WF02
- [ ] Send initial email ONLY after explicit human approval
- [ ] Log delivery (`email_messages.status`, `provider_message_id`, `sent_at`) and `activity_logs`
- [ ] Prevent duplicate sending via `idempotency_key` (`email:<inquiry_id>:initial`)

### Day 11 — Follow-up Automation (`0 / 4`)
- [ ] Create WF03 Schedule Trigger querying 24h+ eligible leads
- [ ] Verify status, `consent_to_email = true`, `unsubscribed_at IS NULL`, no reply, not `closed`/`won`
- [ ] Send single conditional follow-up email with `Idempotency-Key`
- [ ] Stop sequence on reply, unsubscribe, `closed`, or `won`

### Day 12 — Error Handling (`0 / 4`)
- [ ] Create WF04 Error Trigger workflow
- [ ] Record failures into `workflow_errors` table in Supabase
- [ ] Send Slack admin alert on failure
- [ ] Verify safe retries without duplicate emails or duplicate CRM contacts

### Day 13 — Hybrid End-to-End Testing (`0 / 4`)
- [ ] Run automated Vitest tests: valid leads, missing fields, invalid email, auth checks
- [ ] Run automated Vitest tests: duplicate `submission_id`, existing contact new inquiry, webhook replay
- [ ] Run automated Vitest tests: malformed AI JSON, upstream failures, rejected/unapproved leads
- [ ] Verify no email without consent/approval, execute 3–5 manual `test-form.html` cases, publish `tests/reports/e2e-report.md`

### Day 14 — Finalize Upwork Portfolio (`0 / 4`)
- [ ] Clean UI and demo data; sync final counts into `docs/portfolio/*`
- [ ] Export and sanitize all 4 workflow JSON files (`leadflow-n8n-sanitize`)
- [ ] Write complete `README.md` with architecture diagram, setup guide, credentials & test results
- [ ] Record 60–90s demo video and tag `v1.0.0`
