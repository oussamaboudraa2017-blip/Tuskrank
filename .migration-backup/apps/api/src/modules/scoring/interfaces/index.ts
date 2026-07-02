import { ScoringCategory } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';

/**
 * ScoringStrategy — the contract for each scoring category.
 *
 * Each strategy is responsible for:
 * 1. Extracting relevant data from ProductScoringInput
 * 2. Computing a score (0–100) with confidence (0–1)
 * 3. Generating warnings if issues are found
 * 4. Generating recommendations for improvement
 *
 * Strategies must be pure functions — no side effects, no I/O.
 */
export interface ScoringStrategy {
  /** The category this strategy scores. */
  readonly category: ScoringCategory;

  /**
   * Compute a score for the given product input.
   *
   * @param input - Raw product data needed for scoring.
   * @returns CategoryScore with score, confidence, and reasoning.
   */
  score(input: ProductScoringInput): CategoryScore;

  /**
   * Generate warnings based on the product data.
   * Called after scoring to flag potential concerns.
   *
   * @param input - Raw product data.
   * @param categoryScore - The score computed by this strategy.
   * @returns Array of warnings (may be empty).
   */
  getWarnings(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringWarning>;

  /**
   * Generate actionable recommendations.
   *
   * @param input - Raw product data.
   * @param categoryScore - The score computed by this strategy.
   * @returns Array of recommendations sorted by priority.
   */
  getRecommendations(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation>;
}

/**
 * ScoringEngine — composes multiple strategies with configurable weights.
 */
export interface ScoringEngine {
  /**
   * Score a product using all registered strategies.
   *
   * @param input - Raw product data.
   * @param config - Optional weight overrides.
   * @returns Complete ScoringResult with all category scores, warnings, and recommendations.
   */
  score(
    input: ProductScoringInput,
    config?: import('../types').ScoringConfig,
  ): import('../types').ScoringResult;
}
