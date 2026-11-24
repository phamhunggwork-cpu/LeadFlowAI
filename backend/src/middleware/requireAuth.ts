import type { NextFunction, Request, Response } from 'express';
import { supabaseAuthClient } from '../services/supabase.service.js';
import { AppError } from '../utils/apiResponse.js';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

/**
 * Verifies a Supabase Auth JWT server-side via `supabase.auth.getUser(token)`.
 * Never trusts unverified JWT payloads or user_metadata for authorization.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing Bearer authentication token');
    }

    const { data, error } = await supabaseAuthClient.auth.getUser(token);

    if (error || !data.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token');
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? null,
    };

    next();
  } catch (err: unknown) {
    next(err);
  }
}
