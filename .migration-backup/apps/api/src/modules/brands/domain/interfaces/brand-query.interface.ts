import type { BrandSortField, SortOrder } from '../enums';

/**
 * Composed query interfaces for the Brands module.
 */

export interface BrandListFilters {
  readonly q?: string;
  readonly countryCode?: string;
  readonly isActive?: boolean;
}

export interface BrandSort {
  readonly by: BrandSortField;
  readonly order: SortOrder;
}

export interface BrandPagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface BrandQuery {
  readonly filters: BrandListFilters;
  readonly sort: BrandSort;
  readonly pagination: BrandPagination;
}

export interface BrandSearchInput extends BrandListFilters {
  readonly q: string;
  readonly page?: number;
  readonly limit?: number;
}
