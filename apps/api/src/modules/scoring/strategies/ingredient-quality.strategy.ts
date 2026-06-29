import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Ingredient Quality Strategy — scores based on:
 * - Number and quality of named ingredients
 * - Presence of animal-derived protein sources
 * - Average ingredient safety scores
 * - Ingredient diversity (single-protein vs multi-protein)
 *
 * Weight: 35% (default)
 */
export class IngredientQualityStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.IngredientQuality;

  score(input: ProductScoringInput): CategoryScore {
    const { ingredients } = input;

    if (ingredients.length === 0) {
      return this.buildResult(0, 0.1, 'No ingredients listed — unable to assess quality.');
    }

    let score = 0;
    let dataPoints = 0;

    // Factor 1: Ingredient count (more named ingredients = better transparency)
    // Optimal: 5–15 ingredients. Too few may indicate fillers; too many may indicate complexity.
    const countScore = this.ingredientCountScore(ingredients.length);
    score += countScore * 30;
    dataPoints += 1;

    // Factor 2: Animal-derived protein presence (primary ingredient should be animal protein)
    const proteinScore = this.proteinSourceScore(ingredients);
    score += proteinScore * 30;
    dataPoints += 1;

    // Factor 3: Average safety score of ingredients with scores
    const safetyScore = this.averageSafetyScore(ingredients);
    score += safetyScore * 25;
    dataPoints += safetyScore > 0 ? 1 : 0;

    // Factor 4: Ingredient diversity (penalize single-ingredient if not explicitly single-protein)
    const diversityScore = this.diversityScore(ingredients);
    score += diversityScore * 15;
    dataPoints += 1;

    const confidence = Math.min(1, dataPoints / 3);
    const reasoning = this.buildReasoning(countScore, proteinScore, safetyScore, diversityScore, ingredients.length);

    return this.buildResult(Math.round(score), confidence, reasoning);
  }

  getWarnings(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringWarning> {
    const warnings: ScoringWarning[] = [];
    const { ingredients } = input;

    if (ingredients.length === 0) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.High,
        code: 'NO_INGREDIENTS',
        message: 'No ingredients listed on the product.',
      });
    }

    if (ingredients.length > 20) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'MANY_INGREDIENTS',
        message: `Product has ${ingredients.length} ingredients, which may indicate complex formulation.`,
      });
    }

    if (categoryScore.score < 40) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Medium,
        code: 'LOW_INGREDIENT_QUALITY',
        message: 'Ingredient quality score is below acceptable threshold.',
      });
    }

    return warnings;
  }

  getRecommendations(
    input: ProductScoringInput,
    categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation> {
    const recommendations: ScoringRecommendation[] = [];

    if (categoryScore.score < 60) {
      recommendations.push({
        category: this.category,
        priority: 1,
        code: 'IMPROVE_INGREDIENTS',
        message: 'Consider using higher-quality, named animal protein sources as primary ingredients.',
        estimatedImpact: 15,
      });
    }

    if (input.ingredients.length < 3) {
      recommendations.push({
        category: this.category,
        priority: 2,
        code: 'ADD_INGREDIENTS',
        message: 'Product has very few ingredients. Consider adding functional ingredients for nutritional completeness.',
        estimatedImpact: 10,
      });
    }

    return recommendations;
  }

  // ------------------------------------------------------------------ PRIVATE

  private ingredientCountScore(count: number): number {
    if (count >= 5 && count <= 15) return 100;
    if (count >= 3 && count <= 20) return 70;
    if (count >= 1) return 40;
    return 0;
  }

  private proteinSourceScore(ingredients: ProductScoringInput['ingredients']): number {
    if (ingredients.length === 0) return 0;
    // First ingredient should be a named animal protein
    const first = ingredients[0];
    if (!first) return 0;
    if (first.isAnimalDerived) return 100;
    // Check if any ingredient is animal-derived
    const hasAnimal = ingredients.some((i) => i.isAnimalDerived);
    return hasAnimal ? 60 : 20;
  }

  private averageSafetyScore(
    ingredients: ProductScoringInput['ingredients'],
  ): number {
    const scored = ingredients.filter((i) => i.safetyScore !== null && i.safetyScore !== undefined);
    if (scored.length === 0) return 50; // neutral if no data
    const avg = scored.reduce((sum, i) => sum + (i.safetyScore ?? 0), 0) / scored.length;
    return Math.min(100, Math.max(0, avg));
  }

  private diversityScore(ingredients: ProductScoringInput['ingredients']): number {
    if (ingredients.length <= 1) return 30;
    if (ingredients.length >= 3 && ingredients.length <= 10) return 100;
    if (ingredients.length > 10) return 80;
    return 60;
  }

  private buildResult(score: number, confidence: number, reasoning: string): CategoryScore {
    return {
      category: this.category,
      score: Math.min(100, Math.max(0, score)),
      confidence,
      reasoning,
      dataPoints: 4,
    };
  }

  private buildReasoning(
    countScore: number,
    proteinScore: number,
    safetyScore: number,
    diversityScore: number,
    ingredientCount: number,
  ): string {
    const parts: string[] = [];
    parts.push(`Ingredient count score: ${countScore}/100 (${ingredientCount} ingredients)`);
    parts.push(`Protein source score: ${proteinScore}/100`);
    if (safetyScore > 0) parts.push(`Average safety score: ${safetyScore}/100`);
    parts.push(`Diversity score: ${diversityScore}/100`);
    return parts.join('. ');
  }
}
