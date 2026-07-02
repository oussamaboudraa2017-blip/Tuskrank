import { ApiProperty } from '@nestjs/swagger';
import { BrandSummaryDto } from './brand-summary.dto';

/**
 * List-row shape used by `GET /api/v1/products`.
 *
 * Deliberately smaller than `ProductDetailDto`: list endpoints carry the
 * fields needed for cards, search results, and SEO summaries — not the
 * full nutrition / ingredient / image payload.
 *
 * The `currentScore` slot is included as the canonical inline aggregate so
 * clients don't need a second round-trip to score endpoints.
 */
export class ProductListItemDto {
  @ApiProperty({ description: 'Product uuid.', example: '...' })
  id!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'acme-adult-chicken' })
  slug!: string;

  @ApiProperty({ description: 'Display name.', example: 'Acme Adult Chicken' })
  name!: string;

  @ApiProperty({
    description: 'Brand summary. Embedded so list cards can render the brand label.',
    type: () => BrandSummaryDto,
  })
  brand!: BrandSummaryDto;

  @ApiProperty({
    description: 'Food form slug (kibble, wet, raw, ...).',
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
    description: 'Package size in grams, null when unknown.',
    example: 5000,
    nullable: true,
  })
  packageSizeGrams!: number | null;

  @ApiProperty({
    description: 'Human package size label (e.g. "5 lb").',
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
    description: 'Current overall score (0–100). Null when unscored.',
    example: 84.2,
    nullable: true,
  })
  currentScore!: number | null;

  @ApiProperty({
    description: 'Current overall letter grade (A+ … F). Null when unscored.',
    example: 'B+',
    nullable: true,
  })
  currentGrade!: string | null;

  @ApiProperty({
    description: 'Scoring version this score was computed under.',
    example: '2026.06',
    nullable: true,
  })
  scoringVersion!: string | null;
}
