---
trigger: model_decision
description: Apply when writing or reviewing SQL schemas, migrations, Supabase Auth, RLS policies, or Supabase client queries across database/, backend/, frontend/, and tests/.
---

# Rule: Supabase Schema, Auth & RLS (`LeadFlow AI`)

1. **Postgres Best Practices First:** Load `supabase-postgres-best-practices` before creating or altering tables, columns, indexes, triggers, functions, or RLS policies.
2. **Strict Enum Fidelity:** All status values MUST match `CHECK` constraints in `database/schema/LeadFlowAI.sql`:
   - `inquiries.lead_status`: `new | processing | qualified | needs_review | not_qualified | contacted | replied | closed | won`
   - `inquiries.priority`: `low | medium | high`
   - `inquiries.approval_status`: `not_required | pending | approved | rejected`
   - `inquiries.followup_status`: `not_eligible | scheduled | sent | stopped`
   - `email_messages.status`: `draft | pending_approval | approved | queued | sent | failed | cancelled`
3. **Zero Frontend Secret Leakage:** `frontend/` may use ONLY `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. NEVER reference or import `SUPABASE_SERVICE_ROLE_KEY` in `frontend/`.
4. **RLS Access Boundaries:**
   - Enable RLS on all 6 tables (`database/policies/`).
   - `anon` has NO direct table read/write access (public lead submissions go through Express `POST /api/leads`).
   - `authenticated` dashboard users require valid Supabase Auth JWT verified server-side (`supabase.auth.getUser(token)`).
5. **Safe SQL Authoring:**
   - Keep `database/schema/LeadFlowAI.sql` as the immutable Day 2 baseline; add changes as idempotent numbered migrations (`002_*.sql`, ...).
   - Always set `SET search_path = ''` on Postgres trigger/helper functions and index all foreign key columns.
6. **Test Isolation:** Automated Vitest queries and teardown cleanup MUST target `TEST_SUPABASE_URL` only, scoped strictly to `TEST_RUN_PREFIX`.
