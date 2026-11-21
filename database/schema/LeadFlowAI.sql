
-- ==========================================
-- LEADFLOW AI - INITIAL DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ==========================================

-- 1. CONTACTS
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    hubspot_contact_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Normalize email uniqueness at database level
CREATE UNIQUE INDEX contacts_email_unique
ON public.contacts (LOWER(TRIM(email)));

-- 2. INQUIRIES
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contact_id UUID NOT NULL
        REFERENCES public.contacts(id)
        ON DELETE RESTRICT,

    submission_id TEXT NOT NULL UNIQUE,

    service_type TEXT,
    budget_min NUMERIC(12,2),
    budget_max NUMERIC(12,2),
    budget_currency TEXT NOT NULL DEFAULT 'USD',
    timeline_weeks INTEGER,
    project_description TEXT NOT NULL,

    consent_to_email BOOLEAN NOT NULL DEFAULT FALSE,
    consent_timestamp TIMESTAMPTZ,
    consent_source TEXT,
    unsubscribed_at TIMESTAMPTZ,

    lead_status TEXT NOT NULL DEFAULT 'new'
        CHECK (lead_status IN (
            'new',
            'processing',
            'qualified',
            'needs_review',
            'not_qualified',
            'contacted',
            'replied',
            'closed',
            'won'
        )),

    priority TEXT NOT NULL DEFAULT 'low'
        CHECK (priority IN ('low', 'medium', 'high')),

    approval_status TEXT NOT NULL DEFAULT 'not_required'
        CHECK (approval_status IN (
            'not_required',
            'pending',
            'approved',
            'rejected'
        )),

    followup_status TEXT NOT NULL DEFAULT 'not_eligible'
        CHECK (followup_status IN (
            'not_eligible',
            'scheduled',
            'sent',
            'stopped'
        )),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (
        budget_min IS NULL OR budget_min >= 0
    ),
    CHECK (
        budget_max IS NULL OR budget_max >= 0
    ),
    CHECK (
        budget_min IS NULL
        OR budget_max IS NULL
        OR budget_max >= budget_min
    ),
    CHECK (
        timeline_weeks IS NULL OR timeline_weeks > 0
    )
);

CREATE INDEX inquiries_contact_id_idx
ON public.inquiries(contact_id);

CREATE INDEX inquiries_status_idx
ON public.inquiries(lead_status);

CREATE INDEX inquiries_created_at_idx
ON public.inquiries(created_at DESC);

-- 3. LEAD ANALYSES
CREATE TABLE public.lead_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    inquiry_id UUID NOT NULL
        REFERENCES public.inquiries(id)
        ON DELETE RESTRICT,

    model_name TEXT,
    prompt_version TEXT,

    detected_service TEXT,
    project_summary TEXT,
    missing_information JSONB NOT NULL DEFAULT '[]'::JSONB,

    scope_fit TEXT
        CHECK (scope_fit IN ('high', 'medium', 'low')),

    spam_suspected BOOLEAN NOT NULL DEFAULT FALSE,

    qualification_score INTEGER
        CHECK (
            qualification_score IS NULL
            OR qualification_score BETWEEN 0 AND 100
        ),

    qualification_status TEXT
        CHECK (qualification_status IN (
            'qualified',
            'needs_review',
            'not_qualified'
        )),

    priority TEXT
        CHECK (priority IN ('low', 'medium', 'high')),

    draft_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX lead_analyses_inquiry_id_idx
ON public.lead_analyses(inquiry_id, created_at DESC);

-- 4. EMAIL MESSAGES
CREATE TABLE public.email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    inquiry_id UUID NOT NULL
        REFERENCES public.inquiries(id)
        ON DELETE RESTRICT,

    message_type TEXT NOT NULL
        CHECK (message_type IN ('initial', 'follow_up', 'reply', 'other')),

    direction TEXT NOT NULL
        CHECK (direction IN ('outbound', 'inbound')),

    recipient_email TEXT NOT NULL,
    subject TEXT,
    body TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft',
            'pending_approval',
            'approved',
            'queued',
            'sent',
            'failed',
            'cancelled'
        )),

    idempotency_key TEXT NOT NULL UNIQUE,
    provider_message_id TEXT UNIQUE,

    approved_by UUID,
    approved_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX email_messages_inquiry_id_idx
ON public.email_messages(inquiry_id);

-- 5. ACTIVITY LOGS
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    inquiry_id UUID
        REFERENCES public.inquiries(id)
        ON DELETE RESTRICT,

    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_logs_inquiry_id_idx
ON public.activity_logs(inquiry_id, created_at DESC);

-- 6. WORKFLOW ERRORS
CREATE TABLE public.workflow_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    inquiry_id UUID
        REFERENCES public.inquiries(id)
        ON DELETE RESTRICT,

    submission_id TEXT,
    workflow_name TEXT NOT NULL,
    execution_id TEXT,
    node_name TEXT,
    error_message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX workflow_errors_status_idx
ON public.workflow_errors(status);

CREATE INDEX workflow_errors_created_at_idx
ON public.workflow_errors(created_at DESC);
