import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class IngredientListQueryDto {
  @ApiPropertyOptional({ description: 'Search query.' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID.' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by animal-derived.' })
  @IsBoolean()
  @IsOptional()
  isAnimalDerived?: boolean;

  @ApiPropertyOptional({ description: 'Filter by common allergen.' })
  @IsBoolean()
  @IsOptional()
  isCommonAllergen?: boolean;

  @ApiPropertyOptional({ description: 'Filter by controversial.' })
  @IsBoolean()
  @IsOptional()
  isControversial?: boolean;

  @ApiPropertyOptional({ description: 'Filter by active flag.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Minimum score filter.' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum score filter.' })
  @Type(() => Number)
  @IsInt()
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

  @ApiPropertyOptional({ description: 'Sort field.' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order.', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: string;
}
