import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, sendError } from '../utils/apiResponse.js';

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, 404, 'NOT_FOUND', 'Route not found');
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.') || undefined,
      message: issue.message,
    }));
    const firstMessage = details[0]?.message ?? 'Validation failed';
    return sendError(res, 400, 'VALIDATION_ERROR', firstMessage, details);
  }

  if (
    err instanceof SyntaxError &&
    typeof (err as SyntaxError & { status?: number }).status === 'number' &&
    (err as SyntaxError & { status?: number }).status === 400
  ) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Malformed JSON request body');
  }

  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  const safeLogMessage = err instanceof Error ? err.message : 'Unknown error';
  console.error('[backend] Unhandled error:', safeLogMessage);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
}
