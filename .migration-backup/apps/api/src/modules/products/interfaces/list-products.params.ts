import type { Uuid } from '@types';
import type { ProductListFilters } from './list-products.filters';
import type { ProductSortField, ProductSortOrder } from './list-products.sort';

/**
 * Composite parameters returned by the (future) `ListProductsQueryDto`.
 * Controllers return an instance; services receive this exact shape
 * so that the persistence layer is not coupled to NestJS DTOs.
 *
 * Sensible defaults are NOT applied here — the DTO is responsible for
 * defaults. The repository sees what the DTO produced.
 */
export interface ListProductsParams {
  readonly filters: ProductListFilters;
  readonly sortBy?: ProductSortField;
  readonly sortOrder?: ProductSortOrder;
  readonly page: number;
  readonly limit: number;
  /** Resolved once, used twice: by the data query and the count query. */
  readonly requestId?: Uuid;
}
