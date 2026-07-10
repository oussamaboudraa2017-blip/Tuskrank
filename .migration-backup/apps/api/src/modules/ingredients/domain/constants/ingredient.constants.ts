import {
  IngredientSortField,
  SortOrder,
} from '../enums';

/**
 * Domain-level constants for the Ingredients module.
 *
 * Numeric bounds mirror the CHECK constraints in `database/schema.sql`.
 * Changing a value here MUST come with a paired migration.
 */

export const INGREDIENT_BOUNDS = {
  nameMinLength: 1,
  nameMaxLength: 200,
  descriptionMaxLength: 8000,
  slugMinLength: 1,
  slugMaxLength: 200,
  inciNameMaxLength: 200,
  canonicalNameMaxLength: 200,
  categoryNameMinLength: 1,
  categoryNameMaxLength: 100,
  categoryDescriptionMaxLength: 8000,
  scoreMin: 0,
  scoreMax: 100,
  scoringVersionMaxLength: 32,
  reasoningMaxLength: 4000,
  relevanceScoreMin: 0,
  relevanceScoreMax: 10,
  referenceNotesMaxLength: 4000,
  referenceTitleMinLength: 3,
  referenceTitleMaxLength: 1000,
  referenceAuthorsMaxLength: 4000,
  referencePublicationMaxLength: 1000,
  referenceCitationKeyMinLength: 1,
  referenceCitationKeyMaxLength: 200,
  referenceDoiPattern: /^10\./,
  referenceUrlPattern: /^https?:\/\//,
  categoryMaxDepth: 3,
  maxLimit: 100,
  defaultLimit: 20,
  sortBy: IngredientSortField.Name,
  sortOrder: SortOrder.Asc,
} as const;

export const INGREDIENT_SLUG_RE = /^[a-z0-9-]+$/;

export const INGREDIENT_DEFAULTS = {
  sortBy: IngredientSortField.Name,
  sortOrder: SortOrder.Asc,
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;
