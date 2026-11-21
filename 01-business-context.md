# Business Context & Lead Intake Process — LeadFlow AI

## 1. Simulated Company Profile

- **Company Name & Size:** Veloce Digital — Boutique Web & Software Studio (12 people, remote-first)
- **Core Services:**
  1. Custom Web Applications & SaaS MVPs (React, Next.js, Node.js)
  2. B2B Marketing & Corporate Websites
  3. Web App Redesign & Performance Optimization
  4. Third-party API & Database Integrations
- **Ideal Client Profile (ICP) & Budget Floor:**
  - Startups (Seed – Series A) and SMBs in the US/EU.
  - Minimum budget: **$3,000** (Sweet spot: $5,000 – $25,000).
  - Realistic timeline: **4 – 16 weeks**.
- **Out of Scope (Deal-breakers / Not Qualified):**
  - Budget under $1,500 or equity-only / unpaid partnerships.
  - Minor WordPress/Wix template tweaks or small bug fixes under 5 hours.
  - Mobile-only native apps (iOS/Android), pure SEO/Ads management, or graphic design.
  - Spam, cold pitches, or recruitment inquiries.
- **Email Brand Tone:**
  - Consultative, direct, and technical-friendly (no fluff or generic sales clichés).
  - Acknowledge the prospect's specific project details, point out 1–2 missing technical or scope details if applicable, and propose a 15-minute discovery call.

---

## 2. Lead Intake Process (As-Is vs. To-Be)

### Current Manual Process (As-Is)
Every day, Veloce Digital receives a mix of inquiries through its website contact form—ranging from high-value SaaS MVP builds ($10k–$25k) to out-of-scope WordPress tweaks, low-budget requests, and spam.

Currently, the sales team handles every submission manually:
1. A sales rep opens each inquiry, reads the project description, and checks whether the budget, timeline, and scope fit Veloce Digital's services.
2. The rep manually copies contact and project details into HubSpot CRM.
3. The rep drafts and sends an initial response email, then manually tracks whether the prospect replies.

**Operational Pain Points:**
- Time wasted reading and filtering unqualified, incomplete, or duplicate inquiries.
- Slow response times for high-priority prospects, increasing the risk of losing qualified leads.
- Inconsistent qualification criteria and manual data entry errors (such as duplicate CRM contacts).

### Target Automated Process (To-Be — LeadFlow AI)
LeadFlow AI automates lead capture, qualification, CRM synchronization, and controlled outreach across four modular n8n workflows:

1. **Capture, Validation & Deduplication:**
   - Prospects submit the website inquiry form (name, email, company, optional phone, budget, timeline, project description, and email consent).
   - A Node.js backend securely forwards the payload to an n8n webhook.
   - n8n validates required fields and email format, normalizes the data, and checks a unique `submission_id` to prevent duplicate processing (while still allowing the same contact to submit multiple distinct project inquiries).
2. **AI Qualification & Rule-Based Scoring:**
   - An LLM analyzes the inquiry against Veloce Digital's company profile and returns structured JSON: detected service type, concise summary, missing information, and a tailored email draft.
   - Deterministic JavaScript rules calculate a qualification score (0–100) and route the lead into `Qualified`, `Needs Review`, or `Not Qualified`.
3. **Database Logging, CRM Sync & Alerting:**
   - All contact, inquiry, and analysis records are stored in Supabase.
   - Contacts are created or updated in HubSpot CRM.
   - High-priority leads trigger an instant Slack notification with key details and a link to review.
4. **Human-in-the-Loop Approval & Email Delivery:**
   - No customer-facing email is sent automatically by AI.
   - AI stores its raw draft snapshot in `lead_analyses.draft_email` for audit, while WF01 creates an operational draft record in `email_messages` (`status = 'pending_approval'`) and sets `inquiries.approval_status = 'pending'`.
   - A sales rep reviews the AI summary, score, and email draft on an internal dashboard and clicks `Approve` or `Reject`.
   - Only approved leads trigger email delivery via `email_messages` (protected by `idempotency_key`); all approval and sending actions are recorded in `activity_logs`.
5. **Conditional Follow-up & Error Handling:**
   - After 24 hours, a scheduled workflow checks for unreplied leads and sends a single follow-up email only if `consent_to_email` is true and the lead has not replied, unsubscribed, or moved to `Closed`/`Won`.
   - A dedicated Error Trigger workflow captures failures (API timeouts, invalid AI JSON, CRM errors), logs them to `workflow_errors`, and alerts the admin via Slack without losing lead data or causing duplicate actions.

## 3. Additional Business Rules & Qualification Logic

### 3.1 Budget Qualification Rules

- Below $1,500: Not Qualified.
- $1,500–$2,999: Needs Review.
- $3,000–$4,999: Potentially Qualified, subject to service fit and project scope.
- $5,000–$25,000: Preferred budget range.
- Above $25,000: Qualified if the project scope and delivery capacity are feasible.
- Unknown or undisclosed budget: Needs Review until clarified.

### 3.2 AI vs. Deterministic Decision-Making

The LLM is responsible for semantic analysis, including service classification, project summarization, missing information detection, spam suspicion, and email drafting.

Deterministic JavaScript rules are responsible for budget validation, timeline assessment, deal-breaker detection, lead scoring, qualification status, and priority assignment.

The LLM must not independently determine the final qualification score or trigger customer-facing actions.

### 3.3 Lead Scoring Model

Initial scoring criteria:

- Service fit: 0–30 points.
- Budget fit: 0–30 points.
- Timeline fit: 0–20 points.
- Project clarity: 0–20 points.

Qualification thresholds:

- 75–100: Qualified.
- 45–74: Needs Review.
- Below 45: Not Qualified.

Explicit deal-breakers override the numerical score. Missing critical information must result in manual review rather than an automatic rejection.

### 3.4 Duplicate Handling

- `submission_id` must be unique and enforced at the database level.
- Repeated requests with the same `submission_id` must not create duplicate inquiries or trigger duplicate actions.
- Existing contacts may submit multiple distinct inquiries.
- Contact records should be matched using normalized email addresses, while each new valid submission creates a separate inquiry record.

### 3.5 Email & Consent Rules

- Customer-facing emails must not be sent without the required human approval.
- Automated follow-up emails are permitted only when `consent_to_email` is true.
- Unsubscribed, bounced, replied, Closed, or Won leads must be excluded from further follow-up.
- Consent metadata should include `consent_timestamp` and `consent_source`.
- Email delivery status and approval history must be recorded.

### 3.6 Follow-up Reply Detection

The initial version may support manual reply status updates through the internal dashboard.

A future version may integrate an inbound email webhook or Gmail/Outlook API to detect replies automatically and update the corresponding inquiry.

### 3.7 Operational Monitoring

The system should track:

- Total inquiries received.
- Qualified lead rate.
- Average qualification processing time.
- Duplicate submissions blocked.
- Email approval and delivery status.
- Follow-up activity.
- Workflow execution failures.

## 4. Lead Lifecycle

Primary lead lifecycle (`inquiries.lead_status`, aligned with `LeadFlowAI.sql`):

`new → processing → qualified / needs_review / not_qualified → contacted → replied → closed / won`

Approval, follow-up, email delivery, and opt-out states are tracked separately from `lead_status`:

- **Approval state (`inquiries.approval_status`):** `not_required | pending | approved | rejected`
- **Follow-up state (`inquiries.followup_status`):** `not_eligible | scheduled | sent | stopped`
- **Email delivery state (`email_messages.status`):** `draft | pending_approval | approved | queued | sent | failed | cancelled`
- **Opt-out tracking (`inquiries.unsubscribed_at`):** Timestamp recorded separately from `lead_status`; when set, `followup_status` must transition to `stopped`.

> **Draft Email Convention:** `lead_analyses.draft_email` preserves the original AI-generated draft snapshot for auditability, whereas `email_messages` is the operational source of truth for review, editing, approval, and delivery.

## 5. Security Requirements

- Secure authentication between the backend and n8n webhook.
- API keys and service credentials must be stored securely.
- Supabase service role keys must never be exposed to the frontend.
- Dashboard access must use appropriate authentication and authorization.
- Sensitive credentials and personal data must not be unnecessarily exposed in execution logs.
