/**
 * LeadFlow AI — Deterministic AI Qualification Output Schema Gate (WF01)
 *
 * Enforces docs/architecture/03-api-and-rls-contract.md Section 4 & ADR-007:
 * - Validates strict JSON structure, required 8 keys, types, and exact enums.
 * - Rejects forbidden LLM-generated scoring keys (`qualification_score`,
 *   `qualification_status`, `priority`) per Non-Negotiable Invariant #1.
 * - Never fabricates missing fields; malformed outputs return `{ valid: false }`
 *   so WF01 logs to `workflow_errors` and skips writing to `lead_analyses`.
 */

const PROMPT_VERSION = 'v1.0.0';
const MODEL_NAME = 'deepseek-chat';

const ALLOWED_SERVICES = [
  'Custom Web Applications & SaaS MVPs',
  'B2B Marketing & Corporate Websites',
  'Web App Redesign & Performance Optimization',
  'Third-party API & Database Integrations',
  'Out of Scope',
];

const ALLOWED_BANDS = ['high', 'medium', 'low'];

const FORBIDDEN_KEYS = [
  'qualification_score',
  'qualification_status',
  'priority',
];

function stripMarkdownCodeFence(text) {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function validateAiQualificationOutput(rawOutput, options = {}) {
  const modelName =
    typeof options.modelName === 'string' && options.modelName.trim()
      ? options.modelName.trim()
      : MODEL_NAME;
  const promptVersion =
    typeof options.promptVersion === 'string' && options.promptVersion.trim()
      ? options.promptVersion.trim()
      : PROMPT_VERSION;

  let parsed = null;
  let rawPreview = '';

  if (typeof rawOutput === 'string') {
    rawPreview = rawOutput.slice(0, 300);
    const cleaned = stripMarkdownCodeFence(rawOutput);
    if (!cleaned) {
      return {
        valid: false,
        model_name: modelName,
        prompt_version: promptVersion,
        error_code: 'MALFORMED_AI_JSON',
        error_message: 'AI response text is empty',
        errors: ['AI response text is empty'],
        raw_preview: rawPreview,
      };
    }
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        valid: false,
        model_name: modelName,
        prompt_version: promptVersion,
        error_code: 'MALFORMED_AI_JSON',
        error_message:
          'Failed to parse AI JSON response: ' +
          (err && err.message ? err.message : 'SyntaxError'),
        errors: ['Invalid JSON syntax from LLM'],
        raw_preview: rawPreview,
      };
    }
  } else if (rawOutput && typeof rawOutput === 'object' && !Array.isArray(rawOutput)) {
    parsed = rawOutput;
    rawPreview = JSON.stringify(rawOutput).slice(0, 300);
  } else {
    return {
      valid: false,
      model_name: modelName,
      prompt_version: promptVersion,
      error_code: 'MALFORMED_AI_JSON',
      error_message: 'AI response must be a JSON string or object',
      errors: ['AI response must be a JSON string or object'],
      raw_preview: String(rawOutput ?? '').slice(0, 300),
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      model_name: modelName,
      prompt_version: promptVersion,
      error_code: 'MALFORMED_AI_JSON',
      error_message: 'Parsed AI output must be a plain JSON object',
      errors: ['Parsed AI output must be a plain JSON object'],
      raw_preview: rawPreview,
    };
  }

  const errors = [];

  // Invariant #1: LLM must NEVER compute or emit scoring/routing fields
  for (const forbidden of FORBIDDEN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(parsed, forbidden)) {
      errors.push(`Forbidden LLM scoring key present: ${forbidden}`);
    }
  }

  // 1. detected_service
  const detectedService =
    typeof parsed.detected_service === 'string'
      ? parsed.detected_service.trim()
      : '';
  if (!ALLOWED_SERVICES.includes(detectedService)) {
    errors.push(
      `detected_service must be one of the 5 allowed categories (got "${String(parsed.detected_service ?? '')}")`,
    );
  }

  // 2. project_summary
  const projectSummary =
    typeof parsed.project_summary === 'string'
      ? parsed.project_summary.trim()
      : '';
  if (projectSummary.length < 10 || projectSummary.length > 1200) {
    errors.push('project_summary must be a string between 10 and 1200 characters');
  }

  // 3. missing_information
  let missingInformation = [];
  if (!Array.isArray(parsed.missing_information)) {
    errors.push('missing_information must be an array of strings');
  } else if (parsed.missing_information.length > 15) {
    errors.push('missing_information must contain at most 15 items');
  } else {
    for (let i = 0; i < parsed.missing_information.length; i++) {
      const entry = parsed.missing_information[i];
      if (typeof entry !== 'string' || !entry.trim()) {
        errors.push(`missing_information[${i}] must be a non-empty string`);
      } else {
        missingInformation.push(entry.trim().slice(0, 200));
      }
    }
  }

  // 4. scope_fit
  const scopeFit =
    typeof parsed.scope_fit === 'string'
      ? parsed.scope_fit.trim().toLowerCase()
      : '';
  if (!ALLOWED_BANDS.includes(scopeFit)) {
    errors.push(
      `scope_fit must be high, medium, or low (got "${String(parsed.scope_fit ?? '')}")`,
    );
  }

  // 5. spam_suspected
  if (typeof parsed.spam_suspected !== 'boolean') {
    errors.push('spam_suspected must be a boolean');
  }

  // 6. clarity_score_band
  const clarityScoreBand =
    typeof parsed.clarity_score_band === 'string'
      ? parsed.clarity_score_band.trim().toLowerCase()
      : '';
  if (!ALLOWED_BANDS.includes(clarityScoreBand)) {
    errors.push(
      `clarity_score_band must be high, medium, or low (got "${String(parsed.clarity_score_band ?? '')}")`,
    );
  }

  // 7. draft_email_subject
  const draftEmailSubject =
    typeof parsed.draft_email_subject === 'string'
      ? parsed.draft_email_subject.trim()
      : '';
  if (draftEmailSubject.length < 3 || draftEmailSubject.length > 200) {
    errors.push('draft_email_subject must be a string between 3 and 200 characters');
  }

  // 8. draft_email_body
  const draftEmailBody =
    typeof parsed.draft_email_body === 'string'
      ? parsed.draft_email_body.trim()
      : '';
  if (draftEmailBody.length < 20 || draftEmailBody.length > 5000) {
    errors.push('draft_email_body must be a string between 20 and 5000 characters');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      model_name: modelName,
      prompt_version: promptVersion,
      error_code: 'AI_SCHEMA_VALIDATION_ERROR',
      error_message: errors.join('; '),
      errors,
      raw_preview: rawPreview,
    };
  }

  const formattedDraftSnapshot = `Subject: ${draftEmailSubject}\n\n${draftEmailBody}`;

  return {
    valid: true,
    model_name: modelName,
    prompt_version: promptVersion,
    analysis: {
      detected_service: detectedService,
      project_summary: projectSummary,
      missing_information: missingInformation,
      scope_fit: scopeFit,
      spam_suspected: parsed.spam_suspected,
      clarity_score_band: clarityScoreBand,
      draft_email_subject: draftEmailSubject,
      draft_email_body: draftEmailBody,
      draft_email_snapshot: formattedDraftSnapshot,
    },
  };
}

module.exports = {
  PROMPT_VERSION,
  MODEL_NAME,
  ALLOWED_SERVICES,
  ALLOWED_BANDS,
  FORBIDDEN_KEYS,
  validateAiQualificationOutput,
};
