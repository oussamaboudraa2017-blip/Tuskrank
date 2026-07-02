import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ScoringRepository } from './repositories/scoring.repository';
import { ScoringEngine } from './engine/scoring.engine';
import { ScoringConfig, ScoringResult, CategoryScore, ScoringWarning } from './types';
import { ScoringCategory } from './enums';
import { SCORING_BOUNDS } from './constants';
import type { ProductScoringInput } from './types';

/**
 * Scoring Service — orchestrates the scoring engine.
 *
 * The service fetches product data, runs the engine, and persists
 * results atomically within a single transaction.
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  private readonly scoreAllLimit: number;

  constructor(
    private readonly repository: ScoringRepository,
    private readonly configService: ConfigService,
    private readonly engine: ScoringEngine,
  ) {
    this.scoreAllLimit = this.configService.get<number>(
      'SCORING_SCORE_ALL_LIMIT',
      1000,
    );
  }

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

  async getCurrentScore(productId: string): Promise<{
    id: string;
    overallScore: number;
    qualityScore: number | null;
    safetyScore: number | null;
    nutritionScore: number | null;
    transparencyScore: number | null;
    processingLevelScore: number | null;
    scientificEvidenceScore: number | null;
    labelAccuracyScore: number | null;
    scoringVersion: string;
    createdAt: string;
  } | null> {
    const row = await this.repository.getCurrentScore(productId);
    if (!row) return null;
    return {
      ...row,
      processingLevelScore: null,
      scientificEvidenceScore: null,
      labelAccuracyScore: null,
    };
  }

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

    const CONCURRENCY = 5;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const batch = ids.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.allSettled(
        batch.map((id) => this.scoreProduct(id, config, triggeredBy)),
      );

      for (let j = 0; j < batchResults.length; j++) {
        const r = batchResults[j];
        if (r.status === 'fulfilled') {
          scored++;
          results.push({ productId: batch[j], success: true });
        } else {
          failed++;
          results.push({
            productId: batch[j],
            success: false,
            error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
          });
        }
      }
    }

    return { scored, failed, results };
  }

  async scoreAll(
    config?: ScoringConfig,
    triggeredBy: string = 'scheduled',
  ): Promise<{ scored: number; failed: number }> {
    const ids = await this.repository.getProductIdsForBulk(this.scoreAllLimit);
    const result = await this.bulkScore([...ids], config, triggeredBy);
    return { scored: result.scored, failed: result.failed };
  }

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

  private async computeAndPersist(
    input: ProductScoringInput,
    config: ScoringConfig | undefined,
    triggeredBy: string,
  ): Promise<ScoringResult> {
    const result = this.engine.score(input, config);

    const qualityScore = this.getCategoryScore(result, ScoringCategory.IngredientQuality);
    const safetyScore = this.getCategoryScore(result, ScoringCategory.ControversialIngredients);
    const nutritionScore = this.getCategoryScore(result, ScoringCategory.NutritionalBalance);
    const transparencyScore = this.getCategoryScore(result, ScoringCategory.Transparency);

    try {
      const scoreId = await this.repository.saveProductScore({
        productId: input.productId,
        overallScore: result.overallScore,
        qualityScore,
        safetyScore,
        nutritionScore,
        transparencyScore,
        scoringVersion: result.version,
      });

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