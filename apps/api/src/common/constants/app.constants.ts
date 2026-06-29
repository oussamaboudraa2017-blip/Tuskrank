/**
 * Single source of truth for application-level constants.
 * Anything environment-dependent must live in `src/config/`.
 */

export const APP_CONSTANTS = {
  /** Default API version used by NestJS URI versioning. */
  DEFAULT_API_VERSION: '1',
  /** Pagination defaults. */
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  /** Header names. */
  HEADERS: {
    REQUEST_ID: 'x-request-id',
    CORRELATION_ID: 'x-correlation-id',
    REQUEST_TOTAL_TIME_MS: 'x-request-time-ms',
  },
  /** Cache / throttle identifiers. */
  THROTTLE_NAMESPACE: 'tuskrank',
  /** Internal error codes — exposed by the global exception filter. */
  ERROR_CODES: {
    INTERNAL: 'INTERNAL_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    UNPROCESSABLE: 'UNPROCESSABLE_ENTITY',
    RATE_LIMITED: 'RATE_LIMITED',
    TIMEOUT: 'REQUEST_TIMEOUT',
    PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
    DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
    UPSTREAM_FAILURE: 'UPSTREAM_FAILURE',
  },
} as const;

export type AppConstants = typeof APP_CONSTANTS;
