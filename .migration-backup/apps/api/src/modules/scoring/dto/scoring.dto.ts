import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { SCORING_BOUNDS } from '../constants';

/**
 * Query DTO for scoring a single product.
 */
export class ScoreProductDto {
  @ApiProperty({ description: 'Product UUID to score.', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ description: 'Override ingredient quality weight (0–1).', example: 0.40 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  ingredientQualityWeight?: number;

  @ApiPropertyOptional({ description: 'Override transparency weight (0–1).', example: 0.25 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  transparencyWeight?: number;

  @ApiPropertyOptional({ description: 'Override nutritional balance weight (0–1).', example: 0.15 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  nutritionalBalanceWeight?: number;

  @ApiPropertyOptional({ description: 'Override processing level weight (0–1).', example: 0.10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  processingLevelWeight?: number;

  @ApiPropertyOptional({ description: 'Override scientific evidence weight (0–1).', example: 0.10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  scientificEvidenceWeight?: number;

  @ApiPropertyOptional({ description: 'Override controversial ingredients weight (0–1).', example: 0.05 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  controversialIngredientsWeight?: number;

  @ApiPropertyOptional({ description: 'Override label transparency weight (0–1).', example: 0.05 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  labelTransparencyWeight?: number;

  @ApiPropertyOptional({ description: 'Include detailed reasoning in results.', default: true })
  @IsOptional()
  includeReasoning?: boolean;
}

/**
 * Query DTO for bulk scoring.
 */
export class BulkScoreDto {
  @ApiProperty({
    description: 'Array of product UUIDs to score.',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(SCORING_BOUNDS.maxBulkSize)
  productIds!: string[];

  @ApiPropertyOptional({ description: 'Override scoring weights.', example: {} })
  @IsOptional()
  weights?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Include detailed reasoning in results.', default: true })
  @IsOptional()
  includeReasoning?: boolean;
}

/**
 * Query DTO for getting a product's current score.
 */
export class GetScoreQueryDto {
  @ApiProperty({ description: 'Product UUID.', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  productId!: string;
}
