import type { Uuid } from '@types';
import type { IngredientSortField, SortOrder } from '../enums';

/**
 * Composed query interfaces for the Ingredients module.
 *
 * The service builds these from controller DTOs; the repository
 * consumes them. Never exposed on the wire.
 */

export interface IngredientListFilters {
  readonly q?: string;
  readonly categoryId?: Uuid;
  readonly isAnimalDerived?: boolean;
  readonly isCommonAllergen?: boolean;
  readonly isControversial?: boolean;
  readonly isActive?: boolean;
  readonly minScore?: number;
  readonly maxScore?: number;
}

export interface IngredientSort {
  readonly by: IngredientSortField;
  readonly order: SortOrder;
}

export interface IngredientPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface IngredientQuery {
  readonly filters: IngredientListFilters;
  readonly sort: IngredientSort;
  readonly pagination: IngredientPagination;
}

export interface IngredientSearchInput extends IngredientListFilters {
  readonly q: string;
  readonly page?: number;
  readonly limit?: number;
}
