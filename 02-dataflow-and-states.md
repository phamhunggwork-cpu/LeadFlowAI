# Data Flow & Lead State Machine — LeadFlow AI

> Aligned with `LeadFlowAI.sql` (database schema & status enums) and `01-business-context.md` (business rules & 75/45 scoring thresholds).

## 1. System Architecture & Workflow Data Flow

```mermaid
flowchart TD
    %% Frontend & Backend
    subgraph Client ["Frontend & API Layer"]
        F1["React Website Form"]
        F2["React Review Dashboard"]
        API["Node.js API Gateway<br/>(Auth + Validation + Webhook Proxy)"]
    end

    %% Storage
    subgraph DB ["Supabase / PostgreSQL"]
        T1[("contacts & inquiries")]
        T2[("lead_analyses")]
        T3[("email_messages")]
        T4[("activity_logs")]
        T5[("workflow_errors")]
    end

    %% External Services
    subgraph Ext ["External Services"]
        LLM["OpenAI / Gemini API<br/>(Structured JSON)"]
        HS["HubSpot CRM"]
        SL["Slack Sales & Admin"]
        EM["Email Provider"]
    end

    %% WF01
    subgraph WF1 ["WF01: Lead Intake & Qualification"]
        W1_1["Webhook Trigger"]
        W1_2["Validate, Normalize &<br/>Check submission_id"]
        W1_3["AI Extraction & Draft"]
        W1_4["JS Scoring (0–100) & Routing"]
        W1_1 --> W1_2 --> W1_3 --> W1_4
    end

    %% WF02
    subgraph WF2 ["WF02: Human Approval & Email Sending"]
        W2_1["Approval Webhook"]
        W2_2["Verify Status &<br/>Idempotency Key"]
        W2_3{"Approved?"}
        W2_1 --> W2_2 --> W2_3
    end

    %% WF03
    subgraph WF3 ["WF03: Automated Follow-up"]
        W3_1["Schedule Trigger (24h+)"]
        W3_2["Query Eligible Leads<br/>(consent=true, unsubscribed_at IS NULL,<br/>no reply, not closed/won)"]
        W3_3["Send 1 Follow-up &<br/>Stop Sequence"]
        W3_1 --> W3_2 --> W3_3
    end

    %% WF04
    subgraph WF4 ["WF04: Error Handling & Logging"]
        W4_1["Error Trigger"]
        W4_2["Log Error & Alert Admin"]
        W4_1 --> W4_2
    end

    %% Connections
    F1 --> API --> W1_1
    W1_2 <--> T1
    W1_3 <--> LLM
    W1_4 --> T1
    W1_4 --> T2
    W1_4 --> T3
    W1_4 --> T4
    W1_4 --> HS
    W1_4 -->|"Qualified / Needs Review"| SL

    F2 <--> API
    API -->|"Approve / Reject"| W2_1
    W2_2 <--> T3
    W2_3 -->|"Yes"| EM
    W2_3 -->|"Yes / No"| T1
    W2_3 -->|"Yes / No"| T3
    W2_3 -->|"Yes / No"| T4

    W3_2 <--> T1
    W3_3 --> EM
    W3_3 --> T1
    W3_3 --> T3
    W3_3 --> T4

    WF1 -.->|"On Failure"| W4_1
    WF2 -.->|"On Failure"| W4_1
    WF3 -.->|"On Failure"| W4_1
    W4_2 --> T5
    W4_2 --> SL
```

## 2. Lead Lifecycle State Machine (`inquiries.lead_status`)

```mermaid
stateDiagram-v2
    [*] --> new : Form submitted (unique submission_id)
    new --> processing : WF01 starts AI & Scoring

    processing --> qualified : Score 75–100 & no deal-breaker
    processing --> needs_review : Score 45–74 or missing key info
    processing --> not_qualified : Score < 45, out-of-scope, or spam

    qualified --> contacted : Rep Approves & WF02 sends initial email
    needs_review --> contacted : Rep Approves & WF02 sends initial email

    qualified --> closed : Rep Rejects or drops lead
    needs_review --> closed : Rep Rejects
    not_qualified --> closed : Archived / No action needed

    contacted --> replied : Prospect replies (stops WF03 follow-up)
    contacted --> closed : No response after follow-up / Closed lost

    replied --> won : Deal closed-won (stops WF03)
    replied --> closed : Deal lost / Closed (stops WF03)

    won --> [*]
    closed --> [*]
```

### Parallel State Dimensions (per `LeadFlowAI.sql`)

- **`inquiries.approval_status`:** `not_required` → `pending` → `approved` | `rejected`
- **`inquiries.followup_status`:** `not_eligible` → `scheduled` → `sent` | `stopped`
- **`email_messages.status`:** `draft` → `pending_approval` → `approved` → `queued` → `sent` | `failed` | `cancelled`
- **`inquiries.unsubscribed_at`:** Tracked independently of `lead_status`. Setting `unsubscribed_at` immediately transitions `followup_status` to `stopped` and excludes the lead from WF03 without forcing `lead_status` to `closed`.
