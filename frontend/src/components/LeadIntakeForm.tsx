import { useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { ApiRequestError, submitLead } from '../services/api';
import {
  VELOCE_SERVICES,
  type LeadAcceptedData,
  type LeadSubmissionInput,
} from '../types/lead';

interface FormState {
  full_name: string;
  email: string;
  company_name: string;
  phone: string;
  service_type: string;
  budget_min: string;
  budget_max: string;
  timeline_weeks: string;
  project_description: string;
  consent_to_email: boolean;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

const INITIAL_FORM_STATE: FormState = {
  full_name: '',
  email: '',
  company_name: '',
  phone: '',
  service_type: '',
  budget_min: '',
  budget_max: '',
  timeline_weeks: '',
  project_description: '',
  consent_to_email: true,
};

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function validateClientForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.full_name.trim()) {
    errors.full_name = 'Please enter your full name.';
  }

  const email = form.email.trim();
  if (!email) {
    errors.email = 'Please enter your work email.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  const budgetMin = parseOptionalNumber(form.budget_min);
  const budgetMax = parseOptionalNumber(form.budget_max);

  if (budgetMin !== null && (Number.isNaN(budgetMin) || budgetMin < 0)) {
    errors.budget_min = 'Minimum budget must be 0 or higher.';
  }
  if (budgetMax !== null && (Number.isNaN(budgetMax) || budgetMax < 0)) {
    errors.budget_max = 'Maximum budget must be 0 or higher.';
  }
  if (
    budgetMin !== null &&
    budgetMax !== null &&
    !Number.isNaN(budgetMin) &&
    !Number.isNaN(budgetMax) &&
    budgetMax < budgetMin
  ) {
    errors.budget_max = 'Maximum budget must be greater than or equal to minimum budget.';
  }

  const timeline = parseOptionalNumber(form.timeline_weeks);
  if (timeline !== null && (!Number.isInteger(timeline) || timeline <= 0)) {
    errors.timeline_weeks = 'Timeline must be a whole number of weeks (at least 1).';
  }

  if (form.project_description.trim().length < 10) {
    errors.project_description =
      'Please describe your project in at least 10 characters so our team can review it.';
  }

  return errors;
}

export function LeadIntakeForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<LeadAcceptedData | null>(null);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (bannerError) {
      setBannerError(null);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM_STATE);
    setFieldErrors({});
    setBannerError(null);
    setSubmittedResult(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBannerError(null);

    const clientErrors = validateClientForm(form);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setBannerError('Please review the highlighted fields before submitting.');
      return;
    }

    const budgetMin = parseOptionalNumber(form.budget_min);
    const budgetMax = parseOptionalNumber(form.budget_max);
    const timelineWeeks = parseOptionalNumber(form.timeline_weeks);

    const payload: LeadSubmissionInput = {
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      company_name: form.company_name.trim() || null,
      phone: form.phone.trim() || null,
      service_type: form.service_type || null,
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget_currency: 'USD',
      timeline_weeks: timelineWeeks,
      project_description: form.project_description.trim(),
      consent_to_email: form.consent_to_email,
      consent_source: 'website_contact_form',
    };

    setIsSubmitting(true);
    try {
      const result = await submitLead(payload);
      setSubmittedResult(result);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        if (err.details.length > 0) {
          const mappedErrors: FieldErrors = {};
          for (const detail of err.details) {
            if (detail.field && detail.field in INITIAL_FORM_STATE) {
              mappedErrors[detail.field as keyof FormState] = detail.message;
            }
          }
          setFieldErrors(mappedErrors);
        }
        setBannerError(err.message);
      } else {
        setBannerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div
        className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/50"
        data-testid="lead-success-card"
      >
        <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Inquiry Received
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Thanks for reaching out to Veloce Digital. Your project brief has been queued for
          qualification and technical review—a senior team member will review the tailored
          response before anything is sent.
        </p>

        <dl className="mt-6 space-y-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-400">Reference ID</dt>
            <dd
              className="font-mono text-xs font-medium text-sky-300"
              data-testid="submission-id-value"
            >
              {submittedResult.submission_id}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-400">Status</dt>
            <dd className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium capitalize text-emerald-300">
              {submittedResult.status}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-slate-400">Received At</dt>
            <dd className="text-xs text-slate-300">
              {new Date(submittedResult.received_at).toLocaleString()}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={handleReset}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <RotateCcw className="h-4 w-4" />
          Submit another inquiry
        </button>
      </div>
    );
  }

  const descriptionLength = form.project_description.trim().length;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/60 sm:p-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Tell us about your project
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Fields marked with <span className="text-sky-400">*</span> are required.
        </p>
      </div>

      {bannerError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-sm text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <span>{bannerError}</span>
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-200">
              Full Name <span className="text-sky-400">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              placeholder="Sarah Chen"
              value={form.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                fieldErrors.full_name ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
            {fieldErrors.full_name && (
              <p className="mt-1 text-xs text-rose-400">{fieldErrors.full_name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-200">
              Work Email <span className="text-sky-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="sarah@acmesaas.io"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                fieldErrors.email ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-rose-400">{fieldErrors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="company_name"
              className="mb-1.5 block text-sm font-medium text-slate-200"
            >
              Company Name
            </label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              autoComplete="organization"
              placeholder="Acme SaaS Inc."
              value={form.company_name}
              onChange={(e) => updateField('company_name', e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-slate-200">
              Phone <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+1-415-555-0192"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="service_type"
            className="mb-1.5 block text-sm font-medium text-slate-200"
          >
            Primary Service Needed
          </label>
          <select
            id="service_type"
            name="service_type"
            value={form.service_type}
            onChange={(e) => updateField('service_type', e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
          >
            <option value="">Select a service (optional)</option>
            {VELOCE_SERVICES.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="budget_min" className="mb-1.5 block text-sm font-medium text-slate-200">
              Budget Min (USD)
            </label>
            <input
              id="budget_min"
              name="budget_min"
              type="number"
              min={0}
              step={500}
              placeholder="5000"
              value={form.budget_min}
              onChange={(e) => updateField('budget_min', e.target.value)}
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                fieldErrors.budget_min ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
            {fieldErrors.budget_min && (
              <p className="mt-1 text-xs text-rose-400">{fieldErrors.budget_min}</p>
            )}
          </div>

          <div>
            <label htmlFor="budget_max" className="mb-1.5 block text-sm font-medium text-slate-200">
              Budget Max (USD)
            </label>
            <input
              id="budget_max"
              name="budget_max"
              type="number"
              min={0}
              step={500}
              placeholder="15000"
              value={form.budget_max}
              onChange={(e) => updateField('budget_max', e.target.value)}
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                fieldErrors.budget_max ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
            {fieldErrors.budget_max && (
              <p className="mt-1 text-xs text-rose-400">{fieldErrors.budget_max}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="timeline_weeks"
              className="mb-1.5 block text-sm font-medium text-slate-200"
            >
              Timeline (Weeks)
            </label>
            <input
              id="timeline_weeks"
              name="timeline_weeks"
              type="number"
              min={1}
              step={1}
              placeholder="8"
              value={form.timeline_weeks}
              onChange={(e) => updateField('timeline_weeks', e.target.value)}
              className={`w-full rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                fieldErrors.timeline_weeks ? 'border-rose-500' : 'border-slate-700'
              }`}
            />
            {fieldErrors.timeline_weeks && (
              <p className="mt-1 text-xs text-rose-400">{fieldErrors.timeline_weeks}</p>
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="project_description"
              className="block text-sm font-medium text-slate-200"
            >
              Project Goals & Scope <span className="text-sky-400">*</span>
            </label>
            <span
              className={`text-xs ${
                descriptionLength >= 10 ? 'text-slate-400' : 'text-amber-400'
              }`}
            >
              {descriptionLength} chars (min 10)
            </span>
          </div>
          <textarea
            id="project_description"
            name="project_description"
            rows={4}
            placeholder="Share your core features, target launch window, existing designs/PRD, and any integrations (Stripe, HubSpot, APIs)..."
            value={form.project_description}
            onChange={(e) => updateField('project_description', e.target.value)}
            className={`w-full resize-y rounded-xl border bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
              fieldErrors.project_description ? 'border-rose-500' : 'border-slate-700'
            }`}
          />
          {fieldErrors.project_description && (
            <p className="mt-1 text-xs text-rose-400">{fieldErrors.project_description}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
          <input
            id="consent_to_email"
            name="consent_to_email"
            type="checkbox"
            checked={form.consent_to_email}
            onChange={(e) => updateField('consent_to_email', e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500"
          />
          <span className="text-xs leading-relaxed text-slate-300">
            I consent to Veloce Digital contacting me by email regarding this project inquiry and
            a single follow-up if we have not connected within 24 hours.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting inquiry...
            </>
          ) : (
            <>
              Submit Project Inquiry
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
          Human-in-the-Loop review: every response is approved by a Veloce engineer before sending.
        </p>
      </div>
    </form>
  );
}
