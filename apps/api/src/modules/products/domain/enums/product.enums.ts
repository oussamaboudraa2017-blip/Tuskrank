/**
 * Domain enums for the Products module.
 *
 * These are the *closed value sets* used inside the domain layer. They mirror
 * the Postgres ENUMs declared in `database/schema.sql` and the literals
 * tracked in `apps/api/src/modules/products/interfaces/list-products.sort.ts`.
 *
 * Wire-side enums (Swagger-generated) live in the DTOs; domain enums are
 * the only thing the mapper sees.
 */

/** Allowed sort fields for product listing. */
export enum ProductSortField {
  CreatedAt = 'created_at',
  PublishedAt = 'published_at',
  OverallScore = 'overall_score',
  Name = 'name',
}

/** Sort order direction. */
export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

/** Filter-by pet type (mirrors `pet_types` ENUM-like in the schema). */
export enum PetTypeSlug {
  Dog = 'dog',
  Cat = 'cat',
  Rabbit = 'rabbit',
  Bird = 'bird',
  SmallMammal = 'small_mammal',
}

/** Filter-by life stage (mirrors `life_stages` ENUM-like). */
export enum LifeStageSlug {
  Puppy = 'puppy',
  Junior = 'junior',
  Adult = 'adult',
  Senior = 'senior',
  Geriatric = 'geriatric',
}

/** Filter-by breed size (mirrors `breed_sizes` ENUM-like). */
export enum BreedSizeSlug {
  Toy = 'toy',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Giant = 'giant',
}

/** Filter-by food form (mirrors `food_forms` row slugs). */
export enum FoodFormSlug {
  Kibble = 'kibble',
  Wet = 'wet',
  Raw = 'raw',
  FreezeDried = 'freeze_dried',
  Dehydrated = 'dehydrated',
  Soft = 'soft',
  Topper = 'topper',
  Mixer = 'mixer',
  Treat = 'treat',
  Supplement = 'supplement',
}

/** Filter-by primary protein origin (mirrors `protein_origin` ENUM). */
export enum ProteinOrigin {
  Animal = 'animal',
  Plant = 'plant',
  Insect = 'insect',
  Fungi = 'fungi',
  Synthetic = 'synthetic',
}

/**
 * Product lifecycle states.
 *
 *   Draft       — never published (`is_published = false`, `published_at = null`).
 *   Active      — listed in the catalog (`is_active = true`).
 *   Inactive    — soft-disabled by admin (`is_active = false`).
 *   Published   — has a `published_at` and is visible to consumers.
 *   Unpublished — had a `published_at`, was withdrawn.
 *   SoftDeleted — `deleted_at IS NOT NULL`; tombstoned; never returned.
 *   Archived    — explicitly retired; placeholder for Sprint 9+.
 *
 * Computed by `ProductLifecycle.from(...)` — never stored.
 */
export enum ProductLifecycleState {
  Draft = 'draft',
  Active = 'active',
  Inactive = 'inactive',
  Published = 'published',
  Unpublished = 'unpublished',
  SoftDeleted = 'soft_deleted',
  Archived = 'archived',
}

/** Lookup-key for "is this ingredient the primary protein source?". */
export enum ProteinRole {
  Primary = 'primary',
  Secondary = 'secondary',
}

/** Whether a row is a brand-side declaration or platform-side. */
export enum ProductImageSource {
  Brand = 'brand',
  Platform = 'platform',
}

/** Score value type — straight number, or a min/max envelope. */
export enum ScoreValueType {
  Exact = 'exact',
  Min = 'min',
  Max = 'max',
  Typical = 'typical',
}

/** Health of an entity (the domain's point-of-view). */
export enum ProductHealth {
  Healthy = 'healthy',
  StaleScore = 'stale_score',
  MissingNutrition = 'missing_nutrition',
  NoIngredients = 'no_ingredients',
  NoImages = 'no_images',
  Draft = 'draft',
  SoftDeleted = 'soft_deleted',
}
