import { ApiError } from '@common/errors/api-error';

/**
 * Brand-specific error codes.
 */
export const BRAND_ERROR_CODES = {
  NOT_FOUND: 'BRAND_NOT_FOUND',
  SLUG_COLLISION: 'BRAND_SLUG_COLLISION',
  BRAND_SOFT_DELETED: 'BRAND_SOFT_DELETED',
  BRAND_INACTIVE: 'BRAND_INACTIVE',
  INVALID_LIFECYCLE_TRANSITION: 'BRAND_INVALID_LIFECYCLE_TRANSITION',
  HAS_PRODUCTS: 'BRAND_HAS_PRODUCTS',
} as const;

export type BrandErrorCode = (typeof BRAND_ERROR_CODES)[keyof typeof BRAND_ERROR_CODES];

/* ------------------------------------------------------------------
 * Base
 * ------------------------------------------------------------------ */

export class BrandError extends ApiError {
  constructor(code: string, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(code, message, httpStatus, details);
  }
}

/* ------------------------------------------------------------------
 * Read
 * ------------------------------------------------------------------ */

export class BrandNotFoundError extends BrandError {
  constructor(slugOrId: string) {
    super(BRAND_ERROR_CODES.NOT_FOUND, `brand '${slugOrId}' not found`, 404);
  }
}

export class BrandSoftDeletedError extends BrandError {
  constructor(slugOrId: string) {
    super(BRAND_ERROR_CODES.BRAND_SOFT_DELETED, `brand '${slugOrId}' is soft-deleted`, 410);
  }
}

export class BrandInactiveError extends BrandError {
  constructor(slugOrId: string) {
    super(BRAND_ERROR_CODES.BRAND_INACTIVE, `brand '${slugOrId}' is inactive`, 403);
  }
}

/* ------------------------------------------------------------------
 * Conflict
 * ------------------------------------------------------------------ */

export class BrandSlugCollisionError extends BrandError {
  constructor(slug: string) {
    super(BRAND_ERROR_CODES.SLUG_COLLISION, `brand slug '${slug}' already exists`, 409, { slug });
  }
}

/* ------------------------------------------------------------------
 * Semantic
 * ------------------------------------------------------------------ */

export class BrandInvalidLifecycleTransitionError extends BrandError {
  constructor(from: string, to: string) {
    super(BRAND_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION, `cannot transition brand from '${from}' to '${to}'`, 409, { from, to });
  }
}

export class BrandHasProductsError extends BrandError {
  constructor() {
    super(BRAND_ERROR_CODES.HAS_PRODUCTS, 'cannot delete brand with associated products', 409);
  }
}
