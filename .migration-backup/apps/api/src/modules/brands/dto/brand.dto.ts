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
  IsUrl,
} from 'class-validator';

/**
 * Query DTO for listing brands.
 *
 * `GET /api/v1/brands`
 */
export class ListBrandsQueryDto {
  @ApiPropertyOptional({ description: 'Search by name.', example: 'Orijen' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by ISO-3166 alpha-2 country code.', example: 'US' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Filter by active flag.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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

  @ApiPropertyOptional({ description: 'Sort field.', enum: ['created_at', 'name', 'product_count', 'avg_score'], default: 'name' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order.', enum: ['asc', 'desc'], default: 'asc' })
  @IsString()
  @IsOptional()
  sortOrder?: string;
}

/**
 * Query DTO for searching brands.
 *
 * `GET /api/v1/brands/search?q=...`
 */
export class SearchBrandsQueryDto {
  @ApiProperty({ description: 'Search query.', example: 'Orijen' })
  @IsString()
  @MinLength(2)
  q!: string;

  @ApiPropertyOptional({ description: 'Filter by country code.' })
  @IsString()
  @IsOptional()
  countryCode?: string;

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
 * Create brand DTO.
 */
export class CreateBrandDto {
  @ApiProperty({ description: 'Brand name.', example: 'Orijen' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-safe slug. Auto-generated from name if omitted.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name.', example: 'Champion Petfoods' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'ISO-3166 alpha-2 country code.', example: 'CA' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Official website URL.' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Brand description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo image URL.' })
  @IsUrl()
  @IsOptional()
  logoImageUrl?: string;

  @ApiPropertyOptional({ description: 'Is active.', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Update brand DTO (PUT — all fields required).
 */
export class UpdateBrandDto {
  @ApiProperty({ description: 'Brand name.' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'URL-safe slug.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name.' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'ISO-3166 alpha-2 country code.' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Official website URL.' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Brand description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo image URL.' })
  @IsUrl()
  @IsOptional()
  logoImageUrl?: string;

  @ApiPropertyOptional({ description: 'Is active.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Partial update brand DTO (PATCH).
 */
export class PatchBrandDto {
  @ApiPropertyOptional({ description: 'Brand name.' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'URL-safe slug.' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Manufacturer name.' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({ description: 'ISO-3166 alpha-2 country code.' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ description: 'Official website URL.' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ description: 'Brand description.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Logo image URL.' })
  @IsUrl()
  @IsOptional()
  logoImageUrl?: string;

  @ApiPropertyOptional({ description: 'Is active.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
