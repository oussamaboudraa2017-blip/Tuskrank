import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Label Transparency Strategy — scores based on:
 * - Guaranteed analysis presence
 * - Ingredient list completeness
 * - Third-party certifications
 * - Clear feeding guidelines
 *
 * Weight: 5% (default)
 */
export class LabelTransparencyStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.LabelTransparency;

  score(input: ProductScoringInput): CategoryScore {
    let score = 0;
    let dataPoints = 0;

    // Factor 1: Nutrition data present (guaranteed analysis)
    const hasNutrition = input.nutrition !== null;
    score += (hasNutrition ? 100 : 0) * 30;
    if (hasNutrition) dataPoints++;

    // Factor 2: Ingredients listed
    const hasIngredients = input.ingredients.length > 0;
    score += (hasIngredients ? 100 : 0) * 25;
    if (hasIngredients) dataPoints++;

    // Factor 3: Brand certifications
    const certScore = Math.min(100, input.brand.certifications.length * 30);
    score += certScore * 20;
    dataPoints++;

    // Factor 4: Has UPC and SKU
    const identScore = input.hasUpc && input.hasSku ? 100 : input.hasUpc ? 60 : 20;
    score += identScore * 15;
    dataPoints++;

    // Factor 5: Claims specificity
    const claimsScore = input.claims.length > 0 ? Math.min(100, input.claims.length * 25) : 20;
    score += claimsScore * 10;
    dataPoints++;

    const confidence = Math.min(1, dataPoints / 3);
    const reasoning = `Nutrition: ${hasNutrition ? 100 : 0}/100, Ingredients: ${hasIngredients ? 100 : 0}/100, Certs: ${certScore}/100, IDs: ${identScore}/100, Claims: ${claimsScore}/100`;

    return {
      category: this.category,
      score: Math.min(100, Math.max(0, Math.round(score))),
      confidence,
      reasoning,
      dataPoints,
    };
  }

  getWarnings(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringWarning> {
    const warnings: ScoringWarning[] = [];

    if (!input.nutrition) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.High,
        code: 'NO_GUARANTEED_ANALYSIS',
        message: 'Product does not list guaranteed analysis (nutrition data).',
      });
    }

    if (input.ingredients.length === 0) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.High,
        code: 'NO_INGREDIENT_LIST',
        message: 'Product does not list ingredients.',
      });
    }

    if (!input.hasUpc) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'NO_UPC',
        message: 'Product does not have a UPC code.',
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
        code: 'ADD_GUARANTEED_ANALYSIS',
        message: 'Add guaranteed analysis (protein, fat, fiber, moisture) to the product label.',
        estimatedImpact: 15,
      });
    }

    if (input.brand.certifications.length === 0) {
      recommendations.push({
        category: this.category,
        priority: 2,
        code: 'OBTAIN_CERTIFICATION',
        message: 'Obtain third-party certifications (AAFCO, USDA Organic, etc.).',
        estimatedImpact: 10,
      });
    }

    return recommendations;
  }
}
