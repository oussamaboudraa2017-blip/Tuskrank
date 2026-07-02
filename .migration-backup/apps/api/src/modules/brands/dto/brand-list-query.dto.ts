import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class BrandListQueryDto {
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
