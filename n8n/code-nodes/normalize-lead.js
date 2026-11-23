/**
 * LeadFlow AI — Deterministic Lead Intake Normalization (WF01)
 *
 * Pure, testable normalization logic matching:
 * - database/schema/LeadFlowAI.sql
 * - docs/architecture/03-api-and-rls-contract.md
 *
 * Used directly in Node.js / Vitest tests and embedded in the WF01
 * "Normalize Lead Data" n8n Code node (JavaScript, Run Once for All Items).
 */

function generateRandomHex8() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(4);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.floor(Math.random() * 0x100000000)
    .toString(16)
    .padStart(8, '0');
}

function generateSubmissionId(nowMs = Date.now()) {
  const ts = nowMs.toString(36);
  const rand = generateRandomHex8();
  return `sub_${ts}_${rand}`;
}

function normalizeInlineText(value) {
  if (typeof value !== 'string') return null;
  const collapsed = value.trim().replace(/\s+/g, ' ');
  return collapsed.length > 0 ? collapsed : null;
}

function normalizeMultilineText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();
}

function normalizeBudgetAmount(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

function normalizeTimelineWeeks(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Math.trunc(value);
  return rounded > 0 ? rounded : null;
}

function normalizeBudgetCurrency(value) {
  if (typeof value !== 'string') return 'USD';
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : 'USD';
}

function normalizeLeadPayload(rawBody, options = {}) {
  const body =
    rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
      ? rawBody
      : {};
  const nowIso =
    typeof options.nowIso === 'string' && options.nowIso.trim().length > 0
      ? options.nowIso.trim()
      : new Date().toISOString();
  const nowMs =
    typeof options.nowMs === 'number' && Number.isFinite(options.nowMs)
      ? options.nowMs
      : Date.now();

  const existingSubmissionId = normalizeInlineText(body.submission_id);
  const submissionIdGenerated = existingSubmissionId === null;
  const submissionId = existingSubmissionId ?? generateSubmissionId(nowMs);

  const fullName = normalizeInlineText(body.full_name) ?? '';
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const companyName = normalizeInlineText(body.company_name);
  const phone = normalizeInlineText(body.phone);
  const serviceType = normalizeInlineText(body.service_type);

  const budgetMin = normalizeBudgetAmount(body.budget_min);
  const budgetMax = normalizeBudgetAmount(body.budget_max);
  const budgetCurrency = normalizeBudgetCurrency(body.budget_currency);
  const timelineWeeks = normalizeTimelineWeeks(body.timeline_weeks);
  const projectDescription = normalizeMultilineText(body.project_description);

  const consentToEmail = body.consent_to_email === true;
  const rawConsentTs = normalizeInlineText(body.consent_timestamp);
  const consentTimestamp = consentToEmail ? (rawConsentTs ?? nowIso) : null;
  const consentSource =
    normalizeInlineText(body.consent_source) ?? 'website_contact_form';

  return {
    submission_id: submissionId,
    submission_id_generated: submissionIdGenerated,
    full_name: fullName,
    email,
    company_name: companyName,
    phone,
    service_type: serviceType,
    budget_min: budgetMin,
    budget_max: budgetMax,
    budget_currency: budgetCurrency,
    timeline_weeks: timelineWeeks,
    project_description: projectDescription,
    consent_to_email: consentToEmail,
    consent_timestamp: consentTimestamp,
    consent_source: consentSource,
    // Initial 4-dimension DB defaults per database/schema/LeadFlowAI.sql
    lead_status: 'new',
    priority: 'low',
    approval_status: 'not_required',
    followup_status: 'not_eligible',
    received_at: nowIso,
  };
}

module.exports = {
  generateSubmissionId,
  normalizeLeadPayload,
};
