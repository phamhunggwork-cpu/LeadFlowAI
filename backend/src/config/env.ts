import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend/.env regardless of the working directory used to invoke Node
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  N8N_WEBHOOK_BASE_URL: z
    .string()
    .trim()
    .url('N8N_WEBHOOK_BASE_URL must be a valid URL')
    .transform((val) => val.replace(/\/+$/, '')),
  N8N_WEBHOOK_SECRET: z
    .string()
    .trim()
    .min(8, 'N8N_WEBHOOK_SECRET must be at least 8 characters')
    .refine(
      (val) => !val.startsWith('replace_with_'),
      'N8N_WEBHOOK_SECRET must not be a placeholder value',
    ),
  N8N_WF01_PATH: z
    .string()
    .trim()
    .default('/webhook/lead-intake')
    .transform((val) => (val.startsWith('/') ? val : `/${val}`)),
  N8N_WF02_PATH: z
    .string()
    .trim()
    .default('/webhook/lead-approval')
    .transform((val) => (val.startsWith('/') ? val : `/${val}`)),
  N8N_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60000).default(10000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`[env] Invalid backend environment configuration: ${issues}`);
}

export const env = parsed.data;
