import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Processing Level Strategy — scores based on:
 * - Food form (raw > dehydrated > kibble > canned)
 * - Heat processing indicators
 * - Use of rendered meals vs whole meats
 *
 * Weight: 10% (default)
 */
export class ProcessingLevelStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.ProcessingLevel;

  private static FORM_SCORES: Record<string, number> = {
    raw: 100,
    dehydrated: 90,
    freeze_dried: 85,
    air_dried: 80,
    baked: 70,
    kibble: 55,
    canned: 50,
    wet: 50,
    semi_moist: 45,
    treats: 40,
  };

  score(input: ProductScoringInput): CategoryScore {
    let score = 0;
    let dataPoints = 0;

    // Factor 1: Food form
    const formScore = this.foodFormScore(input.foodForm);
    score += formScore * 50;
    if (input.foodForm) dataPoints++;

    // Factor 2: Ingredient processing indicators
    const processingScore = this.ingredientProcessingScore(input.ingredients);
    score += processingScore * 30;
    dataPoints++;

    // Factor 3: Named meat vs meal
    const meatScore = this.namedMeatScore(input.ingredients);
    score += meatScore * 20;
    dataPoints++;

    const confidence = Math.min(1, dataPoints / 2);
    const reasoning = `Food form: ${formScore}/100, Processing: ${processingScore}/100, Meat quality: ${meatScore}/100`;

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
    _categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringWarning> {
    const warnings: ScoringWarning[] = [];

    if (!input.foodForm) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'NO_FOOD_FORM',
        message: 'Food form not specified.',
      });
    }

    const hasMeal = input.ingredients.some(
      (i) => i.name.toLowerCase().includes('meal') && !i.name.toLowerCase().includes('fish meal'),
    );
    if (hasMeal) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'MEAL_INGREDIENTS',
        message: 'Product contains rendered meal ingredients, which may indicate higher processing.',
      });
    }

    return warnings;
  }

  getRecommendations(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation> {
    const recommendations: ScoringRecommendation[] = [];

    if (categoryScore.score < 50) {
      recommendations.push({
        category: this.category,
        priority: 1,
        code: 'REDUCE_PROCESSING',
        message: 'Consider using less processed formats (dehydrated, air-dried) to preserve nutrient integrity.',
        estimatedImpact: 10,
      });
    }

    return recommendations;
  }

  private foodFormScore(form: string | null): number {
    if (!form) return 50;
    return ProcessingLevelStrategy.FORM_SCORES[form.toLowerCase()] ?? 50;
  }

  private ingredientProcessingScore(ingredients: ProductScoringInput['ingredients']): number {
    if (ingredients.length === 0) return 50;
    const processingTerms = ['meal', 'by-product', 'powder', 'digest', 'hydrolysate'];
    let processedCount = 0;
    for (const ing of ingredients) {
      const name = ing.name.toLowerCase();
      if (processingTerms.some((t) => name.includes(t))) processedCount++;
    }
    const ratio = processedCount / ingredients.length;
    return Math.round(Math.max(0, 100 - ratio * 100));
  }

  private namedMeatScore(ingredients: ProductScoringInput['ingredients']): number {
    if (ingredients.length === 0) return 0;
    const first = ingredients[0];
    if (!first) return 0;
    const name = first.name.toLowerCase();
    if (first.isAnimalDerived && !name.includes('meal') && !name.includes('by-product')) {
      return 100;
    }
    if (first.isAnimalDerived) return 60;
    return 30;
  }
}
