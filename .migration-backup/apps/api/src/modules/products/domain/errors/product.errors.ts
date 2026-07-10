import { ApiError, ConflictError, NotFoundError, UnprocessableEntityError, ValidationError } from '@common/errors/api-error';
import type { Uuid } from '@types';

/**
 * Domain errors for the Products module.
 *
 * All errors extend the foundation's `ApiError` so the global
 * exception filter shapes them into the same `{ success, error, meta }`
 * envelope every other API surface uses.
 *
 * Each error carries a stable `code` (from `APP_CONSTANTS.ERROR_CODES`)
 * and a human-readable `message`. The `details` field is a typed
 * record so callers can branch on shape rather than string-sniff.
 *
 * Throwing an error is the *only* signal the service layer can use
 * to communicate a domain failure to the controller layer.
 */

const PRODUCT_CODE = {
  NOT_FOUND: 'PRODUCT_NOT_FOUND',
  BRAND_NOT_FOUND: 'BRAND_NOT_FOUND',
  SLUG_COLLISION: 'PRODUCT_SLUG_COLLISION',
  UPC_COLLISION: 'PRODUCT_UPC_COLLISION',
  SKU_COLLISION: 'PRODUCT_SKU_COLLISION',
  INVALID_LIFECYCLE: 'PRODUCT_INVALID_LIFECYCLE_TRANSITION',
  ARCHIVED: 'PRODUCT_ARCHIVED',
  SOFT_DELETED: 'PRODUCT_SOFT_DELETED',
  INACTIVE: 'PRODUCT_INACTIVE',
  STALE_SCORING_VERSION: 'PRODUCT_STALE_SCORING_VERSION',
  DUPLICATE_INGREDIENT_ENTRY: 'PRODUCT_DUPLICATE_INGREDIENT_ENTRY',
  PRIMARY_INGREDIENT_CONFLICT: 'PRODUCT_PRIMARY_INGREDIENT_CONFLICT',
  INVALID_PACKAGE_SIZE: 'PRODUCT_INVALID_PACKAGE_SIZE',
  PRIMARY_IMAGE_CONFLICT: 'PRODUCT_PRIMARY_IMAGE_CONFLICT',
  IMAGE_LIMIT: 'PRODUCT_IMAGE_LIMIT_EXCEEDED',
  PANEL_LIMIT: 'PRODUCT_INGREDIENT_PANEL_LIMIT_EXCEEDED',
} as const;

export type ProductErrorCode = (typeof PRODUCT_CODE)[keyof typeof PRODUCT_CODE];

/* ==================================================================
 * Base — every product error extends this.
 * ================================================================== */

export class ProductError extends ApiError {
  constructor(code: ProductErrorCode, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(code, message, httpStatus, details);
    this.name = new.target.name;
  }
}

/* ==================================================================
 * Read failures
 * ================================================================== */

export class ProductNotFoundError extends ProductError {
  constructor(productId: Uuid | string, details?: Record<string, unknown>) {
    super(
      PRODUCT_CODE.NOT_FOUND,
      `Product ${productId} not found`,
      404,
      { productId, ...(details ?? {}) },
    );
  }
}

export class BrandNotFoundError extends ProductError {
  constructor(brandId: Uuid | string, details?: Record<string, unknown>) {
    super(
      PRODUCT_CODE.BRAND_NOT_FOUND,
      `Brand ${brandId} not found`,
      422,
      { brandId, ...(details ?? {}) },
    );
  }
}

export class ProductSoftDeletedError extends ProductError {
  constructor(productId: Uuid | string) {
    super(
      PRODUCT_CODE.SOFT_DELETED,
      `Product ${productId} is soft-deleted and cannot be returned`,
      410,
      { productId },
    );
  }
}

export class ProductArchivedError extends ProductError {
  constructor(productId: Uuid | string) {
    super(
      PRODUCT_CODE.ARCHIVED,
      `Product ${productId} is archived and cannot be returned`,
      410,
      { productId },
    );
  }
}

export class ProductInactiveError extends ProductError {
  constructor(productId: Uuid | string) {
    super(
      PRODUCT_CODE.INACTIVE,
      `Product ${productId} is inactive; include isActive=false in filters to see it`,
      403,
      { productId },
    );
  }
}

/* ==================================================================
 * Write conflicts
 * ================================================================== */

export class ProductSlugCollisionError extends ProductError {
  constructor(brandId: Uuid, slug: string) {
    super(
      PRODUCT_CODE.SLUG_COLLISION,
      `Product slug "${slug}" already exists for brand ${brandId}`,
      409,
      { brandId, slug },
    );
  }
}

export class ProductUpcCollisionError extends ProductError {
  constructor(upc: string) {
    super(
      PRODUCT_CODE.UPC_COLLISION,
      `UPC "${upc}" already used by another product`,
      409,
      { upc },
    );
  }
}

export class ProductSkuCollisionError extends ProductError {
  constructor(brandId: Uuid, sku: string) {
    super(
      PRODUCT_CODE.SKU_COLLISION,
      `SKU "${sku}" already used for brand ${brandId}`,
      409,
      { brandId, sku },
    );
  }
}

export class ProductDuplicateIngredientEntryError extends ProductError {
  constructor(productId: Uuid, ingredientId: Uuid) {
    super(
      PRODUCT_CODE.DUPLICATE_INGREDIENT_ENTRY,
      `Ingredient ${ingredientId} is already on the panel of product ${productId}`,
      409,
      { productId, ingredientId },
    );
  }
}

export class ProductPrimaryIngredientConflictError extends ProductError {
  constructor(productId: Uuid, currentPrimary: Uuid) {
    super(
      PRODUCT_CODE.PRIMARY_INGREDIENT_CONFLICT,
      `Product ${productId} already has a primary ingredient (${currentPrimary}); clear it first`,
      409,
      { productId, currentPrimary },
    );
  }
}

export class ProductPrimaryImageConflictError extends ProductError {
  constructor(productId: Uuid, currentPrimary: Uuid) {
    super(
      PRODUCT_CODE.PRIMARY_IMAGE_CONFLICT,
      `Product ${productId} already has a primary image (${currentPrimary}); clear is_primary first`,
      409,
      { productId, currentPrimary },
    );
  }
}

/* ==================================================================
 * Semantic / business-rule failures
 * ================================================================== */

export class ProductInvalidLifecycleTransitionError extends ProductError {
  constructor(productId: Uuid, from: string, to: string) {
    super(
      PRODUCT_CODE.INVALID_LIFECYCLE,
      `Invalid lifecycle transition for product ${productId}: ${from} → ${to}`,
      409,
      { productId, from, to },
    );
  }
}

export class ProductStaleScoringVersionError extends ProductError {
  constructor(productId: Uuid, currentVersion: string, expectedVersion: string) {
    super(
      PRODUCT_CODE.STALE_SCORING_VERSION,
      `Product ${productId} was scored under "${currentVersion}" but caller expects "${expectedVersion}"`,
      409,
      { productId, currentVersion, expectedVersion },
    );
  }
}

export class ProductInvalidPackageSizeError extends ProductError {
  constructor(productId: Uuid, grams: number, reason: string) {
    super(
      PRODUCT_CODE.INVALID_PACKAGE_SIZE,
      `Invalid package size ${grams} for product ${productId}: ${reason}`,
      422,
      { productId, grams, reason },
    );
  }
}

export class ProductImageLimitError extends ProductError {
  constructor(productId: Uuid, current: number) {
    super(
      PRODUCT_CODE.IMAGE_LIMIT,
      `Product ${productId} already has ${current} images; cannot add more`,
      422,
      { productId, current },
    );
  }
}

export class ProductPanelLimitError extends ProductError {
  constructor(productId: Uuid, current: number) {
    super(
      PRODUCT_CODE.PANEL_LIMIT,
      `Product ${productId} already has ${current} ingredients on the panel; cannot add more`,
      422,
      { productId, current },
    );
  }
}

/* ==================================================================
 * Common re-exports for the foundation (so consumers can
 * `import { ValidationError } from '@modules/products/domain/errors'`
 * without bouncing through `@common`).
 * ================================================================== */

export { ValidationError, NotFoundError, ConflictError, UnprocessableEntityError };
