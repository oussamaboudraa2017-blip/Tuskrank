/**
 * Domain value objects.
 *
 * Value objects are *immutable* and *structurally equal* (compared by
 * their properties, not identity). They wrap a primitive that has a
 * business rule attached — e.g. `ProductSlug` enforces the schema's
 * regex, `Upc` enforces the digit-length policy, `Score` enforces
 * the 0-100 range.
 *
 * Value objects are constructed via factory functions (not classes
 * with public `new`); they expose a `.value` getter and one or more
 * derived properties. This makes them trivially unit-testable and
 * forbids accidental mutation.
 */
import { PRODUCT_BOUNDS, PRODUCT_SLUG_RE, PRODUCT_UPC_RE } from '../constants';
import {
  ProductHealth,
  ProductLifecycleState,
  ScoreValueType,
} from '../enums';
import type { Uuid } from '@types';

/* ==================================================================
 * ProductSlug
 * ================================================================== */

/** URL-safe slug for a product, scoped under a brand. */
export interface ProductSlug extends String {
  readonly __brand: 'ProductSlug';
}

export function asProductSlug(value: string): ProductSlug {
  if (
    value.length < PRODUCT_BOUNDS.slugMinLength ||
    value.length > PRODUCT_BOUNDS.slugMaxLength ||
    !PRODUCT_SLUG_RE.test(value)
  ) {
    throw new TypeError(
      `Invalid ProductSlug: "${value}" — must match ${PRODUCT_SLUG_RE} and be ${PRODUCT_BOUNDS.slugMinLength}-${PRODUCT_BOUNDS.slugMaxLength} chars.`,
    );
  }
  return value as ProductSlug;
}

export function isProductSlug(value: string): value is ProductSlug {
  return (
    value.length >= PRODUCT_BOUNDS.slugMinLength &&
    value.length <= PRODUCT_BOUNDS.slugMaxLength &&
    PRODUCT_SLUG_RE.test(value)
  );
}

/* ==================================================================
 * Upc (Universal Product Code / GTIN)
 * ================================================================== */

/**
 * 8-, 12-, 13-, or 14-digit numeric identifier. Mirrors the schema's
 * `ck_products_upc_format` and `ck_products_upc_check_digit` checks.
 */
export interface Upc extends String {
  readonly __brand: 'Upc';
}

export function asUpc(value: string): Upc {
  if (!PRODUCT_UPC_RE.test(value)) {
    throw new TypeError(
      `Invalid UPC "${value}" — must be 8/12/13/14 numeric digits.`,
    );
  }
  if (!PRODUCT_BOUNDS.upcAllowedLengths.includes(value.length as 8 | 12 | 13 | 14)) {
    throw new TypeError(
      `Invalid UPC length ${value.length}; allowed: ${PRODUCT_BOUNDS.upcAllowedLengths.join(', ')}.`,
    );
  }
  return value as Upc;
}

export function isUpc(value: string): value is Upc {
  return PRODUCT_UPC_RE.test(value) && PRODUCT_BOUNDS.upcAllowedLengths.includes(value.length as 8 | 12 | 13 | 14);
}

/* ==================================================================
 * Sku
 * ================================================================== */

/** Manufacturer-supplied SKU; not checked at the database level. */
export interface Sku extends String {
  readonly __brand: 'Sku';
}

export function asSku(value: string): Sku {
  if (value.length === 0 || value.length > 64) {
    throw new TypeError(`Invalid Sku: length must be 1-64, got ${value.length}.`);
  }
  return value as Sku;
}

/* ==================================================================
 * Score (0..100)
 * ================================================================== */

/** Decimal score on a 0..100 scale. Always paired with a `ScoreValueType`. */
export interface Score extends Number {
  readonly __brand: 'Score';
}

export function asScore(value: number): Score {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Score must be finite, got ${value}.`);
  }
  if (value < PRODUCT_BOUNDS.scoreMin || value > PRODUCT_BOUNDS.scoreMax) {
    throw new TypeError(
      `Score out of range: ${value}; must be ${PRODUCT_BOUNDS.scoreMin}-${PRODUCT_BOUNDS.scoreMax}.`,
    );
  }
  return value as unknown as Score;
}

/* ==================================================================
 * ScoreValue
 * ================================================================== */

export interface ScoreValue {
  readonly value: Score;
  readonly type: ScoreValueType;
  readonly scoringVersion: string;
}

export function makeScoreValue(
  value: number,
  type: ScoreValueType,
  scoringVersion: string,
): ScoreValue {
  if (scoringVersion.length === 0 || scoringVersion.length > PRODUCT_BOUNDS.scoringVersionMaxLength) {
    throw new TypeError(
      `Invalid scoringVersion length: must be 1-${PRODUCT_BOUNDS.scoringVersionMaxLength}.`,
    );
  }
  return {
    value: asScore(value),
    type,
    scoringVersion,
  };
}

/* ==================================================================
 * PackageSize
 * ================================================================== */

export interface PackageSize {
  readonly grams: number;
  readonly label: string | null;
}

export function makePackageSize(grams: number, label: string | null = null): PackageSize {
  if (grams < PRODUCT_BOUNDS.packageSizeGramsMin || grams > PRODUCT_BOUNDS.packageSizeGramsMax) {
    throw new TypeError(
      `Package size out of range: ${grams}g; allowed ${PRODUCT_BOUNDS.packageSizeGramsMin}-${PRODUCT_BOUNDS.packageSizeGramsMax}g.`,
    );
  }
  if (label !== null && label.length > PRODUCT_BOUNDS.packageSizeLabelMaxLength) {
    throw new TypeError(
      `Package size label too long: ${label.length} > ${PRODUCT_BOUNDS.packageSizeLabelMaxLength}.`,
    );
  }
  return { grams, label };
}

/* ==================================================================
 * Lifecycle (value object)
 * ================================================================== */

export interface ProductLifecycle {
  readonly state: ProductLifecycleState;
  readonly isActive: boolean;
  readonly publishedAt: Date | null;
  readonly isDeleted: boolean;
}

/** Derive a lifecycle snapshot from the entity's lifecycle fields. */
export function deriveLifecycle(input: {
  isActive: boolean;
  publishedAt: Date | null;
  deletedAt: Date | null;
}): ProductLifecycle {
  const isDeleted = input.deletedAt !== null;
  let state: ProductLifecycleState;

  if (isDeleted) {
    state = ProductLifecycleState.SoftDeleted;
  } else if (!input.isActive) {
    state = ProductLifecycleState.Inactive;
  } else if (input.publishedAt === null) {
    state = ProductLifecycleState.Draft;
  } else {
    state = ProductLifecycleState.Published;
  }

  return Object.freeze({
    state,
    isActive: input.isActive,
    publishedAt: input.publishedAt,
    isDeleted,
  });
}

/* ==================================================================
 * Health (value object)
 * ================================================================== */

export interface ProductHealthReport {
  readonly health: ProductHealth;
  readonly reasons: ReadonlyArray<string>;
}

export function deriveHealth(input: {
  lifecycle: ProductLifecycle;
  hasScore: boolean;
  hasIngredients: boolean;
  hasImages: boolean;
  hasNutrition: boolean;
  scoreUpdatedAt: Date | null;
}): ProductHealthReport {
  const reasons: string[] = [];
  let health: ProductHealth = ProductHealth.Healthy;

  if (input.lifecycle.isDeleted) {
    health = ProductHealth.SoftDeleted;
    reasons.push('soft_deleted');
    return { health, reasons };
  }
  if (input.lifecycle.state === ProductLifecycleState.Draft) {
    health = ProductHealth.Draft;
    reasons.push('draft');
  }
  if (!input.hasIngredients) {
    reasons.push('no_ingredients');
    if (health === ProductHealth.Healthy) health = ProductHealth.NoIngredients;
  }
  if (!input.hasImages) {
    reasons.push('no_images');
    if (health === ProductHealth.Healthy) health = ProductHealth.NoImages;
  }
  if (!input.hasNutrition) {
    reasons.push('missing_nutrition');
    if (health === ProductHealth.Healthy) health = ProductHealth.MissingNutrition;
  }
  if (!input.hasScore) {
    reasons.push('no_score');
    if (health === ProductHealth.Healthy) health = ProductHealth.StaleScore;
  } else if (input.scoreUpdatedAt === null) {
    reasons.push('stale_score');
    if (health === ProductHealth.Healthy) health = ProductHealth.StaleScore;
  }

  return Object.freeze({ health, reasons });
}

/* ==================================================================
 * ImageKey — small ref-counting helper for "is primary" enforcement.
 * ================================================================== */

export interface ProductImageKey {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly storagePath: string;
  readonly publicUrl: string;
  readonly isPrimary: boolean;
  readonly sortOrder: number;
}
