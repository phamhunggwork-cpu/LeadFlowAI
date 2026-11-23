import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const MAX_BUDGET_AMOUNT = 9_999_999_999.99;

const optionalTrimmedString = (maxLength = 255) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (typeof val !== 'string') return null;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine((val) => val === null || val.length <= maxLength, {
      message: `Must be at most ${maxLength} characters`,
    });

const optionalNonNegativeNumber = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((val) => (val === undefined ? null : val))
  .refine(
    (val) =>
      val === null ||
      (Number.isFinite(val) && val >= 0 && val <= MAX_BUDGET_AMOUNT),
    {
      message: `Must be a finite non-negative number up to ${MAX_BUDGET_AMOUNT}`,
    },
  );

const optionalPositiveInteger = z
  .union([z.number(), z.null(), z.undefined()])
  .transform((val) => (val === undefined ? null : val))
  .refine((val) => val === null || (Number.isInteger(val) && val > 0), {
    message: 'Must be a positive integer',
  });

const optionalIsoTimestamp = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (typeof val !== 'string') return null;
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  .pipe(
    z.union([
      z.null(),
      z
        .string()
        .datetime({ offset: true, message: 'consent_timestamp must be a valid ISO 8601 timestamp' }),
    ]),
  );

export const leadIntakeSchema = z
  .object({
    submission_id: optionalTrimmedString(120),
    full_name: z
      .string({
        required_error: 'full_name is required',
        invalid_type_error: 'full_name must be a string',
      })
      .trim()
      .min(1, 'full_name is required')
      .max(200, 'full_name must be at most 200 characters'),
    email: z
      .string({
        required_error: 'email is required',
        invalid_type_error: 'email must be a string',
      })
      .trim()
      .superRefine((val, ctx) => {
        if (val.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 1,
            type: 'string',
            inclusive: true,
            message: 'email is required',
          });
          return;
        }
        if (val.length > 254) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: 254,
            type: 'string',
            inclusive: true,
            message: 'email must be at most 254 characters',
          });
          return;
        }
        if (!z.string().email().safeParse(val).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_string,
            validation: 'email',
            message: 'Invalid email format',
          });
        }
      })
      .transform((val) => val.toLowerCase()),
    company_name: optionalTrimmedString(200),
    phone: optionalTrimmedString(50),
    service_type: optionalTrimmedString(150),
    budget_min: optionalNonNegativeNumber,
    budget_max: optionalNonNegativeNumber,
    budget_currency: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (typeof val !== 'string' || !val.trim()) return 'USD';
        return val.trim().toUpperCase();
      })
      .refine((val) => /^[A-Z]{3}$/.test(val), {
        message: 'budget_currency must be a 3-letter ISO currency code',
      }),
    timeline_weeks: optionalPositiveInteger,
    project_description: z
      .string({
        required_error: 'project_description is required',
        invalid_type_error: 'project_description must be a string',
      })
      .trim()
      .superRefine((val, ctx) => {
        if (val.length < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 1,
            type: 'string',
            inclusive: true,
            message: 'project_description is required',
          });
          return;
        }
        if (val.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 10,
            type: 'string',
            inclusive: true,
            message: 'project_description must be at least 10 characters',
          });
          return;
        }
        if (val.length > 5000) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_big,
            maximum: 5000,
            type: 'string',
            inclusive: true,
            message: 'project_description must be at most 5000 characters',
          });
        }
      }),
    consent_to_email: z.boolean().optional().default(false),
    consent_timestamp: optionalIsoTimestamp,
    consent_source: z
      .union([z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (typeof val !== 'string' || !val.trim()) return 'website_contact_form';
        return val.trim();
      })
      .refine((val) => val.length <= 100, {
        message: 'consent_source must be at most 100 characters',
      }),
  })
  .superRefine((data, ctx) => {
    if (
      data.budget_min !== null &&
      data.budget_max !== null &&
      data.budget_max < data.budget_min
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['budget_max'],
        message: 'budget_max must be greater than or equal to budget_min',
      });
    }
  });

export interface NormalizedLeadPayload {
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

function generateSubmissionId(): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(4).toString('hex');
  return `sub_${ts}_${rand}`;
}

export function parseLeadIntakePayload(input: unknown): NormalizedLeadPayload {
  const parsed = leadIntakeSchema.parse(input);
  const consentTimestamp = parsed.consent_to_email
    ? (parsed.consent_timestamp ?? new Date().toISOString())
    : null;

  return {
    submission_id: parsed.submission_id ?? generateSubmissionId(),
    full_name: parsed.full_name,
    email: parsed.email,
    company_name: parsed.company_name,
    phone: parsed.phone,
    service_type: parsed.service_type,
    budget_min: parsed.budget_min,
    budget_max: parsed.budget_max,
    budget_currency: parsed.budget_currency,
    timeline_weeks: parsed.timeline_weeks,
    project_description: parsed.project_description,
    consent_to_email: parsed.consent_to_email,
    consent_timestamp: consentTimestamp,
    consent_source: parsed.consent_source,
  };
}
