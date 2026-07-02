import { ApiProperty } from '@nestjs/swagger';

/**
 * Minimal inline shape used inside detail / panel / image responses.
 *
 * Distinct from the future `IngredientDetailDto` owned by the
 * Ingredients module; this DTO is shaped for the Products listing-row
 * payload only.
 */
export class ProductIngredientSnippetDto {
  @ApiProperty({ description: 'Ingredient uuid.', example: '...' })
  id!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'chicken' })
  slug!: string;

  @ApiProperty({ description: 'Display name.', example: 'Chicken' })
  name!: string;

  @ApiProperty({
    description: 'Current overall score for the ingredient (0-100), null when unscored.',
    example: 92,
    nullable: true,
  })
  currentScore!: number | null;

  @ApiProperty({
    description: 'Current letter grade (A+ … F), null when unscored.',
    example: 'A',
    nullable: true,
  })
  currentGrade!: string | null;
}

/**
 * Ordered ingredient panel entry, used in `GET /products/:slug/ingredients`.
 *
 * Position is 1-based; UI displays it inline ("Ingredients (in order)") and
 * optionally sorts by `position` ascending.
 */
export class ProductIngredientListItemDto {
  @ApiProperty({ description: '1-based position on the ingredient panel.', example: 1 })
  position!: number;

  @ApiProperty({
    description: 'Verbatim label from the package (e.g. "Chicken").',
    example: 'Chicken',
    nullable: true,
  })
  rawLabel!: string | null;

  @ApiProperty({ description: 'Whether this row is the primary protein source.', example: true })
  isPrimary!: boolean;

  @ApiProperty({
    description: 'Declared percentage (0-100). Null when not declared.',
    example: 28.5,
    nullable: true,
  })
  percentageValue!: number | null;

  @ApiProperty({
    description: 'Resolved ingredient, joined to the row.',
    type: () => ProductIngredientSnippetDto,
  })
  ingredient!: ProductIngredientSnippetDto;
}

export class ProductIngredientsPanelDto {
  @ApiProperty({
    description: 'Product slug this panel belongs to.',
    example: 'acme-adult-chicken',
  })
  slug!: string;

  @ApiProperty({
    description: 'Number of ingredient rows returned.',
    example: 12,
  })
  count!: number;

  @ApiProperty({
    description: 'Ingredient entries ordered by position.',
    type: () => [ProductIngredientListItemDto],
  })
  data!: ProductIngredientListItemDto[];
}
