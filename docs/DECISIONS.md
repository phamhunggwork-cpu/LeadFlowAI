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
