import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScoringCategory, ScoreGrade, WarningSeverity } from '../enums';

/**
 * Wire shape for a category score.
 */
export class CategoryScoreDto {
  @ApiProperty({ description: 'Scoring category.', enum: ScoringCategory })
  category!: ScoringCategory;

  @ApiProperty({ description: 'Numeric score 0–100.', example: 78 })
  score!: number;

  @ApiProperty({ description: 'Confidence in this score (0–1).', example: 0.85 })
  confidence!: number;

  @ApiProperty({ description: 'Human-readable reasoning.', example: 'Protein: 85/100, Fat: 70/100' })
  reasoning!: string;

  @ApiProperty({ description: 'Number of data points used.', example: 4 })
  dataPoints!: number;
}

/**
 * Wire shape for a scoring warning.
 */
export class ScoringWarningDto {
  @ApiProperty({ description: 'Category that triggered the warning.', enum: ScoringCategory })
  category!: ScoringCategory;

  @ApiProperty({ description: 'Severity level.', enum: WarningSeverity })
  severity!: WarningSeverity;

  @ApiProperty({ description: 'Programmatic warning code.', example: 'LOW_PROTEIN' })
  code!: string;

  @ApiProperty({ description: 'Human-readable warning message.', example: 'Protein level is below AAFCO minimum.' })
  message!: string;
}

/**
 * Wire shape for a scoring recommendation.
 */
export class ScoringRecommendationDto {
  @ApiProperty({ description: 'Category this recommendation relates to.', enum: ScoringCategory })
  category!: ScoringCategory;

  @ApiProperty({ description: 'Priority (1 = highest).', example: 1 })
  priority!: number;

  @ApiProperty({ description: 'Programmatic recommendation code.', example: 'IMPROVE_INGREDIENTS' })
  code!: string;

  @ApiProperty({ description: 'Human-readable recommendation.', example: 'Use higher-quality protein sources.' })
  message!: string;

  @ApiProperty({ description: 'Estimated score improvement if implemented.', example: 15 })
  estimatedImpact!: number;
}

/**
 * Wire shape for a complete scoring result.
 */
export class ScoringResultDto {
  @ApiProperty({ description: 'Product UUID.', example: '550e8400-e29b-41d4-a716-446655440000' })
  productId!: string;

  @ApiProperty({ description: 'Overall weighted score 0–100.', example: 78 })
  overallScore!: number;

  @ApiProperty({ description: 'Letter grade.', enum: ScoreGrade, example: 'B+' })
  grade!: ScoreGrade;

  @ApiProperty({ description: 'Individual category scores.', type: [CategoryScoreDto] })
  categories!: CategoryScoreDto[];

  @ApiProperty({ description: 'Weighted score per category.', example: { ingredient_quality: 27.3, transparency: 16.0 } })
  weightedScores!: Record<string, number>;

  @ApiProperty({ description: 'Warnings flagged during scoring.', type: [ScoringWarningDto] })
  warnings!: ScoringWarningDto[];

  @ApiProperty({ description: 'Actionable recommendations.', type: [ScoringRecommendationDto] })
  recommendations!: ScoringRecommendationDto[];

  @ApiProperty({ description: 'Confidence in the overall score (0–1).', example: 0.85 })
  confidence!: number;

  @ApiProperty({ description: 'Scoring algorithm version.', example: '1.0.0' })
  version!: string;

  @ApiProperty({ description: 'ISO timestamp of when the score was computed.', example: '2026-06-29T12:00:00.000Z' })
  computedAt!: string;
}

/**
 * Wire shape for a current score (from DB, no recomputation).
 */
export class CurrentScoreDto {
  @ApiProperty({ description: 'Score record UUID.', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Overall score 0–100.', example: 78 })
  overallScore!: number;

  @ApiProperty({ description: 'Quality score.', example: 82, nullable: true })
  qualityScore!: number | null;

  @ApiProperty({ description: 'Safety score.', example: 75, nullable: true })
  safetyScore!: number | null;

  @ApiProperty({ description: 'Nutrition score.', example: 80, nullable: true })
  nutritionScore!: number | null;

  @ApiProperty({ description: 'Transparency score.', example: 70, nullable: true })
  transparencyScore!: number | null;

  @ApiProperty({ description: 'Scoring version.', example: '1.0.0' })
  scoringVersion!: string;

  @ApiProperty({ description: 'ISO timestamp when score was created.', example: '2026-06-29T12:00:00.000Z' })
  createdAt!: string;
}

/**
 * Wire shape for bulk scoring result.
 */
export class BulkScoreResultDto {
  @ApiProperty({ description: 'Number of products successfully scored.', example: 5 })
  scored!: number;

  @ApiProperty({ description: 'Number of products that failed scoring.', example: 1 })
  failed!: number;

  @ApiProperty({ description: 'Per-product results.', type: [Object] })
  results!: ReadonlyArray<{ productId: string; success: boolean; error?: string }>;
}
