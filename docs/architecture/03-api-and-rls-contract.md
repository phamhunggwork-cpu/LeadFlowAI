# API, AI Schema, Scoring & RLS Contract — LeadFlow AI

> Single Source of Truth for interfaces across `frontend/`, `backend/`, `n8n/`, and `database/`.
> Database tables, columns, and `CHECK` enums are defined in [LeadFlowAI.sql](../../database/schema/LeadFlowAI.sql) (do not duplicate DDL here).

---

## 1. Standard API Response Envelope

All Express endpoints (`/api/*`) return JSON using a consistent envelope:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Error response:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": []
  }
}
```

| HTTP Status | Error Code | When Used |
|---|---|---|
| `200` | — | Successful read or synchronous state update |
| `202` | — | Inquiry accepted & forwarded to n8n WF01 / approval forwarded to WF02 |
| `400` | `VALIDATION_ERROR` | Zod schema failure (missing required fields, invalid email, invalid range) |
| `401` | `UNAUTHORIZED` | Missing or invalid Supabase JWT bearer token |
| `403` | `FORBIDDEN` | Authenticated user lacks permission / RLS denial |
| `404` | `NOT_FOUND` | Inquiry or email draft not found |
| `409` | `CONFLICT` | Duplicate `submission_id` or invalid state transition (e.g., already approved/sent) |
| `502` | `UPSTREAM_ERROR` | n8n webhook unreachable or returned non-2xx error |

---

## 2. Express API Endpoints (`backend/`)

| Method & Path | Auth | Purpose | Downstream Target |
|---|---|---|---|
| `GET /api/health` | Public | Liveness check (`{ status: "ok", timestamp }`) | None |
| `POST /api/leads` | Public (validated + rate-limited) | Receives website inquiry form, validates via Zod, generates `submission_id` if omitted, forwards to n8n WF01 with `x-webhook-secret`. | n8n `WF01` Webhook |
| `GET /api/inquiries` | Bearer JWT (Supabase Auth) | Lists inquiries joined with `contacts` and latest `lead_analyses` (`?status=&priority=&approval_status=`). | Supabase DB |
| `GET /api/inquiries/:id` | Bearer JWT (Supabase Auth) | Full inquiry detail: contact, latest analysis, `email_messages`, and `activity_logs`. | Supabase DB |
| `POST /api/inquiries/:id/approve` | Bearer JWT (Supabase Auth) | Approves pending email draft (optional edited `subject`/`body`), triggers WF02 with `approved_by = user.id`. | n8n `WF02` Webhook |
| `POST /api/inquiries/:id/reject` | Bearer JWT (Supabase Auth) | Rejects pending email draft (optional `reason`), triggers WF02 to mark `rejected`/`cancelled` & `closed`. | n8n `WF02` Webhook |
| `PATCH /api/inquiries/:id/status` | Bearer JWT (Supabase Auth) | Manual lifecycle updates (`replied`, `closed`, `won`, or set `unsubscribed_at = NOW()` which forces `followup_status = 'stopped'`). | Supabase DB + `activity_logs` |
| `GET /api/workflow-errors` | Bearer JWT (Supabase Auth) | Lists `workflow_errors` (`?status=open\|resolved`) for operational monitoring. | Supabase DB |

### `POST /api/leads` Request Schema (Zod — aligned with `test-data/mock-leads.json`)
- `submission_id`: `string` (optional on form; auto-generated `sub_<ts>_<rand>` if absent; preserved if provided for idempotency tests)
- `full_name`: `string` (required, trimmed, min 1 char)
- `email`: `string` (required, trimmed, valid email format; normalized lowercase in backend & WF01)
- `company_name`: `string | null` (optional)
- `phone`: `string | null` (optional)
- `service_type`: `string | null` (optional)
- `budget_min`: `number | null` (optional, `>= 0`)
- `budget_max`: `number | null` (optional, `>= 0`, `>= budget_min` if both present)
- `budget_currency`: `string` (default `"USD"`)
- `timeline_weeks`: `number | null` (optional, integer `> 0`)
- `project_description`: `string` (required, trimmed, min 10 chars)
- `consent_to_email`: `boolean` (default `false`)
- `consent_timestamp`: `ISO 8601 string | null` (set automatically when `consent_to_email === true`)
- `consent_source`: `string` (default `"website_contact_form"`)

---

## 3. Backend ↔ n8n Webhook & REST API Contract

### Runtime Webhooks (Backend → n8n)
- **Auth Header:** `x-webhook-secret: <N8N_WEBHOOK_SECRET>` (verified by n8n Header Auth / IF check on every webhook).
- **WF01 Intake:** `POST ${N8N_WEBHOOK_BASE_URL}/webhook/lead-intake` (body: normalized `POST /api/leads` payload).
- **WF02 Approval:** `POST ${N8N_WEBHOOK_BASE_URL}/webhook/lead-approval`
  ```json
  {
    "inquiry_id": "uuid",
    "email_message_id": "uuid",
    "action": "approve | reject",
    "approved_by": "supabase-auth-user-uuid",
    "subject": "optional edited subject",
    "body": "optional edited body",
    "rejection_reason": "optional string"
  }
  ```
- **Email Idempotency Keys (`email_messages.idempotency_key` & Resend `Idempotency-Key` header):**
  - Initial email (WF02): `email:<inquiry_id>:initial`
  - First follow-up (WF03): `email:<inquiry_id>:follow_up_1`

### Deployment Sync (Local Repo → Local n8n Instance)
- **Endpoint:** `${N8N_API_BASE_URL}/workflows` (default `http://localhost:5678/api/v1/workflows`)
- **Auth Header:** `X-N8N-API-KEY: <N8N_API_KEY>`
- **Update Rule:** `PUT /api/v1/workflows/{id}` replaces the entire workflow object; `n8n/scripts/sync-workflows.ts` must always send complete `name`, `nodes`, `connections`, and `settings`.

---

## 4. AI Structured Output Schema (`DeepSeek deepseek-chat`, JSON Mode + Strict JS Schema Gate — ADR-007)

Stored in `lead_analyses` (`model_name = 'deepseek-chat'`, `prompt_version`). **LLM MUST NOT return `qualification_score`, `qualification_status`, or `priority`.** WF01 requests `responseFormat = 'json_object'` and validates every field and enum with a deterministic JS schema gate before writing to Supabase.

```json
{
  "detected_service": "Custom Web Applications & SaaS MVPs | B2B Marketing & Corporate Websites | Web App Redesign & Performance Optimization | Third-party API & Database Integrations | Out of Scope",
  "project_summary": "2-3 concise sentences summarizing scope and goals",
  "missing_information": ["array of concrete missing scope/budget/timeline items"],
  "scope_fit": "high | medium | low",
  "spam_suspected": false,
  "clarity_score_band": "high | medium | low",
  "draft_email_subject": "Consultative, specific subject line",
  "draft_email_body": "Tailored Veloce Digital response proposing a 15-min discovery call"
}
```

- **Malformed / Failed AI Output:** If JSON parsing or schema validation fails, WF01 MUST NOT insert fabricated analysis rows; route failure to WF04 (`workflow_errors` + Slack admin alert).

---

## 5. Deterministic JS Scoring Spec (`n8n/code-nodes/score-lead.js`)

Implements rules in [01-business-context.md](./01-business-context.md#L66-L99):

| Dimension | Max | Rule Summary |
|---|---|---|
| **Service fit** | 30 | `scope_fit='high'` & in-scope service → 30; `medium` → 18; `low` → 5; `Out of Scope` → 0 (deal-breaker). |
| **Budget fit** | 30 | Effective budget (`budget_max ?? budget_min`): `$5k–$25k` → 30; `>$25k` → 26; `$3k–$4,999` → 20; `$1,500–$2,999` → 10; `null` (undisclosed) → 10 (+ force `needs_review`); `<$1,500` → 0 (deal-breaker). |
| **Timeline fit** | 20 | `4–16` weeks → 20; `17–24` or `2–3` weeks → 12; `null` → 8; `<2` or `>24` weeks → 5. |
| **Project clarity** | 20 | `clarity_score_band`: `high` (0–1 missing items) → 20; `medium` → 12; `low` → 5. |

- **Deal-breaker overrides (force `not_qualified`, `priority='low'`, `approval_status='not_required'`, `followup_status='not_eligible'`):**
  1. `spam_suspected === true`
  2. `detected_service === 'Out of Scope'`
  3. Effective budget is known and `< 1500`
- **Missing-info floor:** If no deal-breaker triggered AND (`budget_min === null && budget_max === null`) OR `missing_information.length >= 2`, cap classification at **`needs_review`** (never auto-reject, never auto-qualify).
- **Thresholds (when no override applies):** `75–100` → `qualified` (`priority='high'`, `approval_status='pending'`); `45–74` → `needs_review` (`priority='medium'`, `approval_status='pending'`); `<45` → `not_qualified` (`priority='low'`, `approval_status='not_required'`).
- **Persistence:** Store itemized breakdown & override reasons in `lead_analyses.score_breakdown` (ADR-004).

---

## 6. Supabase Auth & RLS Policy Matrix

All 6 tables enable `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`. SQL policies live in `database/policies/`.

| Role | `contacts`, `inquiries`, `lead_analyses`, `email_messages`, `activity_logs`, `workflow_errors` | Notes |
|---|---|---|
| `anon` | **DENY ALL** (no grants / no permissive policies) | Public lead form submits via Express `POST /api/leads`, never directly to Supabase. |
| `authenticated` | `SELECT` on all 6 tables (sales rep dashboard); `UPDATE` limited to controlled actions or routed via Express with JWT verification (`supabase.auth.getUser(token)`). | Dashboard uses Supabase Auth login; JWT verified on every protected Express route. |
| `service_role` | Full access (bypasses RLS) | Used ONLY inside `backend/`, `n8n/`, and Vitest teardown scripts. **NEVER in `frontend/`.** |

---

## 7. Environment Variables
See committed templates (no real values):
- Root (n8n REST API + Vitest test env): [`.env.example`](../../.env.example)
- Backend API Gateway: [`backend/.env.example`](../../backend/.env.example)
- Frontend Vite App: [`frontend/.env.example`](../../frontend/.env.example)
