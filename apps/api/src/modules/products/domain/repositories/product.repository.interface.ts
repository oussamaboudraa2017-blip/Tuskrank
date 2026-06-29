import type { Uuid } from '@types';
import type {
  Product,
  ProductSummary,
} from '../types';
import type {
  ProductQuery,
  ProductSearchInput,
} from '../interfaces/product-query.interface';

/**
 * Repository contract for the Products domain.
 *
 * The interface is the only thing the products service depends on; the
 * concrete implementation (`@modules/products/repositories/products.repository.ts`)
 * implements it against the pg pool.
 *
 * Methods are organised by capability (read-side, count, search,
 * mutations). No implementation lives in this file.
 *
 * Conventions:
 *   - All methods return `Promise<...>` (no callbacks).
 *   - `null` means "not found" — never throw from a read method; throw
 *     typed `ProductNotFoundError` (etc.) from inside a higher-level
 *     service. The repository is a passive data accessor.
 *   - All inputs are domain types; no DTOs / no DB types.
 *   - Soft-deleted rows are never returned unless `includeSoftDeleted`
 *     is explicitly `true` (admin).
 */
export interface ProductRepository {
  /* ==================================================================
   * Read
   * ================================================================== */

  /** Fetch a product by id, joined with brand / food form / score. */
  findById(
    id: Uuid,
    options?: { includeSoftDeleted?: boolean; includeUnpublished?: boolean },
  ): Promise<Product | null>;

  /** Fetch a product by (brand, slug) — primary public lookup. */
  findBySlug(
    slug: string,
    options?: { includeSoftDeleted?: boolean; includeUnpublished?: boolean },
  ): Promise<Product | null>;

  /**
   * Paginated list. Soft-deleted rows are excluded unless
   * `includeSoftDeleted: true` (admin).
   */
  findMany(query: ProductQuery): Promise<ReadonlyArray<ProductSummary>>;

  /**
   * Featured products (a curated subset of the catalog).
   *
   * The definition of "featured" is owned by the products module —
   * the repository returns a `featured: true` flag (Sprint 9+) or
   * falls back to top-rated published products for now.
   */
  findFeatured(
    pagination: { page: number; limit: number },
    options?: { petType?: string },
  ): Promise<ReadonlyArray<ProductSummary>>;

  /**
   * Top-rated products — backed by `mv_top_rated_products` materialised
   * view in `database/schema.sql`.
   */
  findTopRated(
    pagination: { page: number; limit: number },
    options?: { petType?: string; minScore?: number },
  ): Promise<ReadonlyArray<ProductSummary>>;

  /**
   * Full-text search across `products.name` and joined
   * `product_ingredients.raw_label`. Returns ranked results.
   */
  search(input: ProductSearchInput): Promise<ReadonlyArray<ProductSummary>>;

  /* ==================================================================
   * Counts
   * ================================================================== */

  /**
   * Count rows that would be returned by `findMany(query)`.
   * Used to build the pagination meta block.
   */
  count(query: ProductQuery): Promise<number>;

  /* ==================================================================
   * Existence
   * ================================================================== */

  /** True if a product with the given id exists (respects soft-delete). */
  exists(id: Uuid): Promise<boolean>;

  /** True if the (brand, slug) pair is taken. */
  existsByBrandSlug(brandId: Uuid, slug: string, excludeId?: Uuid): Promise<boolean>;

  /** True if the UPC is in use. */
  existsByUpc(upc: string, excludeId?: Uuid): Promise<boolean>;

  /** True if the (brand, sku) pair is taken. */
  existsByBrandSku(brandId: Uuid, sku: string, excludeId?: Uuid): Promise<boolean>;
}
