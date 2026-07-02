import type { Uuid } from '@types';
import type { Brand, BrandSummary, BrandWithStats } from '../domain';

/**
 * BrandEntity — the Brands module's public entity contract.
 */
export type BrandEntity = Brand;
export type BrandSummaryEntity = BrandSummary;
export type BrandWithStatsEntity = BrandWithStats;

/**
 * Brand table row type (DB wire format).
 */
export interface BrandRow {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly country_code: string | null;
  readonly website_url: string | null;
  readonly description: string | null;
  readonly logo_image_url: string | null;
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly deleted_at: Date | null;
}
