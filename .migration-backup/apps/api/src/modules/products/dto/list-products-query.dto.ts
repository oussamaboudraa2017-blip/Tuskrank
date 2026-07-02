import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { APP_CONSTANTS } from '@common/constants/app.constants';

/**
 * Query DTO for `GET /api/v1/products` (public + admin list).
 *
 * Mirrors the Zod `ListProductsSchema` from `domain/validation/`
 * but uses `class-validator` for NestJS integration.
 */
export class ListProductsQueryDto {
  @ApiPropertyOptional({ description: 'Page number.', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = APP_CONSTANTS.PAGINATION.DEFAULT_PAGE;

  @ApiPropertyOptional({ description: 'Items per page.', default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(APP_CONSTANTS.PAGINATION.MAX_LIMIT)
  @IsOptional()
  limit?: number = APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Free-text search.', example: 'chicken' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by brand uuid.' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by pet type slug.', enum: ['dog', 'cat', 'rabbit', 'bird', 'small_mammal'] })
  @IsString()
  @IsOptional()
  petType?: string;

  @ApiPropertyOptional({ description: 'Filter by life stage slug.', enum: ['puppy', 'junior', 'adult', 'senior', 'geriatric'] })
  @IsString()
  @IsOptional()
  lifeStage?: string;

  @ApiPropertyOptional({ description: 'Filter by breed size slug.', enum: ['toy', 'small', 'medium', 'large', 'giant'] })
  @IsString()
  @IsOptional()
  breedSize?: string;

  @ApiPropertyOptional({ description: 'Filter by food form slug.' })
  @IsString()
  @IsOptional()
  foodForm?: string;

  @ApiPropertyOptional({ description: 'Filter by protein origin.', enum: ['animal', 'plant', 'insect', 'fungi', 'synthetic'] })
  @IsString()
  @IsOptional()
  proteinOrigin?: string;

  @ApiPropertyOptional({ description: 'Minimum overall score (0-100).', example: 60 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum overall score (0-100).', example: 95 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Sort field.', enum: ['created_at', 'published_at', 'overall_score', 'name'] })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction.', enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Include soft-deleted products (admin only).', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  includeSoftDeleted?: boolean;
}
