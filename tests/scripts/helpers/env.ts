import path from 'node:path';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Load workspace root .env (never log secrets)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || /replace_with_|your-test-|your-dev-/i.test(value)) {
    throw new Error(`Missing or placeholder required env var: ${name}`);
  }
  return value;
}

export interface TestEnvConfig {
  apiBaseUrl: string;
  n8nWebhookBaseUrl: string;
  n8nWebhookSecret: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  testUserEmail: string;
  testUserPassword: string;
  pollTimeoutMs: number;
  pollIntervalMs: number;
  runPrefix: string;
}

export function loadTestEnv(): TestEnvConfig {
  const basePrefix = (process.env.TEST_RUN_PREFIX || 'vitest_leadflow_').trim();
  const runId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  return {
    apiBaseUrl: (process.env.TEST_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, ''),
    n8nWebhookBaseUrl: (process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678').replace(/\/+$/, ''),
    n8nWebhookSecret: requireEnv('N8N_WEBHOOK_SECRET'),
    supabaseUrl: requireEnv('TEST_SUPABASE_URL'),
    supabaseAnonKey: requireEnv('TEST_SUPABASE_ANON_KEY'),
    supabaseServiceRoleKey: requireEnv('TEST_SUPABASE_SERVICE_ROLE_KEY'),
    testUserEmail: requireEnv('TEST_USER_EMAIL'),
    testUserPassword: requireEnv('TEST_USER_PASSWORD'),
    pollTimeoutMs: Math.max(Number(process.env.TEST_POLL_TIMEOUT_MS || 30000), 25000),
    pollIntervalMs: Number(process.env.TEST_POLL_INTERVAL_MS || 1000),
    runPrefix: `${basePrefix}${runId}_`,
  };
}

export function createSupabaseAdmin(cfg: TestEnvConfig): SupabaseClient {
  return createClient(cfg.supabaseUrl, cfg.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createSupabaseAnon(cfg: TestEnvConfig): SupabaseClient {
  return createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signInTestReviewer(cfg: TestEnvConfig): Promise<{
  accessToken: string;
  userId: string;
}> {
  const client = createSupabaseAnon(cfg);
  const { data, error } = await client.auth.signInWithPassword({
    email: cfg.testUserEmail,
    password: cfg.testUserPassword,
  });
  if (error || !data.session?.access_token || !data.user?.id) {
    throw new Error(`Failed to authenticate test reviewer: ${error?.message ?? 'missing session'}`);
  }
  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
  };
}

export async function apiRequest<T = unknown>(
  baseUrl: string,
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {},
): Promise<{ status: number; json: T | null; raw: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const raw = await response.text();
  let json: T | null = null;
  try {
    json = raw ? (JSON.parse(raw) as T) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, raw };
}
