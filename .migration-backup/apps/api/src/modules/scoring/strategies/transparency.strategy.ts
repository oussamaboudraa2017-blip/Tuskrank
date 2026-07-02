import { ScoringCategory, WarningSeverity } from '../enums';
import { CategoryScore, ProductScoringInput, ScoringWarning, ScoringRecommendation } from '../types';
import { ScoringStrategy } from '../interfaces';

/**
 * Transparency Strategy — scores based on:
 * - Clarity and specificity of ingredient names
 * - Presence of sourcing information
 * - Brand transparency (country of origin, certifications)
 *
 * Weight: 20% (default)
 */
export class TransparencyStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.Transparency;

  score(input: ProductScoringInput): CategoryScore {
    let score = 0;
    let dataPoints = 0;

    const namingScore = namingSpecificityScore(input.ingredients);
    score += namingScore * 40;
    dataPoints += 1;

    const brandScore = brandTransparencyScore(input.brand);
    score += brandScore * 30;
    dataPoints += 1;

    const claimsScoreVal = claimsScore(input.claims);
    score += claimsScoreVal * 20;
    dataPoints += 1;

    const identScore = input.hasUpc && input.hasSku ? 100 : input.hasUpc ? 60 : 30;
    score += identScore * 10;
    dataPoints += 1;

    const confidence = Math.min(1, dataPoints / 3);
    const reasoning = `Naming: ${namingScore}/100, Brand: ${brandScore}/100, Claims: ${claimsScoreVal}/100, Identifiers: ${identScore}/100`;

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

    if (!input.brand.countryCode) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'NO_COUNTRY',
        message: 'Brand does not list a country of origin.',
      });
    }

    if (input.brand.certifications.length === 0) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Low,
        code: 'NO_CERTIFICATIONS',
        message: 'No third-party certifications listed.',
      });
    }

    if (categoryScore.score < 40) {
      warnings.push({
        category: this.category,
        severity: WarningSeverity.Medium,
        code: 'LOW_TRANSPARENCY',
        message: 'Product transparency score is below acceptable threshold.',
      });
    }

    return warnings;
  }

  getRecommendations(
    input: ProductScoringInput,
    _categoryScore: CategoryScore,
  ): ReadonlyArray<ScoringRecommendation> {
    const recommendations: ScoringRecommendation[] = [];

    if (input.brand.certifications.length === 0) {
      recommendations.push({
        category: this.category,
        priority: 1,
        code: 'ADD_CERTIFICATIONS',
        message: 'Obtain third-party certifications (AAFCO, USDA Organic, etc.) to improve transparency.',
        estimatedImpact: 12,
      });
    }

    if (!input.brand.countryCode) {
      recommendations.push({
        category: this.category,
        priority: 2,
        code: 'ADD_COUNTRY',
        message: 'List the country of origin for all ingredients to improve traceability.',
        estimatedImpact: 8,
      });
    }

    return recommendations;
  }
}

function namingSpecificityScore(
  ingredients: ProductScoringInput['ingredients'],
): number {
  if (ingredients.length === 0) return 0;
  const genericTerms = ['meat', 'animal', 'poultry', 'fish', 'by-product', 'meal', 'powder'];
  let specificCount = 0;
  for (const ing of ingredients) {
    const name = ing.name.toLowerCase();
    const isGeneric = genericTerms.some((t) => name.includes(t) && name.split(' ').length <= 2);
    if (!isGeneric) specificCount++;
  }
  return Math.round((specificCount / ingredients.length) * 100);
}

function brandTransparencyScore(
  brand: ProductScoringInput['brand'],
): number {
  let score = 0;
  if (brand.countryCode) score += 40;
  if (brand.certifications.length > 0) score += 40;
  if (brand.name && brand.name.length > 0) score += 20;
  return Math.min(100, score);
}

function claimsScore(claims: ReadonlyArray<string>): number {
  if (claims.length === 0) return 30;
  if (claims.length >= 3) return 100;
  if (claims.length >= 1) return 60;
  return 30;
}
