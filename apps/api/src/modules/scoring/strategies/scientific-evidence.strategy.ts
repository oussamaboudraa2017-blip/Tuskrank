import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Scientific Evidence Strategy — scores based on:
 * - Presence of peer-reviewed references
 * - Evidence type (supports vs refutes vs neutral)
 * - Clinical trial references
 *
 * Weight: 10% (default)
 */
export class ScientificEvidenceStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.ScientificEvidence;

  score(input: ProductScoringInput): CategoryScore {
    const { scientificReferences } = input;

    if (scientificReferences.length === 0) {
      return {
        category: this.category,
        score: 30,
        confidence: 0.3,
        reasoning: 'No scientific references provided. Base score assigned.',
        dataPoints: 0,
      };
    }

    let score = 0;

    // Factor 1: Number of references (more = better, diminishing returns)
    const refCountScore = Math.min(100, 30 + scientificReferences.length * 15);
    score += refCountScore * 40;

    // Factor 2: Evidence type distribution
    const supportsCount = scientificReferences.filter(
      (r) => r.evidenceType === 'supports',
    ).length;
    const refuteCount = scientificReferences.filter(
      (r) => r.evidenceType === 'refutes',
    ).length;
    const neutralCount = scientificReferences.filter(
      (r) => r.evidenceType === 'neutral',
    ).length;

    const total = scientificReferences.length;
    const supportRatio = total > 0 ? supportsCount / total : 0;
    const evidenceQualityScore = Math.round(supportRatio * 100);
    score += evidenceQualityScore * 40;

    // Factor 3: Diversity of evidence (not all from one source)
    const uniqueUrls = new Set(scientificReferences.map((r) => new URL(r.url).hostname)).size;
    const diversityScore = Math.min(100, uniqueUrls * 30);
    score += diversityScore * 20;

    const confidence = Math.min(1, total / 3);
    const reasoning = `${total} reference(s): ${supportsCount} supports, ${refuteCount} refutes, ${neutralCount} neutral. ${uniqueUrls} unique source(s).`;

    return {
      category: this.category,
      score: Math.min(100, Math.max(0, Math.round(score / 100 * 100))),
      confidence,
      reasoning,
      dataPoints: total,
    };
  }

  getWarnings(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringWarning> {
    const warnings: ScoringWarning[] = [];

    if (input.scientificReferences.length === 0) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'NO_REFERENCES',
        message: 'No scientific references provided for this product.',
      });
    }

    const refuteCount = input.scientificReferences.filter(
      (r) => r.evidenceType === 'refutes',
    ).length;
    if (refuteCount > 0) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Medium,
        code: 'REFUTING_EVIDENCE',
        message: `${refuteCount} reference(s) refute product claims.`,
      });
    }

    return warnings;
  }

  getRecommendations(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation> {
    const recommendations: ScoringRecommendation[] = [];

    if (input.scientificReferences.length < 3) {
      recommendations.push({
        category: this.category,
        priority: 1,
        code: 'ADD_REFERENCES',
        message: 'Add peer-reviewed scientific references to support product claims.',
        estimatedImpact: 15,
      });
    }

    return recommendations;
  }
}
