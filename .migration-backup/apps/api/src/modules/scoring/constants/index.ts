import { ScoringCategory } from '../enums';

/**
 * Default weights for scoring categories.
 * Weights must sum to 1.0. Configurable at runtime via ScoringConfig.
 */
export const DEFAULT_SCORING_WEIGHTS: Record<ScoringCategory, number> = {
  [ScoringCategory.IngredientQuality]: 0.35,
  [ScoringCategory.Transparency]: 0.20,
  [ScoringCategory.NutritionalBalance]: 0.15,
  [ScoringCategory.ProcessingLevel]: 0.10,
  [ScoringCategory.ScientificEvidence]: 0.10,
  [ScoringCategory.ControversialIngredients]: 0.05,
  [ScoringCategory.LabelTransparency]: 0.05,
};

/**
 * Scoring engine constants.
 */
export const SCORING_BOUNDS = {
  /** Minimum score value. */
  minScore: 0,
  /** Maximum score value. */
  maxScore: 100,
  /** Maximum number of warnings per score. */
  maxWarnings: 20,
  /** Maximum number of recommendations per score. */
  maxRecommendations: 10,
  /** Default scoring version. */
  defaultVersion: '1.0.0',
  /** Minimum confidence threshold to produce a score. */
  minConfidence: 0.3,
  /** Maximum products per bulk scoring request. */
  maxBulkSize: 50,
} as const;

/**
 * Grade boundaries — maps numeric score to letter grade.
 * Boundary is inclusive (score >= threshold).
 */
export const GRADE_BOUNDARIES: ReadonlyArray<{ min: number; grade: string }> = [
  { min: 97, grade: 'A+' },
  { min: 93, grade: 'A' },
  { min: 90, grade: 'A-' },
  { min: 87, grade: 'B+' },
  { min: 83, grade: 'B' },
  { min: 80, grade: 'B-' },
  { min: 77, grade: 'C+' },
  { min: 73, grade: 'C' },
  { min: 70, grade: 'C-' },
  { min: 67, grade: 'D+' },
  { min: 63, grade: 'D' },
  { min: 60, grade: 'D-' },
  { min: 0, grade: 'F' },
];
