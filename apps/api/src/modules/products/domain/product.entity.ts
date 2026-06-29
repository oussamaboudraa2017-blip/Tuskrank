import type { Uuid } from '@types';
import {
  ProductLifecycle,
  deriveHealth,
  deriveLifecycle,
  ProductHealthReport,
  ProductSlug,
  Upc,
  Sku,
  asProductSlug,
  asUpc,
  asSku,
  PackageSize,
  makePackageSize,
} from './value-objects';
import { ProductLifecycleState, ProductHealth } from './enums';
import {
  Brand,
  FoodForm,
  ProteinSource,
  ProductScore,
  ProductScoreHistory,
  ProductImage,
  ProductIngredientEntry,
  ProductTag,
  ProductClaim,
  ProductTargeting,
  NutritionProfile,
  ProductNutrientValue,
} from './types';
import {
  ProductInvalidLifecycleTransitionError,
  ProductSoftDeletedError,
  ProductInvalidPackageSizeError,
} from './errors';

/* ==================================================================
 * Construction input
 * ================================================================== */

/**
 * Constructor-shaped input for `ProductEntity.from`.
 *
 * Pre-validated primitive fields (string | number) match the raw
 * columns of `products`. Joined entities (brand, food form, ...)
 * are pre-resolved by the repository / mapper.
 */
export interface ProductConstructionInput {
  readonly id: Uuid;
  readonly brandId: Uuid;
  readonly brand: Brand;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly upc: string | null;
  readonly sku: string | null;
  readonly packageSizeGrams: number | null;
  readonly packageSizeLabel: string | null;
  readonly foodFormId: Uuid | null;
  readonly foodForm: FoodForm | null;
  readonly primaryProteinSourceId: Uuid | null;
  readonly primaryProteinSource: ProteinSource | null;
  readonly isActive: boolean;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly score: ProductScore | null;
  readonly scoreHistory: ProductScoreHistory;
  readonly images: ReadonlyArray<ProductImage>;
  readonly ingredientPanel: ReadonlyArray<ProductIngredientEntry>;
  readonly tags: ReadonlyArray<ProductTag>;
  readonly claims: ReadonlyArray<ProductClaim>;
  readonly targeting: ReadonlyArray<ProductTargeting>;
  readonly nutritionProfiles: ReadonlyArray<NutritionProfile>;
  readonly nutrientValues: ReadonlyArray<ProductNutrientValue>;
}

/* ==================================================================
 * ProductEntity
 * ================================================================== */

/**
 * Aggregate root for the Products domain.
 *
 * Holds *all* the data that defines a product, plus derived state
 * (lifecycle, health) and a small set of invariants:
 *
 * - `brandId` matches `brand.id`.
 * - `foodFormId` is null when `foodForm` is null (and vice versa).
 * - `primaryProteinSourceId` is null when `primaryProteinSource` is null.
 * - Slug is well-formed (`^[a-z0-9-]+$`).
 * - UPC, if set, is one of 8/12/13/14 digits.
 *
 * The entity is **frozen** after construction. Lifecycle transitions
 * return a *new* entity. The mapper is the only path that produces
 * a `ProductEntity`; the repository is the only path that consumes
 * one (besides the controller).
 */
export class ProductEntity {
  readonly id: Uuid;
  readonly brandId: Uuid;
  readonly brand: Brand;
  readonly name: string;
  readonly slug: ProductSlug;
  readonly description: string | null;
  readonly upc: Upc | null;
  readonly sku: Sku | null;
  readonly packageSize: PackageSize | null;
  /** Flat accessor for `packageSizeGrams` (mirrors DB column). */
  readonly packageSizeGrams: number | null;
  /** Flat accessor for `packageSizeLabel` (mirrors DB column). */
  readonly packageSizeLabel: string | null;
  readonly foodFormId: Uuid | null;
  readonly foodForm: FoodForm | null;
  readonly primaryProteinSourceId: Uuid | null;
  readonly primaryProteinSource: ProteinSource | null;
  readonly isActive: boolean;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly score: ProductScore | null;
  readonly scoreHistory: ProductScoreHistory;
  readonly images: ReadonlyArray<ProductImage>;
  readonly ingredientPanel: ReadonlyArray<ProductIngredientEntry>;
  readonly tags: ReadonlyArray<ProductTag>;
  readonly claims: ReadonlyArray<ProductClaim>;
  readonly targeting: ReadonlyArray<ProductTargeting>;
  readonly nutritionProfiles: ReadonlyArray<NutritionProfile>;
  readonly nutrientValues: ReadonlyArray<ProductNutrientValue>;

  /** Derived value object. */
  readonly lifecycle: ProductLifecycle;

  /** Derived value object — computed on construction. */
  readonly health: ProductHealthReport;

  private constructor(
    raw: ProductConstructionInput,
    slug: ProductSlug,
    upc: Upc | null,
    sku: Sku | null,
    packageSize: PackageSize | null,
    lifecycle: ProductLifecycle,
    health: ProductHealthReport,
  ) {
    this.id = raw.id;
    this.brandId = raw.brandId;
    this.brand = raw.brand;
    this.name = raw.name;
    this.slug = slug;
    this.description = raw.description;
    this.upc = upc;
    this.sku = sku;
    this.packageSize = packageSize;
    this.packageSizeGrams = packageSize?.grams ?? null;
    this.packageSizeLabel = packageSize?.label ?? null;
    this.foodFormId = raw.foodFormId;
    this.foodForm = raw.foodForm;
    this.primaryProteinSourceId = raw.primaryProteinSourceId;
    this.primaryProteinSource = raw.primaryProteinSource;
    this.isActive = raw.isActive;
    this.publishedAt = raw.publishedAt;
    this.createdAt = raw.createdAt;
    this.updatedAt = raw.updatedAt;
    this.deletedAt = raw.deletedAt;
    this.score = raw.score;
    this.scoreHistory = raw.scoreHistory;
    this.images = Object.freeze([...raw.images]);
    this.ingredientPanel = Object.freeze([...raw.ingredientPanel]);
    this.tags = Object.freeze([...raw.tags]);
    this.claims = Object.freeze([...raw.claims]);
    this.targeting = Object.freeze([...raw.targeting]);
    this.nutritionProfiles = Object.freeze([...raw.nutritionProfiles]);
    this.nutrientValues = Object.freeze([...raw.nutrientValues]);
    this.lifecycle = lifecycle;
    this.health = health;

    if (this.brandId !== this.brand.id) {
      throw new Error(
        `ProductEntity invariant: brandId (${this.brandId}) does not match brand.id (${this.brand.id}).`,
      );
    }
    if (this.foodFormId !== null && this.foodForm === null) {
      throw new Error(
        `ProductEntity invariant: foodFormId set (${this.foodFormId}) but foodForm is null.`,
      );
    }
    if (this.foodFormId === null && this.foodForm !== null) {
      throw new Error(
        `ProductEntity invariant: foodForm set but foodFormId is null.`,
      );
    }
    if (this.primaryProteinSourceId !== null && this.primaryProteinSource === null) {
      throw new Error(
        `ProductEntity invariant: primaryProteinSourceId set (${this.primaryProteinSourceId}) but primaryProteinSource is null.`,
      );
    }
    if (this.primaryProteinSourceId === null && this.primaryProteinSource !== null) {
      throw new Error(
        `ProductEntity invariant: primaryProteinSource set but primaryProteinSourceId is null.`,
      );
    }
    Object.freeze(this);
  }

  /**
   * Factory: build a `ProductEntity` from raw inputs.
   *
   * Validates primitives (`slug`, `upc`, `sku`, `packageSize`) and
   * derives the lifecycle + health. Throws `TypeError` on shape
   * errors (caller-side bug) and `ProductInvalidLifecycleTransitionError`
   * on a non-sensical lifecycle state (caller-side bug or data corruption).
   */
  static from(raw: ProductConstructionInput): ProductEntity {
    const slug = asProductSlug(raw.slug);
    const upc = raw.upc === null ? null : asUpc(raw.upc);
    const sku = raw.sku === null ? null : asSku(raw.sku);
    const packageSize = makePackageSizeOrNull(raw.packageSizeGrams, raw.packageSizeLabel);

    const lifecycle = deriveLifecycle({
      isActive: raw.isActive,
      publishedAt: raw.publishedAt,
      deletedAt: raw.deletedAt,
    });
    const health = deriveHealth({
      lifecycle,
      hasScore: raw.score !== null,
      hasIngredients: raw.ingredientPanel.length > 0,
      hasImages: raw.images.length > 0,
      hasNutrition: raw.nutritionProfiles.length > 0,
      scoreUpdatedAt: raw.score?.updatedAt ?? null,
    });

    return new ProductEntity(raw, slug, upc, sku, packageSize, lifecycle, health);
  }

  /* ================================================================
   * Domain queries (read-side; cheap; no I/O)
   * ================================================================ */

  isPubliclyVisible(): boolean {
    return (
      this.lifecycle.state === ProductLifecycleState.Published && this.isActive
    );
  }

  hasPrimaryImage(): boolean {
    return this.images.some((i) => i.isPrimary);
  }

  primaryImage(): ProductImage | null {
    return this.images.find((i) => i.isPrimary) ?? null;
  }

  primaryIngredient(): ProductIngredientEntry | null {
    return this.ingredientPanel.find((i) => i.isPrimary) ?? null;
  }

  hasCategory(id: Uuid): boolean {
    return this.targeting.some((t) => t.categoryId === id && t.isActive);
  }

  hasTag(slug: string): boolean {
    return this.tags.some((t) => t.slug === slug);
  }

  hasClaim(slug: string): boolean {
    return this.claims.some((c) => c.slug === slug);
  }

  currentScore(): number | null {
    return this.score?.overall ?? null;
  }

  /**
   * Most-recent score (current or last historical), or null when no
   * score has ever been computed. Uses `scoreHistory[0]` if no current
   * row is set.
   */
  latestScoreOrNull(): ProductScore | null {
    if (this.score && this.score.isCurrent) return this.score;
    const last = this.scoreHistory[0] ?? null;
    if (!last) return null;
    return {
      id: last.id,
      productId: this.id,
      overall: last.overall,
      quality: last.quality,
      safety: last.safety,
      nutrition: last.nutrition,
      transparency: last.transparency,
      grade: null,
      scoringVersion: last.scoringVersion,
      isCurrent: false,
      updatedAt: last.computedAt,
    };
  }

  isHealthy(): boolean {
    return this.health.health === ProductHealth.Healthy;
  }

  /* ================================================================
   * Domain transitions (return a *new* ProductEntity — never mutate)
   * ================================================================ */

  /** Mark a draft as published. Returns a new entity. */
  publish(at: Date = new Date()): ProductEntity {
    this.assertNotSoftDeleted();
    if (this.lifecycle.state === ProductLifecycleState.Archived) {
      throw new ProductInvalidLifecycleTransitionError(
        this.id,
        this.lifecycle.state,
        ProductLifecycleState.Published,
      );
    }
    if (this.lifecycle.state === ProductLifecycleState.Published) {
      return this; // idempotent
    }
    if (this.lifecycle.state === ProductLifecycleState.SoftDeleted) {
      throw new ProductInvalidLifecycleTransitionError(
        this.id,
        this.lifecycle.state,
        ProductLifecycleState.Published,
      );
    }
    return this.rebuild({ publishedAt: at, isActive: true });
  }

  /** Withdraw a published product. */
  unpublish(): ProductEntity {
    this.assertNotSoftDeleted();
    if (this.lifecycle.state !== ProductLifecycleState.Published) {
      throw new ProductInvalidLifecycleTransitionError(
        this.id,
        this.lifecycle.state,
        ProductLifecycleState.Unpublished,
      );
    }
    return this.rebuild({ publishedAt: null });
  }

  /** Soft-disable a product. */
  deactivate(): ProductEntity {
    this.assertNotSoftDeleted();
    if (!this.isActive) return this;
    return this.rebuild({ isActive: false });
  }

  /** Re-enable a soft-disabled product. */
  activate(): ProductEntity {
    this.assertNotSoftDeleted();
    if (this.isActive) return this;
    return this.rebuild({ isActive: true });
  }

  /** Soft-delete (tombstone). */
  softDelete(at: Date = new Date()): ProductEntity {
    if (this.deletedAt !== null) return this;
    return this.rebuild({ deletedAt: at, isActive: false });
  }

  /** Restore a soft-deleted product. */
  restore(): ProductEntity {
    if (this.deletedAt === null) return this;
    return this.rebuild({ deletedAt: null });
  }

  /** Internal builder used by transitions. */
  private rebuild(patch: {
    isActive?: boolean;
    publishedAt?: Date | null;
    deletedAt?: Date | null;
  }): ProductEntity {
    const next: ProductConstructionInput = {
      id: this.id,
      brandId: this.brandId,
      brand: this.brand,
      name: this.name,
      slug: this.slug as unknown as string, // ProductEntity ensures invariant
      description: this.description,
      upc: this.upc as unknown as string | null,
      sku: this.sku as unknown as string | null,
      packageSizeGrams: this.packageSize?.grams ?? null,
      packageSizeLabel: this.packageSize?.label ?? null,
      foodFormId: this.foodFormId,
      foodForm: this.foodForm,
      primaryProteinSourceId: this.primaryProteinSourceId,
      primaryProteinSource: this.primaryProteinSource,
      isActive: patch.isActive ?? this.isActive,
      publishedAt: patch.publishedAt === undefined ? this.publishedAt : patch.publishedAt,
      createdAt: this.createdAt,
      updatedAt: new Date(),
      deletedAt: patch.deletedAt === undefined ? this.deletedAt : patch.deletedAt,
      score: this.score,
      scoreHistory: this.scoreHistory,
      images: this.images,
      ingredientPanel: this.ingredientPanel,
      tags: this.tags,
      claims: this.claims,
      targeting: this.targeting,
      nutritionProfiles: this.nutritionProfiles,
      nutrientValues: this.nutrientValues,
    };
    return ProductEntity.from(next);
  }

  private assertNotSoftDeleted(): void {
    if (this.deletedAt !== null) {
      throw new ProductSoftDeletedError(this.id);
    }
  }
}

/* ==================================================================
 * Helpers
 * ================================================================== */

function makePackageSizeOrNull(
  grams: number | null,
  label: string | null,
): PackageSize | null {
  if (grams === null) {
    if (label !== null) {
      throw new ProductInvalidPackageSizeError(
        'unset',
        NaN,
        'label is set without grams',
      );
    }
    return null;
  }
  try {
    return makePackageSize(grams, label);
  } catch (err) {
    throw new ProductInvalidPackageSizeError(
      'unset',
      grams,
      (err as Error).message,
    );
  }
}
