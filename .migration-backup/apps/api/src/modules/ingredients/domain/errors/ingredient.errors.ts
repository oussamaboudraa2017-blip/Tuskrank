import { ApiError } from '@common/errors/api-error';

/**
 * Ingredient-specific error codes.
 */
export const INGREDIENT_ERROR_CODES = {
  NOT_FOUND: 'INGREDIENT_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'INGREDIENT_CATEGORY_NOT_FOUND',
  SLUG_COLLISION: 'INGREDIENT_SLUG_COLLISION',
  CANONICAL_NAME_COLLISION: 'INGREDIENT_CANONICAL_NAME_COLLISION',
  CATEGORY_SLUG_COLLISION: 'INGREDIENT_CATEGORY_SLUG_COLLISION',
  CATEGORY_HAS_CHILDREN: 'INGREDIENT_CATEGORY_HAS_CHILDREN',
  CATEGORY_HAS_INGREDIENTS: 'INGREDIENT_CATEGORY_HAS_INGREDIENTS',
  CATEGORY_MAX_DEPTH: 'INGREDIENT_CATEGORY_MAX_DEPTH',
  CATEGORY_SELF_PARENT: 'INGREDIENT_CATEGORY_SELF_PARENT',
  CATEGORY_CYCLE_DETECTED: 'INGREDIENT_CATEGORY_CYCLE_DETECTED',
  INGREDIENT_SOFT_DELETED: 'INGREDIENT_SOFT_DELETED',
  INGREDIENT_INACTIVE: 'INGREDIENT_INACTIVE',
  INVALID_LIFECYCLE_TRANSITION: 'INGREDIENT_INVALID_LIFECYCLE_TRANSITION',
  SCORE_STALE_VERSION: 'INGREDIENT_SCORE_STALE_VERSION',
  DESCRIPTION_TOO_LONG: 'INGREDIENT_DESCRIPTION_TOO_LONG',
} as const;

export type IngredientErrorCode = (typeof INGREDIENT_ERROR_CODES)[keyof typeof INGREDIENT_ERROR_CODES];

/* ------------------------------------------------------------------
 * Base
 * ------------------------------------------------------------------ */

export class IngredientError extends ApiError {
  constructor(code: string, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(code, message, httpStatus, details);
  }
}

/* ------------------------------------------------------------------
 * Read
 * ------------------------------------------------------------------ */

export class IngredientNotFoundError extends IngredientError {
  constructor(slugOrId: string) {
    super(INGREDIENT_ERROR_CODES.NOT_FOUND, `ingredient '${slugOrId}' not found`, 404);
  }
}

export class IngredientCategoryNotFoundError extends IngredientError {
  constructor(slugOrId: string) {
    super(INGREDIENT_ERROR_CODES.CATEGORY_NOT_FOUND, `ingredient category '${slugOrId}' not found`, 404);
  }
}

export class IngredientSoftDeletedError extends IngredientError {
  constructor(slugOrId: string) {
    super(INGREDIENT_ERROR_CODES.INGREDIENT_SOFT_DELETED, `ingredient '${slugOrId}' is soft-deleted`, 410);
  }
}

export class IngredientInactiveError extends IngredientError {
  constructor(slugOrId: string) {
    super(INGREDIENT_ERROR_CODES.INGREDIENT_INACTIVE, `ingredient '${slugOrId}' is inactive`, 403);
  }
}

/* ------------------------------------------------------------------
 * Conflict
 * ------------------------------------------------------------------ */

export class IngredientSlugCollisionError extends IngredientError {
  constructor(slug: string) {
    super(INGREDIENT_ERROR_CODES.SLUG_COLLISION, `ingredient slug '${slug}' already exists`, 409, { slug });
  }
}

export class IngredientCanonicalNameCollisionError extends IngredientError {
  constructor(canonicalName: string) {
    super(INGREDIENT_ERROR_CODES.CANONICAL_NAME_COLLISION, `ingredient canonical name '${canonicalName}' already exists`, 409, { canonicalName });
  }
}

export class IngredientCategorySlugCollisionError extends IngredientError {
  constructor(slug: string) {
    super(INGREDIENT_ERROR_CODES.CATEGORY_SLUG_COLLISION, `ingredient category slug '${slug}' already exists`, 409, { slug });
  }
}

/* ------------------------------------------------------------------
 * Semantic
 * ------------------------------------------------------------------ */

export class IngredientCategoryMaxDepthError extends IngredientError {
  constructor() {
    super(INGREDIENT_ERROR_CODES.CATEGORY_MAX_DEPTH, `ingredient categories cannot exceed depth ${3}`, 422);
  }
}

export class IngredientCategorySelfParentError extends IngredientError {
  constructor() {
    super(INGREDIENT_ERROR_CODES.CATEGORY_SELF_PARENT, 'ingredient category cannot be its own parent', 422);
  }
}

export class IngredientCategoryCycleDetectedError extends IngredientError {
  constructor() {
    super(INGREDIENT_ERROR_CODES.CATEGORY_CYCLE_DETECTED, 'ingredient category parent chain contains a cycle', 422);
  }
}

export class IngredientCategoryHasChildrenError extends IngredientError {
  constructor() {
    super(INGREDIENT_ERROR_CODES.CATEGORY_HAS_CHILDREN, 'cannot delete ingredient category with children', 409);
  }
}

export class IngredientCategoryHasIngredientsError extends IngredientError {
  constructor() {
    super(INGREDIENT_ERROR_CODES.CATEGORY_HAS_INGREDIENTS, 'cannot delete ingredient category with ingredients', 409);
  }
}

export class IngredientInvalidLifecycleTransitionError extends IngredientError {
  constructor(from: string, to: string) {
    super(INGREDIENT_ERROR_CODES.INVALID_LIFECYCLE_TRANSITION, `cannot transition ingredient from '${from}' to '${to}'`, 409, { from, to });
  }
}

export class IngredientScoreStaleVersionError extends IngredientError {
  constructor(expected: string, actual: string) {
    super(INGREDIENT_ERROR_CODES.SCORE_STALE_VERSION, `scoring version mismatch: expected '${expected}', got '${actual}'`, 409, { expected, actual });
  }
}
