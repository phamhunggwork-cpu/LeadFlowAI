-- ==========================================
-- LEADFLOW AI - MIGRATION 002
-- Scoring Breakdown Column, FK Index & updated_at Triggers
-- Reference: docs/DECISIONS.md (ADR-004)
-- Idempotent & safe to re-run on dev and test Supabase projects
-- ==========================================

-- 1. Persist deterministic scoring rationale & breakdown (Day 6 requirement)
ALTER TABLE public.lead_analyses
    ADD COLUMN IF NOT EXISTS score_breakdown JSONB NOT NULL DEFAULT '{}'::JSONB;

-- 2. Index nullable foreign key on workflow_errors (Postgres FK index best practice)
CREATE INDEX IF NOT EXISTS workflow_errors_inquiry_id_idx
    ON public.workflow_errors(inquiry_id)
    WHERE inquiry_id IS NOT NULL;

-- 3. Automatic updated_at trigger function (hardened search_path per Supabase Advisor)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contacts_set_updated_at ON public.contacts;
CREATE TRIGGER contacts_set_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS inquiries_set_updated_at ON public.inquiries;
CREATE TRIGGER inquiries_set_updated_at
    BEFORE UPDATE ON public.inquiries
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
