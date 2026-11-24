import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ApiRequestError, submitLead } from '@/services/api';
import {
  VELOCE_SERVICES,
  type LeadAcceptedData,
  type LeadSubmissionInput,
} from '@/types/lead';

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
    errors.budget_max =
      'Maximum budget must be greater than or equal to minimum budget.';
  }

  const timeline = parseOptionalNumber(form.timeline_weeks);
  if (timeline !== null && (!Number.isInteger(timeline) || timeline <= 0)) {
    errors.timeline_weeks =
      'Timeline must be a whole number of weeks (at least 1).';
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
  const [submittedResult, setSubmittedResult] =
    useState<LeadAcceptedData | null>(null);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
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
      toast.success('Project inquiry received', {
        description: `Reference ID: ${result.submission_id}`,
      });
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
        toast.error('Submission could not be accepted', {
          description: err.message,
        });
      } else {
        const msg = 'An unexpected error occurred. Please try again.';
        setBannerError(msg);
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <Card
        className="border-success-border"
        data-testid="lead-success-card"
      >
        <CardContent className="p-6 sm:p-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-success-border bg-success-soft text-success">
            <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Inquiry Received
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
            Thanks for reaching out to Veloce Digital. Your project brief has
            been queued for qualification and technical review — a senior team
            member approves every tailored response before anything is sent.
          </p>

          <dl className="mt-6 space-y-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs font-medium text-muted-foreground">
                Reference ID
              </dt>
              <dd
                className="truncate font-mono text-xs font-semibold text-primary"
                data-testid="submission-id-value"
              >
                {submittedResult.submission_id}
              </dd>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs font-medium text-muted-foreground">
                Status
              </dt>
              <dd>
                <Badge variant="success" className="capitalize">
                  {submittedResult.status}
                </Badge>
              </dd>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs font-medium text-muted-foreground">
                Received At
              </dt>
              <dd className="font-mono text-xs tabular-nums text-secondary-foreground">
                {new Date(submittedResult.received_at).toLocaleString()}
              </dd>
            </div>
          </dl>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="mt-6 w-full"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
            Submit another inquiry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const descriptionLength = form.project_description.trim().length;

  return (
    <Card>
      <CardHeader className="pb-4 sm:px-7 sm:pt-7">
        <CardTitle className="text-lg">Tell us about your project</CardTitle>
        <CardDescription>
          Fields marked with <span className="font-semibold text-primary">*</span>{' '}
          are required. Typical response within 1 business day.
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 sm:px-7 sm:pb-7">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {bannerError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-soft p-3.5 text-sm text-danger"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                strokeWidth={1.75}
              />
              <span>{bannerError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">
                Full Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                placeholder="Sarah Chen"
                value={form.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                aria-invalid={Boolean(fieldErrors.full_name)}
                className={fieldErrors.full_name ? 'border-destructive' : ''}
              />
              {fieldErrors.full_name && (
                <p className="text-xs text-danger">{fieldErrors.full_name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">
                Work Email <span className="text-primary">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="sarah@acmesaas.io"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                className={fieldErrors.email ? 'border-destructive' : ''}
              />
              {fieldErrors.email && (
                <p className="text-xs text-danger">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                type="text"
                autoComplete="organization"
                placeholder="Acme SaaS Inc."
                value={form.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone{' '}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1-415-555-0192"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service_type">Primary Service Needed</Label>
            <Select
              value={form.service_type || '__none__'}
              onValueChange={(value) =>
                updateField('service_type', value === '__none__' ? '' : value)
              }
            >
              <SelectTrigger id="service_type">
                <SelectValue placeholder="Select a service (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  Select a service (optional)
                </SelectItem>
                {VELOCE_SERVICES.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="budget_min">Budget Min (USD)</Label>
              <Input
                id="budget_min"
                name="budget_min"
                type="number"
                min={0}
                step={500}
                placeholder="5000"
                value={form.budget_min}
                onChange={(e) => updateField('budget_min', e.target.value)}
                className={`font-mono tabular-nums ${fieldErrors.budget_min ? 'border-destructive' : ''}`}
              />
              {fieldErrors.budget_min && (
                <p className="text-xs text-danger">{fieldErrors.budget_min}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget_max">Budget Max (USD)</Label>
              <Input
                id="budget_max"
                name="budget_max"
                type="number"
                min={0}
                step={500}
                placeholder="15000"
                value={form.budget_max}
                onChange={(e) => updateField('budget_max', e.target.value)}
                className={`font-mono tabular-nums ${fieldErrors.budget_max ? 'border-destructive' : ''}`}
              />
              {fieldErrors.budget_max && (
                <p className="text-xs text-danger">{fieldErrors.budget_max}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timeline_weeks">Timeline (Weeks)</Label>
              <Input
                id="timeline_weeks"
                name="timeline_weeks"
                type="number"
                min={1}
                step={1}
                placeholder="8"
                value={form.timeline_weeks}
                onChange={(e) => updateField('timeline_weeks', e.target.value)}
                className={`font-mono tabular-nums ${fieldErrors.timeline_weeks ? 'border-destructive' : ''}`}
              />
              {fieldErrors.timeline_weeks && (
                <p className="text-xs text-danger">
                  {fieldErrors.timeline_weeks}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="project_description">
                Project Goals &amp; Scope <span className="text-primary">*</span>
              </Label>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  descriptionLength >= 10
                    ? 'text-muted-foreground'
                    : 'text-warning'
                }`}
              >
                {descriptionLength} chars (min 10)
              </span>
            </div>
            <Textarea
              id="project_description"
              name="project_description"
              rows={4}
              placeholder="Share your core features, target launch window, existing designs/PRD, and any integrations (Stripe, HubSpot, APIs)..."
              value={form.project_description}
              onChange={(e) =>
                updateField('project_description', e.target.value)
              }
              aria-invalid={Boolean(fieldErrors.project_description)}
              className={
                fieldErrors.project_description ? 'border-destructive' : ''
              }
            />
            {fieldErrors.project_description && (
              <p className="text-xs text-danger">
                {fieldErrors.project_description}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-3.5 transition-colors hover:bg-muted/70">
            <input
              id="consent_to_email"
              name="consent_to_email"
              type="checkbox"
              checked={form.consent_to_email}
              onChange={(e) =>
                updateField('consent_to_email', e.target.checked)
              }
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs leading-relaxed text-secondary-foreground">
              I consent to Veloce Digital contacting me by email regarding this
              project inquiry and a single follow-up if we have not connected
              within 24 hours.
            </span>
          </label>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting inquiry...
              </>
            ) : (
              <>
                Submit Project Inquiry
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </>
            )}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.75} />
            Human-in-the-Loop review: every response is approved by a Veloce
            engineer before sending.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
