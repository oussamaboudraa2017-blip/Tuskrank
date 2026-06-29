import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Controversial Ingredients Strategy — scores based on:
 * - Presence of fillers (corn, wheat, soy)
 * - Artificial colors, flavors, preservatives
 * - By-products
 * - Sweeteners
 *
 * Weight: 5% (default)
 */
export class ControversialIngredientsStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.ControversialIngredients;

  private static FILLERS = ['corn', 'wheat', 'soy', 'cellulose', 'powdered cellulose', 'corn gluten'];
  private static ARTIFICIAL_COLORS = ['red 40', 'blue 2', 'yellow 5', 'yellow 6', 'red 3', 'artificial color'];
  private static ARTIFICIAL_PRESERVATIVES = ['bha', 'bht', 'ethoxyquin', 'propylene glycol'];
  private static SWEETENERS = ['sugar', 'corn syrup', 'molasses', 'caramel'];

  score(input: ProductScoringInput): CategoryScore {
    const { ingredients } = input;

    if (ingredients.length === 0) {
      return {
        category: this.category,
        score: 50,
        confidence: 0.1,
        reasoning: 'No ingredients to evaluate for controversial content.',
        dataPoints: 0,
      };
    }

    let penalties = 0;
    let dataPoints = 0;

    // Check for fillers
    const fillerCount = this.countMatches(ingredients, ControversialIngredientsStrategy.FILLERS);
    penalties += fillerCount * 15;
    dataPoints++;

    // Check for artificial colors
    const colorCount = this.countMatches(ingredients, ControversialIngredientsStrategy.ARTIFICIAL_COLORS);
    penalties += colorCount * 20;
    dataPoints++;

    // Check for artificial preservatives
    const preservativeCount = this.countMatches(ingredients, ControversialIngredientsStrategy.ARTIFICIAL_PRESERVATIVES);
    penalties += preservativeCount * 25;
    dataPoints++;

    // Check for sweeteners
    const sweetenerCount = this.countMatches(ingredients, ControversialIngredientsStrategy.SWEETENERS);
    penalties += sweetenerCount * 15;
    dataPoints++;

    // Check for controversial flags from DB
    const controversialCount = ingredients.filter((i) => i.isControversial).length;
    penalties += controversialCount * 10;
    dataPoints++;

    const score = Math.max(0, 100 - penalties);
    const confidence = Math.min(1, dataPoints / 3);

    const parts: string[] = [];
    if (fillerCount > 0) parts.push(`${fillerCount} filler(s)`);
    if (colorCount > 0) parts.push(`${colorCount} artificial color(s)`);
    if (preservativeCount > 0) parts.push(`${preservativeCount} artificial preservative(s)`);
    if (sweetenerCount > 0) parts.push(`${sweetenerCount} sweetener(s)`);
    if (controversialCount > 0) parts.push(`${controversialCount} controversial ingredient(s)`);
    const reasoning = parts.length > 0
      ? `Penalties: ${parts.join(', ')}. Base score: 100 - ${penalties} = ${score}`
      : 'No controversial ingredients detected.';

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

    if (categoryScore.score < 50) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Medium,
        code: 'CONTROVERSIAL_INGREDIENTS',
        message: 'Product contains controversial ingredients that may affect quality.',
      });
    }

    const hasArtificial = input.ingredients.some(
      (i) =>
        ControversialIngredientsStrategy.ARTIFICIAL_COLORS.some((c) => i.name.toLowerCase().includes(c)) ||
        ControversialIngredientsStrategy.ARTIFICIAL_PRESERVATIVES.some((p) => i.name.toLowerCase().includes(p)),
    );
    if (hasArtificial) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.High,
        code: 'ARTIFICIAL_ADDITIVES',
        message: 'Product contains artificial colors or preservatives.',
      });
    }

    return warnings;
  }

  getRecommendations(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation> {
    const recommendations: ScoringRecommendation[] = [];

    if (categoryScore.score < 70) {
      recommendations.push({
        category: this.category,
        priority: 1,
        code: 'REMOVE_CONTROVERSIAL',
        message: 'Remove or replace controversial ingredients (fillers, artificial additives, by-products).',
        estimatedImpact: 10,
      });
    }

    return recommendations;
  }

  private countMatches(
    ingredients: ProductScoringInput['ingredients'],
    terms: string[],
  ): number {
    let count = 0;
    for (const ing of ingredients) {
      const name = ing.name.toLowerCase();
      if (terms.some((t) => name.includes(t))) count++;
    }
    return count;
  }
}
