# AGENTS.md — LeadFlow AI Workspace Instructions

## 1. Project Identity
- **Project:** LeadFlow AI — AI-Powered Lead Qualification & CRM Automation for **Veloce Digital** (simulated 12-person boutique web & software studio).
- **Goal:** Production-grade **14-day Upwork Portfolio** demonstrating end-to-end lead intake, AI qualification, deterministic scoring, HubSpot sync, Slack alerting, Human-in-the-Loop (HITL) email approval, conditional follow-up, and resilient error handling.
- **Mode:** Solo developer + **Antigravity** (single primary agent; use built-in `research` / `browser` subagents only for read-only inspection or UI verification).

## 2. Locked Tech Stack
- **Frontend (`frontend/`):** React + TypeScript + Vite + Tailwind CSS + `@supabase/supabase-js` (`anon` key only).
- **Backend (`backend/`):** Node.js + Express + TypeScript (`tsx`) + Zod + Helmet + `@supabase/supabase-js`.
- **Database & Auth (`database/`):** Supabase PostgreSQL (6 tables) + **Supabase Auth & RLS**.
- **Automation (`n8n/`):** 4 modular n8n workflows (`WF01`–`WF04`) stored as versioned JSON + separated JS code nodes & prompts, deployed to local n8n via official **n8n Public REST API** (`POST/PUT /api/v1/workflows`).
- **External Integrations:** DeepSeek `deepseek-chat` (JSON mode + strict JS schema gate per ADR-007; provider-agnostic prompt/schema), Resend API (`Idempotency-Key`), HubSpot CRM, Slack.
- **Testing (`tests/`):** Hybrid Testing — Node.js + **Vitest** (12–15 automated integration tests with async polling on dedicated Supabase test env) + `tests/test-form.html` (3–5 manual scenarios).

## 3. Non-Negotiable Invariants
1. **AI vs. Deterministic Split:** LLM performs semantic extraction, spam suspicion, and email drafting ONLY. Deterministic JavaScript computes the qualification score (0–100), deal-breaker overrides, status, and priority. The LLM MUST NEVER compute the final score or send customer-facing emails.
2. **Schema Gate Before DB Write:** Validate all external inputs and LLM JSON responses with strict schemas before writing to Supabase. Malformed AI JSON must never insert fabricated data.
3. **Zero Secret Leakage:** NEVER expose `SUPABASE_SERVICE_ROLE_KEY`, `N8N_WEBHOOK_SECRET`, `X-N8N-API-KEY`, or third-party API tokens in `frontend/`, console logs, or committed files. Never commit `.env` files.
4. **Database Enum Fidelity:** All status values MUST strictly match `CHECK` constraints in `database/schema/LeadFlowAI.sql`. Never invent new enum values without an approved migration and ADR.
5. **Draft Email Ownership:** `lead_analyses.draft_email` stores the immutable raw AI draft snapshot (audit); `email_messages` is the operational source of truth for dashboard review, approval, idempotency, and delivery.
6. **n8n Safety:** Always sanitize `n8n/workflows/*.json` before committing. Remember `PUT /api/v1/workflows/{id}` performs a **full replacement** — always send complete workflow definitions.
7. **Dual Verification Rule:** Never mark an integration test PASS unless BOTH the API response and the expected Supabase database state have been verified (where applicable). Never run tests against production data.

## 4. Single Source of Truth (SSOT) & Conflict Priority
When documents disagree, resolve in this strict order (highest priority first):
1. `database/schema/LeadFlowAI.sql` *(+ numbered SQL migrations)* — Database schema, constraints, enums
2. `docs/architecture/03-api-and-rls-contract.md` — Express API, Zod/AI schemas, scoring rubric, RLS matrix
3. `docs/DECISIONS.md` — Architectural Decision Records (ADRs); do NOT override without user approval
4. `docs/architecture/01-business-context.md` & `docs/architecture/02-dataflow-and-states.md` — Business rules & state flows
5. `docs/TESTING_STRATEGY.md` — Hybrid testing & verification standards
6. `docs/PROJECT_STATUS.md` — Master 51-task progress tracker & Session Handoff
7. `docs/setup/git-workflow.md` — Branching, Conventional Commits & n8n export hygiene
8. `docs/portfolio/*` — Portfolio narrative (frozen until Day 14 sync; link, do not duplicate into active docs)

## 5. Mandatory Context Loading Protocol
### Before Every Task
1. Read `docs/PROJECT_STATUS.md` (check Session Handoff, active day, and current task).
2. Read ONLY the task-relevant SSOT file(s) (`LeadFlowAI.sql`, `03-api-and-rls-contract.md`, `DECISIONS.md`, or `TESTING_STRATEGY.md`).
3. Run `git status && git branch && git log -n 5 --oneline` to verify real workspace state.
4. Propose a brief Plan with measurable Acceptance Criteria (API + DB) and wait for Developer approval on multi-file or architectural tasks.

### During Every Task
- Stay strictly within the approved slice and file scope.
- Use installed official plugins/skills when working in their domains (`supabase`, `supabase-postgres-best-practices`, `using-n8n-skills-official`).
- If requirements conflict or critical details are missing, STOP and ask — do not guess or silently change ADRs.

### After Every Task
1. Run verification (`typecheck`, Vitest against dedicated test env, and n8n JSON sanitization if workflows changed).
2. Update `docs/PROJECT_STATUS.md` (tick completed tasks and refresh the 5-line **Session Handoff**).
3. Add a brief ADR entry to `docs/DECISIONS.md` if a new architectural decision was made.
4. Report changed files, verification results (PASS/FAIL), and remaining items before committing per `docs/setup/git-workflow.md`.
