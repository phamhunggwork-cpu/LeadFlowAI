import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const statelessClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

/**
 * Anon-key client used exclusively for verifying incoming Supabase Auth JWTs
 * via `supabaseAuthClient.auth.getUser(token)`.
 */
export const supabaseAuthClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  statelessClientOptions,
);

/**
 * Server-side service_role client used ONLY after JWT authentication and
 * input/state validation inside the backend API Gateway.
 * NEVER expose this client or key to frontend code or logs.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  statelessClientOptions,
);
