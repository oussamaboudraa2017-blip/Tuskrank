import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Query DTO for listing ingredients.
 *
 * `GET /api/v1/ingredients`
 */
export class ListIngredientsQueryDto {
  @ApiPropertyOptional({ description: 'Search by name.', example: 'chicken' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category UUID.' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by animal-derived flag.' })
  @IsBoolean()
  @IsOptional()
  isAnimalDerived?: boolean;

  @ApiPropertyOptional({ description: 'Filter by common allergen flag.' })
  @IsBoolean()
  @IsOptional()
  isCommonAllergen?: boolean;

  @ApiPropertyOptional({ description: 'Filter by controversial flag.' })
  @IsBoolean()
  @IsOptional()
  isControversial?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active flag.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Minimum score.', example: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum score.', example: 90 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Page number.', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Result limit.', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field.', enum: ['created_at', 'name', 'canonical_name', 'score'], default: 'name' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order.', enum: ['asc', 'desc'], default: 'asc' })
  @IsString()
  @IsOptional()
  sortOrder?: string;
}

/**
 * Query DTO for searching ingredients.
 *
 * `GET /api/v1/ingredients/search?q=...`
 */
export class SearchIngredientsQueryDto {
  @ApiProperty({ description: 'Search query.', example: 'chicken' })
  @IsString()
  @MinLength(2)
  q!: string;

  @ApiPropertyOptional({ description: 'Page number.', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Result limit.', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}

/**
 * Create ingredient DTO.
 */
export class CreateIngredientDto {
  @ApiProperty({ description: 'Display name.', example: 'Chicken Meal' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-safe slug. Auto-generated from name if omitted.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'INCI name.', example: 'Chicken Meal' })
  @IsString()
  @IsOptional()
  inciName?: string;

  @ApiPropertyOptional({ description: 'Category UUID.' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Canonical (normalized) name.', example: 'chicken meal' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  canonicalName!: string;

  @ApiPropertyOptional({ description: 'Description.', example: 'Concentrated form of chicken.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is animal-derived.', default: false })
  @IsBoolean()
  @IsOptional()
  isAnimalDerived?: boolean;

  @ApiPropertyOptional({ description: 'Is a common allergen.', default: false })
  @IsBoolean()
  @IsOptional()
  isCommonAllergen?: boolean;

  @ApiPropertyOptional({ description: 'Is controversial.', default: false })
  @IsBoolean()
  @IsOptional()
  isControversial?: boolean;

  @ApiPropertyOptional({ description: 'Is active.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Update ingredient DTO.
 */
export class UpdateIngredientDto {
  @ApiPropertyOptional({ description: 'Display name.' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'URL-safe slug.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'INCI name.' })
  @IsString()
  @IsOptional()
  inciName?: string;

  @ApiPropertyOptional({ description: 'Category UUID.' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Canonical (normalized) name.' })
  @IsString()
  @IsOptional()
  canonicalName?: string;

  @ApiPropertyOptional({ description: 'Description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is animal-derived.' })
  @IsBoolean()
  @IsOptional()
  isAnimalDerived?: boolean;

  @ApiPropertyOptional({ description: 'Is a common allergen.' })
  @IsBoolean()
  @IsOptional()
  isCommonAllergen?: boolean;

  @ApiPropertyOptional({ description: 'Is controversial.' })
  @IsBoolean()
  @IsOptional()
  isControversial?: boolean;

  @ApiPropertyOptional({ description: 'Is active.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Create ingredient category DTO.
 */
export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name.', example: 'Proteins' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-safe slug. Auto-generated from name if omitted.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category UUID.' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sort order.', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is active.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Update ingredient category DTO.
 */
export class UpdateCategoryDto {
  @ApiPropertyOptional({ description: 'Category name.' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'URL-safe slug.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category UUID.' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Sort order.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is active.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Create ingredient score DTO.
 */
export class CreateScoreDto {
  @ApiProperty({ description: 'Score (0-100).', example: 85 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiProperty({ description: 'Letter grade.', example: 'B+' })
  @IsString()
  grade!: string;

  @ApiPropertyOptional({ description: 'Reasoning.' })
  @IsString()
  @IsOptional()
  reasoning?: string;

  @ApiProperty({ description: 'Scoring version.', example: '1.0' })
  @IsString()
  scoringVersion!: string;
}
