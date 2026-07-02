import { ApiProperty } from '@nestjs/swagger';

/**
 * Projection of the `product_scores` row (or `mv_top_rated_products` /
 * `v_top_rated_products` view) onto a wire-friendly summary.
 *
 * Lives in `dto/` because both `product-list.mapper.ts` and the
 * `ProductDetailDto` consume it. The mapper files only ever convert
 * `string`/`number` Prisma-style columns into the typed payload below.
 */
export class ProductScoreSummaryDto {
  @ApiProperty({ description: 'Overall 0-100.', example: 84.2, nullable: true })
  overall!: number | null;

  @ApiProperty({ description: 'Quality 0-100.', example: 88, nullable: true })
  quality!: number | null;

  @ApiProperty({ description: 'Safety 0-100.', example: 92, nullable: true })
  safety!: number | null;

  @ApiProperty({ description: 'Nutrition 0-100.', example: 80, nullable: true })
  nutrition!: number | null;

  @ApiProperty({ description: 'Transparency 0-100.', example: 76, nullable: true })
  transparency!: number | null;

  @ApiProperty({
    description: 'Scoring version this snapshot was computed under.',
    example: '2026.06',
    nullable: true,
  })
  scoringVersion!: string | null;
}

/**
 * Internal "score view" shape coming from a JOIN of `products` +
 * `product_scores` / `brands` / `food_forms` / `protein_sources`.
 *
 * The repository returns this; mappers consume it. Not a wire shape.
 */
export interface ProductScoreView {
  readonly overall: string | number | null;
  readonly quality: string | number | null;
  readonly safety: string | number | null;
  readonly nutrition: string | number | null;
  readonly transparency: string | number | null;
  readonly grade: string | null;
  readonly scoringVersion: string | null;
}
