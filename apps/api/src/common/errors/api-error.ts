import type { Uuid } from '@types';

/**
 * Discriminated error envelope returned by the GlobalExceptionFilter.
 *
 * Application code MUST throw `ApiError` (or one of its subclasses) so
 * the response shape stays consistent.
 */
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown> | undefined;
  traceId?: string | undefined;
  /** Optional reference id (e.g. failed-job id) */
  refId?: Uuid | undefined;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly details?: Record<string, unknown> | undefined;
  public readonly refId?: Uuid | undefined;

  constructor(
    code: string,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
    refId?: Uuid,
  ) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
    this.refId = refId;
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = 'resource') {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict', details?: Record<string, unknown>) {
    super('CONFLICT', message, 409, details);
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message = 'Unprocessable entity', details?: Record<string, unknown>) {
    super('UNPROCESSABLE_ENTITY', message, 422, details);
  }
}

export class RateLimitedError extends ApiError {
  constructor(retryAfterSeconds: number) {
    super('RATE_LIMITED', 'Too many requests', 429, { retryAfterSeconds });
  }
}

export class RequestTimeoutException extends ApiError {
  constructor(message = 'Request timed out', details?: Record<string, unknown>) {
    super('TIMEOUT', message, 408, details);
  }
}

export class DatabaseUnavailableError extends ApiError {
  constructor(message = 'Database unavailable') {
    super('DATABASE_UNAVAILABLE', message, 503);
  }
}

export class UpstreamFailureError extends ApiError {
  constructor(upstream: string, message = 'Upstream service failed') {
    super(
      'UPSTREAM_FAILURE',
      `${message} (${upstream})`,
      502,
      undefined,
      undefined,
    );
  }
}

/**
 * Map an unknown throw value to a safe `{ success:false, error }` envelope.
 *
 * - `ApiError` subclasses are echoed verbatim (authored with intent).
 * - Plain `Error` instances are mapped to `INTERNAL_ERROR` with a
 *   generic message — the original message is **not** echoed to the
 *   client (it has already been logged server-side by the filter).
 * - Non-error throws return a generic payload; only primitive
 *   causes are preserved as `details.cause`.
 */
export function toApiErrorPayload(err: unknown, traceId?: string): ApiErrorPayload {
  if (err instanceof ApiError) {
    return {
      code: err.code,
      message: err.message,
      details: err.details,
      refId: err.refId,
      traceId,
    };
  }
  if (err instanceof Error) {
    return {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      traceId,
    };
  }
  const cause =
    err === null || err === undefined
      ? undefined
      : typeof err === 'string' ||
        typeof err === 'number' ||
        typeof err === 'boolean'
        ? { cause: String(err) }
        : undefined;
  return {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    details: cause,
    traceId,
  };
}
