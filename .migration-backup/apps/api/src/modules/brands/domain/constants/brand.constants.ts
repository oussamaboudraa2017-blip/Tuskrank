import { BrandSortField, SortOrder } from '../enums';

/**
 * Domain-level constants for the Brands module.
 *
 * Numeric bounds mirror the CHECK constraints in `database/schema.sql`.
 */

export const BRAND_BOUNDS = {
  nameMinLength: 1,
  nameMaxLength: 200,
  descriptionMaxLength: 8000,
  slugMinLength: 1,
  slugMaxLength: 200,
  manufacturerMaxLength: 200,
  countryCodeLength: 2,
  websiteUrlMaxLength: 2048,
  logoImageUrlMaxLength: 2048,
  maxLimit: 100,
  defaultLimit: 20,
  sortBy: BrandSortField.Name,
  sortOrder: SortOrder.Asc,
} as const;

export const BRAND_SLUG_RE = /^[a-z0-9-]+$/;
export const BRAND_COUNTRY_CODE_RE = /^[A-Z]{2}$/;

export const BRAND_DEFAULTS = {
  sortBy: BrandSortField.Name,
  sortOrder: SortOrder.Asc,
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;
