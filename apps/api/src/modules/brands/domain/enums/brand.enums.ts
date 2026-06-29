/**
 * Domain enums for the Brands module.
 */

/** Allowed sort fields for brand listing. */
export enum BrandSortField {
  CreatedAt = 'created_at',
  Name = 'name',
  ProductCount = 'product_count',
  AvgScore = 'avg_overall_score',
}

/** Sort order direction. */
export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}
