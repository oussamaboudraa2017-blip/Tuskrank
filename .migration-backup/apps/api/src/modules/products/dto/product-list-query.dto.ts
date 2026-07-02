import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ProductListQueryDto {
  @ApiPropertyOptional({ description: 'Search query.' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by brand ID.' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by pet type slug.' })
  @IsString()
  @IsOptional()
  petType?: string;

  @ApiPropertyOptional({ description: 'Filter by life stage slug.' })
  @IsString()
  @IsOptional()
  lifeStage?: string;

  @ApiPropertyOptional({ description: 'Filter by breed size slug.' })
  @IsString()
  @IsOptional()
  breedSize?: string;

  @ApiPropertyOptional({ description: 'Filter by food form slug.' })
  @IsString()
  @IsOptional()
  foodForm?: string;

  @ApiPropertyOptional({ description: 'Filter by protein origin.' })
  @IsString()
  @IsOptional()
  proteinOrigin?: string;

  @ApiPropertyOptional({ description: 'Minimum overall score.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  minScore?: number;

  @ApiPropertyOptional({ description: 'Maximum overall score.' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  maxScore?: number;

  @ApiPropertyOptional({ description: 'Filter by active flag.' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by published flag.' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

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

  @ApiPropertyOptional({ description: 'Cursor for cursor-based pagination.' })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiPropertyOptional({ description: 'Sort field.', default: 'published_at' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order.', enum: ['asc', 'desc'], default: 'desc' })
  @IsString()
  @IsOptional()
  sortOrder?: string;
}
