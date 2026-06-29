/**
 * Domain enums for the Ingredients module.
 *
 * Closed value sets used inside the domain layer. They mirror
 * the Postgres columns and CHECK constraints in `database/schema.sql`.
 */

/** Allowed sort fields for ingredient listing. */
export enum IngredientSortField {
  CreatedAt = 'created_at',
  Name = 'name',
  CanonicalName = 'canonical_name',
  Score = 'score',
}

/** Sort order direction. */
export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * Ingredient lifecycle states.
 *
 *   Active     — listed in the catalog (`is_active = true`).
 *   Inactive   — soft-disabled by admin (`is_active = false`).
 *   SoftDeleted — `deleted_at IS NOT NULL`; tombstoned; never returned.
 */
export enum IngredientLifecycleState {
  Active = 'active',
  Inactive = 'inactive',
  SoftDeleted = 'soft_deleted',
}

/** Evidence type for scientific references. */
export enum EvidenceType {
  Supports = 'supports',
  Refutes = 'refutes',
  Neutral = 'neutral',
}
