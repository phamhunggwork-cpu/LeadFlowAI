import fs from 'node:fs';
import path from 'node:path';

export interface MockLeadPayload {
  submission_id: string;
  full_name: string;
  email: string;
  company_name: string | null;
  phone: string | null;
  service_type: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  timeline_weeks: number | null;
  project_description: string;
  consent_to_email: boolean;
  consent_timestamp: string | null;
  consent_source: string;
}

export interface MockLeadCase {
  id: string;
  case_name: string;
  expected_outcome: Record<string, unknown>;
  payload: MockLeadPayload;
}

const MOCK_LEADS_PATH = path.resolve(process.cwd(), 'test-data', 'mock-leads.json');
const ALL_CASES: MockLeadCase[] = JSON.parse(fs.readFileSync(MOCK_LEADS_PATH, 'utf8'));

export function getMockLead(tcId: string): MockLeadCase {
  const found = ALL_CASES.find((c) => c.id === tcId);
  if (!found) {
    throw new Error(`Mock lead case "${tcId}" not found in test-data/mock-leads.json`);
  }
  return structuredClone(found);
}

/**
 * Returns a run-isolated copy of a canonical mock lead payload using safe Resend test
 * sink addresses (`delivered+<runPrefix><slug>@resend.dev`) and unique `submission_id`.
 */
export function buildScopedLeadPayload(
  tcId: string,
  runPrefix: string,
  overrides: Partial<MockLeadPayload> & { emailSlug?: string; preserveInvalidEmail?: boolean } = {},
): MockLeadPayload {
  const { emailSlug, preserveInvalidEmail, ...fieldOverrides } = overrides;
  const base = getMockLead(tcId).payload;
  const slug = (emailSlug ?? tcId).toLowerCase().replace(/[^a-z0-9_-]/g, '');

  return {
    ...base,
    submission_id: `${runPrefix}${tcId.toLowerCase()}`,
    email: preserveInvalidEmail ? base.email : `delivered+${runPrefix}${slug}@resend.dev`,
    consent_timestamp: base.consent_to_email ? new Date().toISOString() : null,
    ...fieldOverrides,
  };
}
