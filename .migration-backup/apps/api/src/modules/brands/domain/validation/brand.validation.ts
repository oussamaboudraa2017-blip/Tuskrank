import { z } from 'zod';

import { BRAND_BOUNDS, BRAND_SLUG_RE, BRAND_COUNTRY_CODE_RE } from '../constants';
import { BrandSortField, SortOrder } from '../enums';

/* ------------------------------------------------------------------
 * Create brand
 * ------------------------------------------------------------------ */

export const createBrandBodySchema = z.object({
  name: z
    .string()
    .min(BRAND_BOUNDS.nameMinLength)
    .max(BRAND_BOUNDS.nameMaxLength),
  slug: z
    .string()
    .min(BRAND_BOUNDS.slugMinLength)
    .max(BRAND_BOUNDS.slugMaxLength)
    .regex(BRAND_SLUG_RE, 'slug must be lowercase alphanumeric with hyphens'),
  manufacturer: z
    .string()
    .max(BRAND_BOUNDS.manufacturerMaxLength)
    .optional()
    .nullable(),
  countryCode: z
    .string()
    .length(BRAND_BOUNDS.countryCodeLength)
    .regex(BRAND_COUNTRY_CODE_RE, 'must be uppercase ISO-3166 alpha-2')
    .optional()
    .nullable(),
  websiteUrl: z
    .string()
    .max(BRAND_BOUNDS.websiteUrlMaxLength)
    .url('must be a valid URL')
    .optional()
    .nullable(),
  description: z
    .string()
    .max(BRAND_BOUNDS.descriptionMaxLength)
    .optional()
    .nullable(),
  logoImageUrl: z
    .string()
    .max(BRAND_BOUNDS.logoImageUrlMaxLength)
    .url('must be a valid URL')
    .optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateBrandBody = z.infer<typeof createBrandBodySchema>;

/* ------------------------------------------------------------------
 * Update brand (PUT)
 * ------------------------------------------------------------------ */

export const updateBrandBodySchema = createBrandBodySchema.extend({
  isActive: z.boolean(),
});

export type UpdateBrandBody = z.infer<typeof updateBrandBodySchema>;

/* ------------------------------------------------------------------
 * Partial update brand (PATCH)
 * ------------------------------------------------------------------ */

export const patchBrandBodySchema = createBrandBodySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'at least one field must be provided' },
);

export type PatchBrandBody = z.infer<typeof patchBrandBodySchema>;

/* ------------------------------------------------------------------
 * Brand slug param
 * ------------------------------------------------------------------ */

export const brandSlugParamSchema = z.object({
  slug: z
    .string()
    .min(BRAND_BOUNDS.slugMinLength)
    .max(BRAND_BOUNDS.slugMaxLength)
    .regex(BRAND_SLUG_RE, 'slug must be lowercase alphanumeric with hyphens'),
});

/* ------------------------------------------------------------------
 * Brand list query
 * ------------------------------------------------------------------ */

export const brandListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(BRAND_BOUNDS.defaultLimit).catch(1),
  limit: z.coerce.number().int().positive().max(BRAND_BOUNDS.maxLimit).optional().default(BRAND_BOUNDS.defaultLimit).catch(20),
  q: z.string().optional(),
  countryCode: z
    .string()
    .length(BRAND_BOUNDS.countryCodeLength)
    .regex(BRAND_COUNTRY_CODE_RE)
    .optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sortBy: z.nativeEnum(BrandSortField).optional().default(BrandSortField.Name).catch(BrandSortField.Name),
  sortOrder: z.nativeEnum(SortOrder).optional().default(SortOrder.Asc).catch(SortOrder.Asc),
});

export type BrandListQuery = z.infer<typeof brandListQuerySchema>;
