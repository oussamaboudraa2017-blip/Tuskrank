import { ScoringCategory, ScoreGrade, ScoringVersion } from '../enums';
import { DEFAULT_SCORING_WEIGHTS, SCORING_BOUNDS, GRADE_BOUNDARIES } from '../constants';
import {
  CategoryScore,
  ScoringResult,
  ScoringConfig,
  ProductScoringInput,
  ScoringWarning,
  ScoringRecommendation,
} from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * ScoringEngine — composes multiple ScoringStrategy implementations
 * with configurable weights to produce a final score.
 *
 * Usage:
 *   const engine = new ScoringEngine(strategies);
 *   const result = engine.score(productInput, { weights: { ... } });
 */
export class ScoringEngine {
  private readonly strategies: Map<ScoringCategory, ScoringStrategy>;

  constructor(strategies: ScoringStrategy[]) {
    this.strategies = new Map(strategies.map((s) => [s.category, s]));
  }

  /**
   * Score a product using all registered strategies.
   */
  score(
    input: ProductScoringInput,
    config?: ScoringConfig,
  ): ScoringResult {
    const weights = this.resolveWeights(config?.weights);
    const includeReasoning = config?.includeReasoning ?? true;
    const maxWarnings = config?.maxWarnings ?? SCORING_BOUNDS.maxWarnings;
    const maxRecommendations = config?.maxRecommendations ?? SCORING_BOUNDS.maxRecommendations;

    // 1. Run all strategies
    const categoryScores: CategoryScore[] = [];
    const allWarnings: ScoringWarning[] = [];
    const allRecommendations: ScoringRecommendation[] = [];

    for (const [category, strategy] of this.strategies) {
      const categoryScore = strategy.score(input);
      categoryScores.push(categoryScore);

      const warnings = strategy.getWarnings(input, categoryScore);
      allWarnings.push(...warnings);

      const recommendations = strategy.getRecommendations(input, categoryScore);
      allRecommendations.push(...recommendations);
    }

    // 2. Compute weighted scores
    const weightedScores = {} as Record<ScoringCategory, number>;
    let overallScore = 0;
    let totalWeight = 0;

    for (const categoryScore of categoryScores) {
      const weight = weights[categoryScore.category] ?? 0;
      const weighted = categoryScore.score * weight;
      weightedScores[categoryScore.category] = Math.round(weighted * 100) / 100;
      overallScore += weighted;
      totalWeight += weight;
    }

    // Normalize if weights don't sum to 1.0
    if (totalWeight > 0 && totalWeight !== 1) {
      overallScore = overallScore / totalWeight;
    }

    overallScore = Math.round(Math.min(100, Math.max(0, overallScore)));

    // 3. Compute confidence
    const confidence = this.computeConfidence(categoryScores, weights);

    // 4. Derive grade
    const grade = this.scoreToGrade(overallScore);

    // 5. Trim warnings and recommendations
    const warnings = allWarnings
      .sort((a, b) => this.severityOrder(a.severity) - this.severityOrder(b.severity))
      .slice(0, maxWarnings);

    const recommendations = allRecommendations
      .sort((a, b) => a.priority - b.priority)
      .slice(0, maxRecommendations);

    // 6. Build result
    return {
      productId: input.productId,
      overallScore,
      grade,
      categories: includeReasoning
        ? categoryScores
        : categoryScores.map((c) => ({ ...c, reasoning: '' })),
      weightedScores,
      warnings,
      recommendations,
      confidence,
      version: config?.version ?? ScoringVersion.V1,
      computedAt: new Date().toISOString(),
    };
  }

  // ------------------------------------------------------------------ PRIVATE

  private resolveWeights(
    overrides?: Partial<Record<ScoringCategory, number>>,
  ): Record<ScoringCategory, number> {
    const weights = { ...DEFAULT_SCORING_WEIGHTS };

    if (overrides) {
      for (const [key, value] of Object.entries(overrides)) {
        if (key in weights && typeof value === 'number' && value >= 0) {
          (weights as Record<string, number>)[key] = value;
        }
      }
    }

    // Normalize weights to sum to 1.0
    const total = Object.values(weights).reduce((s, w) => s + w, 0);
    if (total > 0 && total !== 1) {
      for (const key of Object.keys(weights)) {
        (weights as Record<string, number>)[key] /= total;
      }
    }

    return weights;
  }

  private computeConfidence(
    categoryScores: CategoryScore[],
    weights: Record<ScoringCategory, number>,
  ): number {
    let weightedConfidence = 0;
    let totalWeight = 0;

    for (const cs of categoryScores) {
      const weight = weights[cs.category] ?? 0;
      weightedConfidence += cs.confidence * weight;
      totalWeight += weight;
    }

    return totalWeight > 0
      ? Math.round((weightedConfidence / totalWeight) * 100) / 100
      : 0;
  }

  private scoreToGrade(score: number): ScoreGrade {
    for (const boundary of GRADE_BOUNDARIES) {
      if (score >= boundary.min) {
        return boundary.grade as ScoreGrade;
      }
    }
    return ScoreGrade.F;
  }

  private severityOrder(severity: string): number {
    const order: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    };
    return order[severity] ?? 5;
  }
}
