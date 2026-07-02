import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Nutritional Balance Strategy — scores based on:
 * - Macronutrient ratios (protein, fat, fiber)
 * - Moisture and ash levels
 * - AAFCO minimum compliance
 * - Caloric density
 *
 * Weight: 15% (default)
 */
export class NutritionalBalanceStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.NutritionalBalance;

  score(input: ProductScoringInput): CategoryScore {
    const { nutrition } = input;

    if (!nutrition) {
      return {
        category: this.category,
        score: 0,
        confidence: 0.1,
        reasoning: 'No nutrition data available.',
        dataPoints: 0,
      };
    }

    let totalScore = 0;
    let dataPoints = 0;

    const proteinS = this.proteinScore(nutrition.proteinPercent);
    totalScore += proteinS * 30;
    if (nutrition.proteinPercent !== null) dataPoints++;

    const fatS = this.fatScore(nutrition.fatPercent);
    totalScore += fatS * 20;
    if (nutrition.fatPercent !== null) dataPoints++;

    const fiberS = this.fiberScore(nutrition.fiberPercent);
    totalScore += fiberS * 15;
    if (nutrition.fiberPercent !== null) dataPoints++;

    const moistureS = this.moistureScore(nutrition.moisturePercent, input.foodForm);
    totalScore += moistureS * 15;
    if (nutrition.moisturePercent !== null) dataPoints++;

    const ashS = this.ashScore(nutrition.ashPercent);
    totalScore += ashS * 10;
    if (nutrition.ashPercent !== null) dataPoints++;

    const kcalS = this.kcalScore(nutrition.kcal);
    totalScore += kcalS * 10;
    if (nutrition.kcal !== null) dataPoints++;

    const confidence = Math.min(1, dataPoints / 4);
    const reasoning = `Protein: ${proteinS}/100, Fat: ${fatS}/100, Fiber: ${fiberS}/100, Moisture: ${moistureS}/100, Ash: ${ashS}/100, Kcal: ${kcalS}/100`;

    return {
      category: this.category,
      score: Math.min(100, Math.max(0, Math.round(totalScore))),
      confidence,
      reasoning,
      dataPoints,
    };
  }

  getWarnings(
    input: ProductScoringInput,
    _categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringWarning> {
    const warnings: ScoringWarning[] = [];
    const { nutrition } = input;

    if (!nutrition) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.High,
        code: 'NO_NUTRITION',
        message: 'No nutrition data available for this product.',
      });
      return warnings;
    }

    if (nutrition.proteinPercent !== null && nutrition.proteinPercent < 18) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Medium,
        code: 'LOW_PROTEIN',
        message: `Protein level (${nutrition.proteinPercent}%) is below AAFCO minimum for adult dogs (18%).`,
      });
    }

    if (nutrition.fatPercent !== null && nutrition.fatPercent < 5) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Medium,
        code: 'LOW_FAT',
        message: `Fat level (${nutrition.fatPercent}%) is below AAFCO minimum for adult dogs (5%).`,
      });
    }

    if (nutrition.fiberPercent !== null && nutrition.fiberPercent > 10) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'HIGH_FIBER',
        message: `Fiber level (${nutrition.fiberPercent}%) is unusually high and may indicate filler ingredients.`,
      });
    }

    return warnings;
  }

  getRecommendations(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation> {
    const recommendations: ScoringRecommendation[] = [];

    if (!input.nutrition) {
      recommendations.push({
        category: this.category,
        priority: 1,
        code: 'ADD_NUTRITION',
        message: 'Provide complete nutritional analysis (guaranteed analysis) for accurate scoring.',
        estimatedImpact: 20,
      });
    }

    if (categoryScore.score < 60) {
      recommendations.push({
        category: this.category,
        priority: 2,
        code: 'IMPROVE_NUTRITION',
        message: 'Adjust macronutrient ratios to meet AAFCO minimum requirements.',
        estimatedImpact: 15,
      });
    }

    return recommendations;
  }

  private proteinScore(percent: number | null): number {
    if (percent === null) return 0;
    if (percent >= 26) return 100;
    if (percent >= 22) return 85;
    if (percent >= 18) return 70;
    if (percent >= 14) return 50;
    return 30;
  }

  private fatScore(percent: number | null): number {
    if (percent === null) return 0;
    if (percent >= 9 && percent <= 20) return 100;
    if (percent >= 5 && percent <= 25) return 70;
    if (percent > 25) return 40;
    return 30;
  }

  private fiberScore(percent: number | null): number {
    if (percent === null) return 0;
    if (percent >= 2 && percent <= 5) return 100;
    if (percent >= 1 && percent <= 8) return 70;
    if (percent > 10) return 30;
    return 50;
  }

  private moistureScore(percent: number | null, foodForm: string | null): number {
    if (percent === null) return 0;
    if (foodForm === 'wet' || foodForm === 'canned') {
      if (percent >= 70 && percent <= 85) return 100;
      return 60;
    }
    if (percent >= 8 && percent <= 12) return 100;
    if (percent >= 5 && percent <= 15) return 70;
    return 40;
  }

  private ashScore(percent: number | null): number {
    if (percent === null) return 0;
    if (percent >= 5 && percent <= 8) return 100;
    if (percent >= 3 && percent <= 10) return 70;
    if (percent > 12) return 30;
    return 50;
  }

  private kcalScore(kcal: number | null): number {
    if (kcal === null) return 0;
    if (kcal >= 300 && kcal <= 450) return 100;
    if (kcal >= 250 && kcal <= 500) return 70;
    return 40;
  }
}
