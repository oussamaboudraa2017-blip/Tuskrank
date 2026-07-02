import { ScoringCategory, WarningSeverity, ScoreGrade, ScoreTrigger } from '../enums';

/**
 * A single category score produced by a strategy.
 */
export interface CategoryScore {
  /** Which category this score represents. */
  readonly category: ScoringCategory;
  /** Numeric score 0–100. */
  readonly score: number;
  /** Confidence in this score (0–1). Low confidence = limited data. */
  readonly confidence: number;
  /** Human-readable explanation of how this score was derived. */
  readonly reasoning: string;
  /** Number of data points used to compute this score. */
  readonly dataPoints: number;
}

/**
 * A scoring warning — flags a potential concern.
 */
export interface ScoringWarning {
  /** The category that triggered this warning. */
  readonly category: ScoringCategory;
  /** Severity level. */
  readonly severity: WarningSeverity;
  /** Short code for programmatic handling (e.g., 'HIGH_FILLER', 'NO_AAFCO'). */
  readonly code: string;
  /** Human-readable warning message. */
  readonly message: string;
}

/**
 * A scoring recommendation — actionable improvement suggestion.
 */
export interface ScoringRecommendation {
  /** The category this recommendation relates to. */
  readonly category: ScoringCategory;
  /** Priority (1 = highest). */
  readonly priority: number;
  /** Short code for programmatic handling. */
  readonly code: string;
  /** Human-readable recommendation. */
  readonly message: string;
  /** Estimated score improvement if implemented (0–100). */
  readonly estimatedImpact: number;
}

/**
 * Complete scoring result for a single product.
 */
export interface ScoringResult {
  /** Product UUID. */
  readonly productId: string;
  /** Overall weighted score 0–100. */
  readonly overallScore: number;
  /** Letter grade derived from overall score. */
  readonly grade: ScoreGrade;
  /** Individual category scores. */
  readonly categories: ReadonlyArray<CategoryScore>;
  /** Weighted score per category (overallScore = sum of these). */
  readonly weightedScores: Record<ScoringCategory, number>;
  /** Warnings flagged during scoring. */
  readonly warnings: ReadonlyArray<ScoringWarning>;
  /** Actionable recommendations. */
  readonly recommendations: ReadonlyArray<ScoringRecommendation>;
  /** Confidence in the overall score (0–1). */
  readonly confidence: number;
  /** Scoring algorithm version used. */
  readonly version: string;
  /** ISO timestamp of when the score was computed. */
  readonly computedAt: string;
}

/**
 * Input data for scoring a product.
 * Contains all the raw data strategies need to compute their scores.
 */
export interface ProductScoringInput {
  /** Product UUID. */
  readonly productId: string;
  /** Product name. */
  readonly name: string;
  /** Whether the product is active. */
  readonly isActive: boolean;
  /** Whether the product is published. */
  readonly isPublished: boolean;
  /** Ingredients with their details. */
  readonly ingredients: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly isAnimalDerived: boolean;
    readonly isControversial: boolean;
    readonly isAllergen: boolean;
    readonly safetyScore: number | null;
    readonly category: string | null;
  }>;
  /** Nutrition profile. */
  readonly nutrition: {
    readonly kcal: number | null;
    readonly proteinPercent: number | null;
    readonly fatPercent: number | null;
    readonly fiberPercent: number | null;
    readonly ashPercent: number | null;
    readonly moisturePercent: number | null;
  } | null;
  /** Brand details. */
  readonly brand: {
    readonly id: string;
    readonly name: string;
    readonly countryCode: string | null;
    readonly certifications: ReadonlyArray<string>;
  };
  /** Product claims. */
  readonly claims: ReadonlyArray<string>;
  /** Product tags. */
  readonly tags: ReadonlyArray<string>;
  /** Scientific references. */
  readonly scientificReferences: ReadonlyArray<{
    readonly id: string;
    readonly url: string;
    readonly evidenceType: string;
  }>;
  /** Whether UPC is present. */
  readonly hasUpc: boolean;
  /** Whether SKU is present. */
  readonly hasSku: boolean;
  /** Package size in grams. */
  readonly packageSizeGrams: number | null;
  /** Food form. */
  readonly foodForm: string | null;
}

/**
 * Scoring configuration — allows runtime weight overrides.
 */
export interface ScoringConfig {
  /** Category weights (partial — unspecified categories use defaults). */
  readonly weights?: Partial<Record<ScoringCategory, number>>;
  /** Scoring version to use. */
  readonly version?: string;
  /** Whether to include detailed reasoning in results. */
  readonly includeReasoning?: boolean;
  /** Maximum warnings to return. */
  readonly maxWarnings?: number;
  /** Maximum recommendations to return. */
  readonly maxRecommendations?: number;
}
