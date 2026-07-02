import { ApiProperty } from '@nestjs/swagger';

/**
 * Full product detail returned by `GET /api/v1/products/:slug`.
 *
 * Includes everything the public product page renders server-side:
 * - Brand summary.
 * - Food form / primary protein source slugs.
 * - Optional image gallery (the first image is the primary image; explicit
 *   `isPrimary` keeps the contract clear if the first row is reordered).
 * - Optional tags and claims.
 * - Optional nutrition profile (single "current" snapshot).
 * - Optional ingredient panel (separate endpoint for performance).
 * - Aggregate counters (`ingredientCount`, `alternativesCount`) used by
 *   card UIs.
 */
import { BrandSummaryDto } from './brand-summary.dto';
import { ProductScoreSummaryDto } from './product-score-summary.dto';
import { ProductIngredientsPanelDto } from './product-ingredients.dto';

export class ProductImageDto {
  @ApiProperty({ description: 'Image uuid.', example: '...' })
  id!: string;

  @ApiProperty({
    description: 'Publicly accessible image URL.',
    example: 'https://cdn.tuskrank.com/products/1234/01.jpg',
  })
  publicUrl!: string;

  @ApiProperty({
    description: 'Alt text for accessibility.',
    example: 'Front of the bag',
    nullable: true,
  })
  altText!: string | null;

  @ApiProperty({
    description: 'Width in pixels (intrinsic).',
    example: 1600,
    nullable: true,
  })
  widthPx!: number | null;

  @ApiProperty({
    description: 'Height in pixels (intrinsic).',
    example: 1200,
    nullable: true,
  })
  heightPx!: number | null;

  @ApiProperty({
    description: 'Sort order relative to sibling images (0-based).',
    example: 0,
  })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether this is the canonical primary image.', example: true })
  isPrimary!: boolean;
}

export class ProductTagDto {
  @ApiProperty({ description: 'Tag uuid.', example: '...' })
  id!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'grain-free' })
  slug!: string;

  @ApiProperty({ description: 'Display name.', example: 'Grain Free' })
  name!: string;
}

export class ProductClaimDto {
  @ApiProperty({ description: 'Claim uuid.', example: '...' })
  id!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'non-gmo' })
  slug!: string;

  @ApiProperty({ description: 'Display name.', example: 'Non-GMO' })
  name!: string;

  @ApiProperty({
    description: 'Editorial evidence note (markdown-safe text).',
    example: 'Verified by supplier certificate USDA-1234.',
    nullable: true,
  })
  evidenceNote!: string | null;
}

export class ProductNutritionProfileDto {
  @ApiProperty({
    description: 'Calories per 100 grams.',
    example: 380,
    nullable: true,
  })
  kcalPer100g!: number | null;

  @ApiProperty({
    description: 'Calories per measured cup (volume-dependent).',
    example: 410,
    nullable: true,
  })
  kcalPerCup!: number | null;

  @ApiProperty({
    description: 'Moisture percentage (0–100).',
    example: 8,
    nullable: true,
  })
  moisturePct!: number | null;

  @ApiProperty({
    description: 'Effective-from date (inclusive). ISO 8601 date.',
    example: '2026-06-01',
  })
  effectiveFrom!: string;

  @ApiProperty({
    description: 'Effective-to date (inclusive). Null when currently in effect.',
    example: '2026-12-31',
    nullable: true,
  })
  effectiveTo!: string | null;

  @ApiProperty({
    description:
      "Source of the nutrition data. Mirrors `nutrition_source` ENUM in Postgres.",
    example: 'label',
    nullable: true,
  })
  source!: string | null;
}

export class ProductDetailDto {
  @ApiProperty({ description: 'Product uuid.', example: '...' })
  id!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'acme-adult-chicken' })
  slug!: string;

  @ApiProperty({ description: 'Display name.', example: 'Acme Adult Chicken' })
  name!: string;

  @ApiProperty({
    description: 'Marketing description.',
    example: 'Made with named animal protein...',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({ description: 'Embedded brand summary.', type: () => BrandSummaryDto })
  brand!: BrandSummaryDto;

  @ApiProperty({
    description: 'Food form slug.',
    example: 'kibble',
    nullable: true,
  })
  foodForm!: string | null;

  @ApiProperty({
    description: 'Primary protein source slug.',
    example: 'chicken',
    nullable: true,
  })
  primaryProteinSource!: string | null;

  @ApiProperty({
    description: 'UPC (Global Trade Item Number).',
    example: '012345678901',
    nullable: true,
  })
  upc!: string | null;

  @ApiProperty({
    description: 'Manufacturer SKU.',
    example: 'ACM-001',
    nullable: true,
  })
  sku!: string | null;

  @ApiProperty({
    description: 'Package size in grams.',
    example: 5000,
    nullable: true,
  })
  packageSizeGrams!: number | null;

  @ApiProperty({
    description: 'Human-readable package size label.',
    example: '5 lb',
    nullable: true,
  })
  packageSizeLabel!: string | null;

  @ApiProperty({ description: 'Whether the product is publicly listed.', example: true })
  isActive!: boolean;

  @ApiProperty({ description: 'Whether the product is currently published.', example: true })
  isPublished!: boolean;

  @ApiProperty({
    description: 'Publication timestamp (ISO 8601). Null when unpublished.',
    example: '2026-06-01T00:00:00Z',
    nullable: true,
  })
  publishedAt!: string | null;

  @ApiProperty({
    description: 'Image gallery.',
    type: () => [ProductImageDto],
  })
  images!: ProductImageDto[];

  @ApiProperty({
    description: 'Tags applied to this product.',
    type: () => [ProductTagDto],
  })
  tags!: ProductTagDto[];

  @ApiProperty({
    description: 'Marketing claims.',
    type: () => [ProductClaimDto],
  })
  claims!: ProductClaimDto[];

  @ApiProperty({
    description: 'Current nutrition profile (single snapshot). Null when absent.',
    type: () => ProductNutritionProfileDto,
    nullable: true,
  })
  nutritionProfile!: ProductNutritionProfileDto | null;

  @ApiProperty({
    description: 'Current scoring summary.',
    type: () => ProductScoreSummaryDto,
  })
  currentScore!: ProductScoreSummaryDto;

  @ApiProperty({
    description:
      'Embedded ordered ingredient panel. Loaded only by the detail endpoint. Null when skipped.',
    type: () => ProductIngredientsPanelDto,
    nullable: true,
  })
  ingredients!: ProductIngredientsPanelDto | null;

  @ApiProperty({ description: 'Number of ingredient rows on the panel.', example: 12 })
  ingredientCount!: number;

  @ApiProperty({ description: 'Number of healthier alternatives computed.', example: 4 })
  alternativesCount!: number;

  @ApiProperty({
    description: 'Created-at timestamp (ISO 8601).',
    example: '2025-12-01T00:00:00Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Last-updated timestamp (ISO 8601).',
    example: '2026-06-29T10:00:00Z',
  })
  updatedAt!: string;
}
