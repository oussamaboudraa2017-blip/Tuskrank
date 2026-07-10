import type { Uuid } from '@types';
import type { Brand, BrandSummary, BrandWithStats } from '../types';

/**
 * Pure mapping functions — DB wire format → domain types.
 * No side-effects, no logging.
 */

interface BrandRow {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly country_code: string | null;
  readonly website_url: string | null;
  readonly description: string | null;
  readonly logo_image_url: string | null;
  readonly is_active: boolean;
  readonly created_at: string | Date;
  readonly updated_at: string | Date;
  readonly deleted_at: string | Date | null;
  readonly product_count?: string | number;
  readonly avg_overall_score?: string | number | null;
  readonly avg_quality_score?: string | number | null;
  readonly avg_safety_score?: string | number | null;
  readonly avg_nutrition_score?: string | number | null;
  readonly avg_transparency_score?: string | number | null;
  readonly open_recall_count?: string | number;
}

const num = (v: string | number | null | undefined): number | null =>
  v === null || v === undefined ? null : Number(v);

/**
 * Map a database row to a full Brand entity.
 */
export function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    manufacturer: row.manufacturer,
    countryCode: row.country_code,
    websiteUrl: row.website_url,
    description: row.description,
    logoImageUrl: row.logo_image_url,
    isActive: row.is_active,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
    deletedAt: row.deleted_at instanceof Date ? row.deleted_at : row.deleted_at ? new Date(row.deleted_at) : null,
    productCount: row.product_count !== null && row.product_count !== undefined ? Number(row.product_count) : undefined,
    avgOverallScore: num(row.avg_overall_score),
    avgQualityScore: num(row.avg_quality_score),
    avgSafetyScore: num(row.avg_safety_score),
    avgNutritionScore: num(row.avg_nutrition_score),
    avgTransparencyScore: num(row.avg_transparency_score),
    openRecallCount: row.open_recall_count !== null && row.open_recall_count !== undefined ? Number(row.open_recall_count) : undefined,
  };
}

/**
 * Map a database row to a lightweight BrandSummary.
 */
export function toBrandSummary(row: BrandRow): BrandSummary {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    manufacturer: row.manufacturer,
    countryCode: row.country_code,
    websiteUrl: row.website_url,
    logoImageUrl: row.logo_image_url,
    isActive: row.is_active,
    productCount: row.product_count !== null && row.product_count !== undefined ? Number(row.product_count) : 0,
    avgOverallScore: num(row.avg_overall_score),
  };
}

/**
 * Map a database row to BrandWithStats.
 */
export function toBrandWithStats(row: BrandRow): BrandWithStats {
  return {
    ...toBrandSummary(row),
    avgQualityScore: num(row.avg_quality_score),
    avgSafetyScore: num(row.avg_safety_score),
    avgNutritionScore: num(row.avg_nutrition_score),
    avgTransparencyScore: num(row.avg_transparency_score),
    openRecallCount: row.open_recall_count !== null && row.open_recall_count !== undefined ? Number(row.open_recall_count) : 0,
  };
}

/**
 * Map a database row to BrandEntity (wire format for repository results).
 */
export function toBrandEntity(row: BrandRow): Brand {
  return toBrand(row);
}
