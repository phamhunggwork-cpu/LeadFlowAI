import type { Response } from 'express';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: ApiErrorDetail[];

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: ApiErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendSuccess<T>(res: Response, statusCode: number, data: T): Response {
  return res.status(statusCode).json({
    ok: true,
    data,
    error: null,
  });
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ApiErrorCode,
  message: string,
  details?: ApiErrorDetail[],
): Response {
  return res.status(statusCode).json({
    ok: false,
    data: null,
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  });
}
