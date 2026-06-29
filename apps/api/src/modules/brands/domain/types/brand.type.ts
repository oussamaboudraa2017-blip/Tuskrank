import type { Uuid } from '@types';

/**
 * Wire-side types for the Brands module.
 */

/**
 * Full brand aggregate (detail view).
 */
export interface Brand {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
  readonly description: string | null;
  readonly logoImageUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;

  /** Joined: product count. */
  readonly productCount?: number;
  /** Joined: average overall score. */
  readonly avgOverallScore?: number | null;
  /** Joined: average quality score. */
  readonly avgQualityScore?: number | null;
  /** Joined: average safety score. */
  readonly avgSafetyScore?: number | null;
  /** Joined: average nutrition score. */
  readonly avgNutritionScore?: number | null;
  /** Joined: average transparency score. */
  readonly avgTransparencyScore?: number | null;
  /** Joined: open recall count. */
  readonly openRecallCount?: number;
}

/**
 * Lightweight brand list projection.
 */
export interface BrandSummary {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
  readonly logoImageUrl: string | null;
  readonly isActive: boolean;
  readonly productCount: number;
  readonly avgOverallScore: number | null;
}

/**
 * Brand with statistics (featured/top brands).
 */
export interface BrandWithStats extends BrandSummary {
  readonly avgQualityScore: number | null;
  readonly avgSafetyScore: number | null;
  readonly avgNutritionScore: number | null;
  readonly avgTransparencyScore: number | null;
  readonly openRecallCount: number;
}
