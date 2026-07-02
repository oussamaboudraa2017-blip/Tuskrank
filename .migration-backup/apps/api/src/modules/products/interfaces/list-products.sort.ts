/**
 * Allowed sort fields for `GET /api/v1/products`.
 * Mirrors `docs/API_ROADMAP.md` §3.
 */
export const PRODUCT_SORT_FIELDS = [
  'created_at',
  'published_at',
  'overall_score',
  'name',
] as const;

export type ProductSortField = (typeof PRODUCT_SORT_FIELDS)[number];

export const PRODUCT_SORT_ORDERS = ['asc', 'desc'] as const;
export type ProductSortOrder = (typeof PRODUCT_SORT_ORDERS)[number];
