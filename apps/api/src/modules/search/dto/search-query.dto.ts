import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

/**
 * Query DTO for entity-specific search endpoints.
 *
 * `GET /api/v1/search/products?q=...`
 * `GET /api/v1/search/brands?q=...`
 * `GET /api/v1/search/ingredients?q=...`
 */
export class SearchQueryDto {
  @ApiProperty({ description: 'Search query string.', example: 'chicken' })
  @IsString()
  @Min(1)
  q!: string;

  @ApiPropertyOptional({ description: 'Filter by pet type slug.', enum: ['dog', 'cat', 'rabbit', 'bird', 'small_mammal'] })
  @IsString()
  @IsOptional()
  petType?: string;

  @ApiPropertyOptional({ description: 'Minimum current score (0-100), products only.', example: 60 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Result limit.', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination.', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({ description: 'Locale.', default: 'en-US' })
  @IsString()
  @IsOptional()
  locale?: string;
}

/**
 * Query DTO for global (multi-entity) search.
 *
 * `GET /api/v1/search/global?q=...`
 */
export class GlobalSearchQueryDto extends SearchQueryDto {
  @ApiPropertyOptional({
    description: 'Entity types to search (comma-separated). Default: all.',
    example: 'product,brand',
  })
  @IsString()
  @IsOptional()
  types?: string;
}

/**
 * Query DTO for autocomplete.
 *
 * `GET /api/v1/search/autocomplete?q=...`
 */
export class AutocompleteQueryDto {
  @ApiProperty({ description: 'Prefix to autocomplete.', example: 'chick' })
  @IsString()
  @Min(2)
  q!: string;

  @ApiPropertyOptional({ description: 'Entity types to search (comma-separated).', example: 'product,ingredient' })
  @IsString()
  @IsOptional()
  types?: string;

  @ApiPropertyOptional({ description: 'Result limit.', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Locale.', default: 'en-US' })
  @IsString()
  @IsOptional()
  locale?: string;
}
