import type { Uuid } from '@types';
import {
  BreedSizeSlug,
  FoodFormSlug,
  LifeStageSlug,
  PetTypeSlug,
  ProductSortField,
  ProteinOrigin,
  SortOrder,
} from '../enums';
import { ProductLifecycleState } from '../enums/product.enums';

/**
 * Filter / search / sort contracts for the products domain.
 *
 * These shapes are *not* tied to a single DTO; controllers compose
 * DTOs from interfaces, services consume the composed `ProductQuery`.
 * Validation is the controller / DTO layer's job; the domain
 * interface only carries the shape.
 */

/* ==================================================================
 * Filter shape (used by `list`, `search`, `findFeatured`).
 * ================================================================== */

export interface ProductListFilters {
  /** Free-text search across `name` and ingredient names. */
  readonly q?: string;
  /** Filter to a single brand. */
  readonly brandId?: Uuid;
  /** Filter by pet type (one species). */
  readonly petType?: PetTypeSlug;
  /** Filter by life stage. */
  readonly lifeStage?: LifeStageSlug;
  /** Filter by breed size. */
  readonly breedSize?: BreedSizeSlug;
  /** Filter by food form. */
  readonly foodForm?: FoodFormSlug;
  /** Filter by primary protein origin. */
  readonly proteinOrigin?: ProteinOrigin;
  /** Minimum current overall score (0..100). */
  readonly minScore?: number;
  /** Maximum current overall score. */
  readonly maxScore?: number;
  /** Defaults to `true`. `false` includes soft-disabled products (admin). */
  readonly isActive?: boolean;
  /** Defaults to `true`. `false` includes unpublished drafts (admin). */
  readonly isPublished?: boolean;
  /** Filter by lifecycle state (admin only — public lists hide this). */
  readonly lifecycle?: ProductLifecycleState;
}

/* ==================================================================
 * Sort shape.
 * ================================================================== */

export interface ProductSort {
  readonly by: ProductSortField;
  readonly order: SortOrder;
}

/* ==================================================================
 * Pagination.
 * ================================================================== */

export interface ProductPagination {
  readonly page: number;
  readonly limit: number;
  /** Total rows BEFORE pagination (driver returns this). */
  readonly total: number;
}

/* ==================================================================
 * Composed query contract (replaces the Sprint 2B Task 1
 * `ListProductsParams` interface once Sprint 2B Task 2 lands).
 * ================================================================== */

export interface ProductQuery {
  readonly filters: ProductListFilters;
  readonly sort: ProductSort;
  readonly pagination: ProductPagination;
  /** Optional cursor-based pagination (Sprint 5+). */
  readonly cursor?: string;
}

/* ==================================================================
 * Search-specific input (full-text + facets).
 * ================================================================== */

export interface ProductSearchInput extends ProductListFilters {
  readonly q: string;
  /** Cap on returned rows (default = pagination.limit). */
  readonly top?: number;
}
