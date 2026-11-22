-- ==========================================
-- LEADFLOW AI - RLS POLICIES & LEAST-PRIVILEGE GRANTS
-- Reference: docs/architecture/03-api-and-rls-contract.md
-- Idempotent & safe to run on both DEV and TEST Supabase projects
-- ==========================================

-- 1. Revoke all direct table privileges from PUBLIC, anon, and authenticated first (least-privilege baseline)
-- Public website inquiries MUST go through Express POST /api/leads.
REVOKE ALL ON TABLE
    public.contacts,
    public.inquiries,
    public.lead_analyses,
    public.email_messages,
    public.activity_logs,
    public.workflow_errors
FROM PUBLIC, anon, authenticated;

-- 2. Grant schema usage and minimal table privileges
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Authenticated sales rep dashboard users: read-only direct access (writes go through verified Backend JWT)
GRANT SELECT ON TABLE
    public.contacts,
    public.inquiries,
    public.lead_analyses,
    public.email_messages,
    public.activity_logs,
    public.workflow_errors
TO authenticated;

-- Server-side Backend, n8n workflows, and Vitest test teardown: explicit DML privileges only
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.contacts,
    public.inquiries,
    public.lead_analyses,
    public.email_messages,
    public.activity_logs,
    public.workflow_errors
TO service_role;

-- 3. Enable Row Level Security on all 6 tables
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_errors ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for authenticated dashboard users (single-tenant internal Veloce Digital team;
-- uses TO authenticated + initPlan-cached auth.uid() check instead of deprecated auth.role())
DROP POLICY IF EXISTS contacts_authenticated_select ON public.contacts;
CREATE POLICY contacts_authenticated_select ON public.contacts
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS inquiries_authenticated_select ON public.inquiries;
CREATE POLICY inquiries_authenticated_select ON public.inquiries
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS lead_analyses_authenticated_select ON public.lead_analyses;
CREATE POLICY lead_analyses_authenticated_select ON public.lead_analyses
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS email_messages_authenticated_select ON public.email_messages;
CREATE POLICY email_messages_authenticated_select ON public.email_messages
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS activity_logs_authenticated_select ON public.activity_logs;
CREATE POLICY activity_logs_authenticated_select ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS workflow_errors_authenticated_select ON public.workflow_errors;
CREATE POLICY workflow_errors_authenticated_select ON public.workflow_errors
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);
