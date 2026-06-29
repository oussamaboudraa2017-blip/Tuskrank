import { ApiProperty } from '@nestjs/swagger';

/**
 * Wire shape of a single search result item.
 */
export class SearchResultItemDto {
  @ApiProperty({ description: 'Entity uuid.', example: '...' })
  id!: string;

  @ApiProperty({ description: 'Entity type.', enum: ['product', 'brand', 'ingredient'] })
  entityType!: string;

  @ApiProperty({ description: 'Display name.', example: 'Acme Adult Chicken' })
  name!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'acme-adult-chicken' })
  slug!: string;

  @ApiProperty({ description: 'Relevance score (0..1).', example: 0.87 })
  score!: number;

  @ApiProperty({ description: 'Matched search strategy.', example: 'full_text' })
  matchedBy!: string;

  @ApiProperty({ description: 'Highlighted snippet.', example: '<em>Chicken</em> formula for adult dogs', nullable: true })
  snippet!: string | null;

  @ApiProperty({ description: 'Brand name (products only).', example: 'Acme Pet Foods', nullable: true })
  brandName!: string | null;

  @ApiProperty({ description: 'Brand slug (products only).', example: 'acme-pet-foods', nullable: true })
  brandSlug!: string | null;

  @ApiProperty({ description: 'Overall score (products only).', example: 84.2, nullable: true })
  overallScore!: number | null;

  @ApiProperty({ description: 'Letter grade (products only).', example: 'B+', nullable: true })
  grade!: string | null;

  @ApiProperty({ description: 'Primary image URL.', example: 'https://...', nullable: true })
  imageUrl!: string | null;
}

/**
 * Wire shape for entity-specific search results.
 */
export class SearchResultDto {
  @ApiProperty({ description: 'Original query.', example: 'chicken' })
  query!: string;

  @ApiProperty({ description: 'Total matching rows.' })
  total!: number;

  @ApiProperty({ description: 'Result items.', type: [SearchResultItemDto] })
  items!: SearchResultItemDto[];

  @ApiProperty({ description: 'Strategies used.', type: [String] })
  strategies!: string[];

  @ApiProperty({ description: 'Server latency in ms.', example: 12 })
  latencyMs!: number;
}

/**
 * Wire shape for global (multi-entity) search results.
 */
export class GlobalSearchResultDto {
  @ApiProperty({ description: 'Original query.', example: 'chicken' })
  query!: string;

  @ApiProperty({ description: 'Total matching rows across all entity types.' })
  total!: number;

  @ApiProperty({ description: 'Product results.', type: [SearchResultItemDto] })
  products!: SearchResultItemDto[];

  @ApiProperty({ description: 'Brand results.', type: [SearchResultItemDto] })
  brands!: SearchResultItemDto[];

  @ApiProperty({ description: 'Ingredient results.', type: [SearchResultItemDto] })
  ingredients!: SearchResultItemDto[];

  @ApiProperty({ description: 'Strategies used.', type: [String] })
  strategies!: string[];

  @ApiProperty({ description: 'Server latency in ms.', example: 18 })
  latencyMs!: number;
}

/**
 * Wire shape for autocomplete suggestions.
 */
export class AutocompleteSuggestionDto {
  @ApiProperty({ description: 'Suggested text.', example: 'chicken' })
  text!: string;

  @ApiProperty({ description: 'Source entity type.', enum: ['product', 'brand', 'ingredient'] })
  entityType!: string;

  @ApiProperty({ description: 'Result count for this suggestion.', example: 42 })
  count!: number;
}
