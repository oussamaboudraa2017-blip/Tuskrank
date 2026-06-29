import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ScoringRepository } from './repositories/scoring.repository';
import { ScoringEngine } from './engine/scoring.engine';
import { ScoringConfig, ScoringResult, ProductScoringInput, CategoryScore } from './types';
import { ScoringCategory } from './enums';
import { SCORING_BOUNDS } from './constants';
import {
  IngredientQualityStrategy,
  TransparencyStrategy,
  NutritionalBalanceStrategy,
  ProcessingLevelStrategy,
  ControversialIngredientsStrategy,
  ScientificEvidenceStrategy,
  LabelTransparencyStrategy,
} from './strategies';

/**
 * Scoring Service — orchestrates the scoring engine.
 *
 * Responsibilities:
 * 1. Fetch product data via repository
 * 2. Run scoring engine with configurable weights
 * 3. Persist results to product_scores + score_history
 * 4. Return complete scoring results
 *
 * The service never calls the database directly for scoring logic —
 * all computation goes through the ScoringEngine.
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly engine: ScoringEngine;

  constructor(private readonly repository: ScoringRepository) {
    this.engine = new ScoringEngine([
      new IngredientQualityStrategy(),
      new TransparencyStrategy(),
      new NutritionalBalanceStrategy(),
      new ProcessingLevelStrategy(),
      new ControversialIngredientsStrategy(),
      new ScientificEvidenceStrategy(),
      new LabelTransparencyStrategy(),
    ]);
  }

  /* ================================================================
   * Score a single product
   * ================================================================ */

  /**
   * Compute and persist a score for a single product.
   *
   * @param productId - UUID of the product to score.
   * @param config - Optional weight overrides and scoring options.
   * @param triggeredBy - Why this score was computed (for audit trail).
   * @returns Complete ScoringResult with all category scores.
   * @throws NotFoundException if product not found.
   */
  async scoreProduct(
    productId: string,
    config?: ScoringConfig,
    triggeredBy: string = 'manual',
  ): Promise<ScoringResult> {
    const input = await this.repository.getProductScoringInput(productId);
    if (!input) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return this.computeAndPersist(input, config, triggeredBy);
  }

  /* ================================================================
   * Get existing score
   * ================================================================ */

  /**
   * Get the current score for a product (from DB, no recomputation).
   */
  async getCurrentScore(productId: string): Promise<{
    id: string;
    overallScore: number;
    qualityScore: number | null;
    safetyScore: number | null;
    nutritionScore: number | null;
    transparencyScore: number | null;
    scoringVersion: string;
    createdAt: string;
  } | null> {
    return this.repository.getCurrentScore(productId);
  }

  /* ================================================================
   * Bulk scoring
   * ================================================================ */

  /**
   * Score multiple products in a batch.
   * Returns results for each product (may include errors for individual failures).
   */
  async bulkScore(
    productIds: string[],
    config?: ScoringConfig,
    triggeredBy: string = 'scheduled',
  ): Promise<{
    scored: number;
    failed: number;
    results: ReadonlyArray<{ productId: string; success: boolean; error?: string }>;
  }> {
    const limit = Math.min(productIds.length, SCORING_BOUNDS.maxBulkSize);
    const ids = productIds.slice(0, limit);

    let scored = 0;
    let failed = 0;
    const results: Array<{ productId: string; success: boolean; error?: string }> = [];

    for (const id of ids) {
      try {
        await this.scoreProduct(id, config, triggeredBy);
        scored++;
        results.push({ productId: id, success: true });
      } catch (err) {
        failed++;
        results.push({
          productId: id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return { scored, failed, results };
  }

  /**
   * Score all active, published products (scheduled job).
   */
  async scoreAll(
    config?: ScoringConfig,
    triggeredBy: string = 'scheduled',
  ): Promise<{ scored: number; failed: number }> {
    const ids = await this.repository.getProductIdsForBulk(1000);
    const result = await this.bulkScore([...ids], config, triggeredBy);
    return { scored: result.scored, failed: result.failed };
  }

  /* ================================================================
   * Preview (no persistence)
   * ================================================================ */

  /**
   * Compute a score without persisting it (preview/dry-run).
   */
  async previewScore(
    productId: string,
    config?: ScoringConfig,
  ): Promise<ScoringResult> {
    const input = await this.repository.getProductScoringInput(productId);
    if (!input) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    return this.engine.score(input, config);
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  private async computeAndPersist(
    input: ProductScoringInput,
    config: ScoringConfig | undefined,
    triggeredBy: string,
  ): Promise<ScoringResult> {
    const result = this.engine.score(input, config);

    // Map category scores to DB columns
    const qualityScore = this.getCategoryScore(result, ScoringCategory.IngredientQuality);
    const safetyScore = this.getCategoryScore(result, ScoringCategory.ControversialIngredients);
    const nutritionScore = this.getCategoryScore(result, ScoringCategory.NutritionalBalance);
    const transparencyScore = this.getCategoryScore(result, ScoringCategory.Transparency);

    try {
      // Persist to product_scores
      await this.repository.saveProductScore({
        productId: input.productId,
        overallScore: result.overallScore,
        qualityScore,
        safetyScore,
        nutritionScore,
        transparencyScore,
        scoringVersion: result.version,
      });

      // Append to score_history
      await this.repository.saveScoreHistory({
        productId: input.productId,
        overallScore: result.overallScore,
        qualityScore,
        safetyScore,
        nutritionScore,
        transparencyScore,
        scoringVersion: result.version,
        triggeredBy,
        notes: `Score: ${result.overallScore} (${result.grade}). Confidence: ${result.confidence}. Warnings: ${result.warnings.length}.`,
      });
    } catch (err) {
      this.logger.error(`Failed to persist score for ${input.productId}: ${err}`);
      // Still return the computed score even if persistence fails
    }

    return result;
  }

  private getCategoryScore(
    result: ScoringResult,
    category: ScoringCategory,
  ): number | null {
    const cs = result.categories.find((c: CategoryScore) => c.category === category);
    return cs?.score ?? null;
  }
}
