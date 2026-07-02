import {
  BreedSizeSlug,
  FoodFormSlug,
  LifeStageSlug,
  PetTypeSlug,
  ProductImageSource,
  ProductSortField,
  ProductLifecycleState,
  ProteinOrigin,
  ProteinRole,
  ScoreValueType,
  SortOrder,
} from '../enums';
import type { Uuid } from '@types';

/**
 * Domain-level constants.
 *
 * These are *not* env-driven; they're hard-coded product-rules that
 * match the CHECK constraints in `database/schema.sql`. Pulling
 * them into a single file keeps the domain layer in sync with the
 * SQL layer and gives tests a single import surface.
 *
 * Anything that varies per environment (`APP_PORT`, `DATABASE_URL`,
 * etc.) lives in `apps/api/src/config/app.config.ts` — never here.
 */

/* ------------------------------------------------------------------
 * Length / range bounds (mirror `database/schema.sql`).
 * ------------------------------------------------------------------ */

export const PRODUCT_BOUNDS = {
  nameMinLength: 1,
  nameMaxLength: 200,
  descriptionMaxLength: 8000,
  slugMinLength: 1,
  slugMaxLength: 200,
  upcMinDigits: 8,
  upcMaxDigits: 14,
  upcAllowedLengths: [8, 12, 13, 14] as const,
  packageSizeGramsMin: 0.01,
  packageSizeGramsMax: 1_000_000,
  packageSizeLabelMaxLength: 64,
  scoreMin: 0,
  scoreMax: 100,
  scoreHistoryMaxRowsPerProduct: 240, // ~20 years at monthly cadence
  scoreHistoryMaxNotesLength: 4000,
  scoringVersionMaxLength: 32,
  ingredientsPanelMaxRows: 500,        // ck_product_ingredients_position_pos upper bound
  imageAltTextMaxLength: 1000,
  imagePathMaxLength: 1024,
  imageMimeTypeMaxLength: 100,
  nutritionNotesMaxLength: 4000,
  brandNameMaxLength: 200,
  brandDescriptionMaxLength: 8000,
  brandSlugMinLength: 1,
  brandSlugMaxLength: 200,
  countryCodeMaxLength: 2,
  maxLimit: 100,
  defaultLimit: 20,
  sortBy: ProductSortField.PublishedAt,
  sortOrder: SortOrder.Desc,
} as const;

export const PRODUCT_SLUG_RE = /^[a-z0-9-]+$/;
export const PRODUCT_UPC_RE = /^[0-9]{8,14}$/;

/* ------------------------------------------------------------------
 * Field defaults.
 * ------------------------------------------------------------------ */

export const PRODUCT_DEFAULTS = {
  sortBy: ProductSortField.PublishedAt,
  sortOrder: SortOrder.Desc,
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const NUTRITION_DEFAULTS = {
  /** No currently-effective period until first explicit `effective_from`. */
  defaultEffectiveFrom: '1970-01-01',
} as const;

/* ------------------------------------------------------------------
 * Authoring rules (project-style; mirrored in the schema CHECKs).
 * ------------------------------------------------------------------ */

/**
 * Products in `archived` state are not served by the public API even
 * if `is_active = true` and `published_at IS NOT NULL`. `archive` is
 * the only terminal state — it is the value of the `is_archived`
 * "soft" flag that lives in code (Sprint 1 doesn't have a column for
 * it; Sprint 9 will add it).
 */
export const PRODUCT_ARCHIVED_HIDES_FROM_PUBLIC = true;

/* ------------------------------------------------------------------
 * Lookup enums — frozen references for tests, mappers, and the future
 * Ingredients module. Purely TypeScript; the SQL is the source of truth.
 * ------------------------------------------------------------------ */

export const PET_TYPES: ReadonlyArray<PetTypeSlug> = Object.freeze([
  PetTypeSlug.Dog,
  PetTypeSlug.Cat,
  PetTypeSlug.Rabbit,
  PetTypeSlug.Bird,
  PetTypeSlug.SmallMammal,
]);

export const LIFE_STAGES: ReadonlyArray<LifeStageSlug> = Object.freeze([
  LifeStageSlug.Puppy,
  LifeStageSlug.Junior,
  LifeStageSlug.Adult,
  LifeStageSlug.Senior,
  LifeStageSlug.Geriatric,
]);

export const BREED_SIZES: ReadonlyArray<BreedSizeSlug> = Object.freeze([
  BreedSizeSlug.Toy,
  BreedSizeSlug.Small,
  BreedSizeSlug.Medium,
  BreedSizeSlug.Large,
  BreedSizeSlug.Giant,
]);

export const FOOD_FORMS: ReadonlyArray<FoodFormSlug> = Object.freeze([
  FoodFormSlug.Kibble,
  FoodFormSlug.Wet,
  FoodFormSlug.Raw,
  FoodFormSlug.FreezeDried,
  FoodFormSlug.Dehydrated,
  FoodFormSlug.Soft,
  FoodFormSlug.Topper,
  FoodFormSlug.Mixer,
  FoodFormSlug.Treat,
  FoodFormSlug.Supplement,
]);

export const PROTEIN_ORIGINS: ReadonlyArray<ProteinOrigin> = Object.freeze([
  ProteinOrigin.Animal,
  ProteinOrigin.Plant,
  ProteinOrigin.Insect,
  ProteinOrigin.Fungi,
  ProteinOrigin.Synthetic,
]);

export const PRODUCT_SORT_FIELDS: ReadonlyArray<ProductSortField> = Object.freeze([
  ProductSortField.CreatedAt,
  ProductSortField.PublishedAt,
  ProductSortField.OverallScore,
  ProductSortField.Name,
]);

export const SORT_ORDERS: ReadonlyArray<SortOrder> = Object.freeze([
  SortOrder.Asc,
  SortOrder.Desc,
]);

export const PRODUCT_LIFECYCLE_STATES: ReadonlyArray<ProductLifecycleState> = Object.freeze([
  ProductLifecycleState.Draft,
  ProductLifecycleState.Active,
  ProductLifecycleState.Inactive,
  ProductLifecycleState.Published,
  ProductLifecycleState.Unpublished,
  ProductLifecycleState.SoftDeleted,
  ProductLifecycleState.Archived,
]);

export const PROTEIN_ROLES: ReadonlyArray<ProteinRole> = Object.freeze([
  ProteinRole.Primary,
  ProteinRole.Secondary,
]);

export const PRODUCT_IMAGE_SOURCES: ReadonlyArray<ProductImageSource> = Object.freeze([
  ProductImageSource.Brand,
  ProductImageSource.Platform,
]);

export const SCORE_VALUE_TYPES: ReadonlyArray<ScoreValueType> = Object.freeze([
  ScoreValueType.Exact,
  ScoreValueType.Min,
  ScoreValueType.Max,
  ScoreValueType.Typical,
]);

/* ------------------------------------------------------------------
 * Reserved UUIDs.
 * ------------------------------------------------------------------ */

export const PRODUCTS_NONE_UUID: Uuid = '00000000-0000-4000-8000-000000000000' as Uuid;
export const PRODUCTS_DEFAULT_BRAND_UUID: Uuid = '11111111-1111-4111-8111-111111111111' as Uuid;
