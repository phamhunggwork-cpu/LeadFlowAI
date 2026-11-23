/**
 * LeadFlow AI — Deterministic Lead Scoring & Routing Engine (WF01)
 *
 * Implements:
 * - docs/architecture/01-business-context.md (Section 3.1–3.3)
 * - docs/architecture/03-api-and-rls-contract.md (Section 5)
 * - docs/DECISIONS.md (ADR-002 operational email draft ownership, ADR-004 score_breakdown)
 *
 * Non-Negotiable Invariant #1:
 *   LLM performs semantic extraction ONLY. This pure deterministic JS module
 *   computes qualification_score (0–100), deal-breaker overrides, qualification_status,
 *   priority, approval_status, and followup_status.
 */

const OUT_OF_SCOPE_SERVICE = 'Out of Scope';

function scoreServiceFit(detectedService, scopeFit) {
  if (detectedService === OUT_OF_SCOPE_SERVICE) {
    return {
      points: 0,
      max: 30,
      reason: 'Service classified as Out of Scope (deal-breaker)',
    };
  }
  if (scopeFit === 'high') {
    return {
      points: 30,
      max: 30,
      reason: `High scope fit for ${detectedService}`,
    };
  }
  if (scopeFit === 'medium') {
    return {
      points: 18,
      max: 30,
      reason: `Medium scope fit for ${detectedService}`,
    };
  }
  return {
    points: 5,
    max: 30,
    reason: `Low scope fit for ${detectedService || 'unknown service'}`,
  };
}

function scoreBudgetFit(budgetMin, budgetMax) {
  const hasMin = typeof budgetMin === 'number' && Number.isFinite(budgetMin);
  const hasMax = typeof budgetMax === 'number' && Number.isFinite(budgetMax);
  const effectiveBudget = hasMax ? budgetMax : hasMin ? budgetMin : null;

  if (effectiveBudget === null) {
    return {
      points: 10,
      max: 30,
      effective_budget: null,
      undisclosed: true,
      borderline: false,
      below_floor: false,
      reason: 'Budget undisclosed (requires manual review)',
    };
  }

  if (effectiveBudget < 1500) {
    return {
      points: 0,
      max: 30,
      effective_budget: effectiveBudget,
      undisclosed: false,
      borderline: false,
      below_floor: true,
      reason: `Effective budget ($${effectiveBudget}) is below $1,500 minimum (deal-breaker)`,
    };
  }

  if (effectiveBudget < 3000) {
    return {
      points: 10,
      max: 30,
      effective_budget: effectiveBudget,
      undisclosed: false,
      borderline: true,
      below_floor: false,
      reason: `Effective budget ($${effectiveBudget}) is in borderline $1,500-$2,999 band (capped at needs_review)`,
    };
  }

  if (effectiveBudget < 5000) {
    return {
      points: 20,
      max: 30,
      effective_budget: effectiveBudget,
      undisclosed: false,
      borderline: false,
      below_floor: false,
      reason: `Effective budget ($${effectiveBudget}) meets $3,000-$4,999 floor`,
    };
  }

  if (effectiveBudget <= 25000) {
    return {
      points: 30,
      max: 30,
      effective_budget: effectiveBudget,
      undisclosed: false,
      borderline: false,
      below_floor: false,
      reason: `Effective budget ($${effectiveBudget}) is within preferred $5,000-$25,000 sweet spot`,
    };
  }

  return {
    points: 26,
    max: 30,
    effective_budget: effectiveBudget,
    undisclosed: false,
    borderline: false,
    below_floor: false,
    reason: `Effective budget ($${effectiveBudget}) exceeds $25,000 (verify delivery capacity)`,
  };
}

function scoreTimelineFit(timelineWeeks) {
  if (typeof timelineWeeks !== 'number' || !Number.isFinite(timelineWeeks)) {
    return {
      points: 8,
      max: 20,
      timeline_weeks: null,
      reason: 'Timeline unspecified',
    };
  }

  if (timelineWeeks >= 4 && timelineWeeks <= 16) {
    return {
      points: 20,
      max: 20,
      timeline_weeks: timelineWeeks,
      reason: `Realistic timeline (${timelineWeeks} weeks, target 4-16 weeks)`,
    };
  }

  if (
    (timelineWeeks >= 2 && timelineWeeks <= 3) ||
    (timelineWeeks >= 17 && timelineWeeks <= 24)
  ) {
    return {
      points: 12,
      max: 20,
      timeline_weeks: timelineWeeks,
      reason: `Tight or extended timeline (${timelineWeeks} weeks)`,
    };
  }

  return {
    points: 5,
    max: 20,
    timeline_weeks: timelineWeeks,
    reason: `Aggressive (<2w) or very long (>24w) timeline (${timelineWeeks} weeks)`,
  };
}

function scoreProjectClarity(clarityScoreBand) {
  if (clarityScoreBand === 'high') {
    return {
      points: 20,
      max: 20,
      clarity_score_band: 'high',
      reason: 'High project clarity with concrete requirements',
    };
  }
  if (clarityScoreBand === 'medium') {
    return {
      points: 12,
      max: 20,
      clarity_score_band: 'medium',
      reason: 'Moderate project clarity with some scope gaps',
    };
  }
  return {
    points: 5,
    max: 20,
    clarity_score_band: 'low',
    reason: 'Low project clarity or insufficient detail',
  };
}

function scoreLead(normalizedLead, aiAnalysis) {
  const lead = normalizedLead && typeof normalizedLead === 'object' ? normalizedLead : {};
  const analysis = aiAnalysis && typeof aiAnalysis === 'object' ? aiAnalysis : {};

  const detectedService =
    typeof analysis.detected_service === 'string'
      ? analysis.detected_service.trim()
      : '';
  const scopeFit =
    typeof analysis.scope_fit === 'string'
      ? analysis.scope_fit.trim().toLowerCase()
      : 'low';
  const clarityBand =
    typeof analysis.clarity_score_band === 'string'
      ? analysis.clarity_score_band.trim().toLowerCase()
      : 'low';
  const spamSuspected = analysis.spam_suspected === true;
  const missingInfo = Array.isArray(analysis.missing_information)
    ? analysis.missing_information
    : [];

  const service = scoreServiceFit(detectedService, scopeFit);
  const budget = scoreBudgetFit(lead.budget_min, lead.budget_max);
  const timeline = scoreTimelineFit(lead.timeline_weeks);
  const clarity = scoreProjectClarity(clarityBand);

  const rawScore = Math.max(
    0,
    Math.min(100, service.points + budget.points + timeline.points + clarity.points),
  );

  // Deal-breaker checks (override score -> force not_qualified)
  const dealBreakers = [];
  if (spamSuspected) {
    dealBreakers.push('spam_suspected');
  }
  if (detectedService === OUT_OF_SCOPE_SERVICE) {
    dealBreakers.push('out_of_scope_service');
  }
  if (budget.below_floor) {
    dealBreakers.push('budget_below_1500');
  }

  const overrides = [];
  let qualificationStatus;
  let priority;
  let approvalStatus;
  const followupStatus = 'not_eligible';

  if (dealBreakers.length > 0) {
    qualificationStatus = 'not_qualified';
    priority = 'low';
    approvalStatus = 'not_required';
    overrides.push(`deal_breaker_override:${dealBreakers.join(',')}`);
  } else {
    // Base threshold classification
    if (rawScore >= 75) {
      qualificationStatus = 'qualified';
      priority = 'high';
      approvalStatus = 'pending';
    } else if (rawScore >= 45) {
      qualificationStatus = 'needs_review';
      priority = 'medium';
      approvalStatus = 'pending';
    } else {
      qualificationStatus = 'not_qualified';
      priority = 'low';
      approvalStatus = 'not_required';
    }

    // Missing-info floor: never auto-reject, never auto-qualify
    if (budget.undisclosed || missingInfo.length >= 2) {
      if (qualificationStatus !== 'needs_review') {
        overrides.push(
          budget.undisclosed
            ? 'undisclosed_budget_requires_review'
            : 'missing_info_floor_requires_review',
        );
      }
      qualificationStatus = 'needs_review';
      priority = 'medium';
      approvalStatus = 'pending';
    } else if (budget.borderline && qualificationStatus === 'qualified') {
      // Per 01-business-context.md Section 3.1: $1,500-$2,999 requires Needs Review
      overrides.push('borderline_budget_capped_at_needs_review');
      qualificationStatus = 'needs_review';
      priority = 'medium';
      approvalStatus = 'pending';
    }
  }

  const finalScore = dealBreakers.length > 0 ? Math.min(rawScore, 44) : rawScore;
  const needsEmailDraft =
    qualificationStatus === 'qualified' || qualificationStatus === 'needs_review';

  const scoreBreakdown = {
    service_fit: {
      points: service.points,
      max: service.max,
      reason: service.reason,
    },
    budget_fit: {
      points: budget.points,
      max: budget.max,
      effective_budget: budget.effective_budget,
      reason: budget.reason,
    },
    timeline_fit: {
      points: timeline.points,
      max: timeline.max,
      timeline_weeks: timeline.timeline_weeks,
      reason: timeline.reason,
    },
    project_clarity: {
      points: clarity.points,
      max: clarity.max,
      clarity_score_band: clarity.clarity_score_band,
      reason: clarity.reason,
    },
    raw_score: rawScore,
    final_score: finalScore,
    deal_breakers: dealBreakers,
    overrides,
    missing_information_count: missingInfo.length,
  };

  return {
    qualification_score: finalScore,
    qualification_status: qualificationStatus,
    lead_status: qualificationStatus,
    priority,
    approval_status: approvalStatus,
    followup_status: followupStatus,
    needs_email_draft: needsEmailDraft,
    score_breakdown: scoreBreakdown,
  };
}

module.exports = {
  scoreLead,
  scoreServiceFit,
  scoreBudgetFit,
  scoreTimelineFit,
  scoreProjectClarity,
};
