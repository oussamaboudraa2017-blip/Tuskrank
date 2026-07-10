/**
 * Scoring categories — each maps to an independent strategy.
 */
export enum ScoringCategory {
  /** Quality of ingredients (freshness, sourcing, nutrient density). */
  IngredientQuality = 'ingredient_quality',
  /** Transparency of ingredient listing and sourcing. */
  Transparency = 'transparency',
  /** Nutritional balance (macros, micros, AAFCO compliance). */
  NutritionalBalance = 'nutritional_balance',
  /** Processing level (kibble vs raw, heat processing, rendering). */
  ProcessingLevel = 'processing_level',
  /** Presence of controversial ingredients (fillers, by-products, artificial additives). */
  ControversialIngredients = 'controversial_ingredients',
  /** Scientific evidence supporting health claims. */
  ScientificEvidence = 'scientific_evidence',
  /** Label transparency (clear sourcing, third-party certifications). */
  LabelTransparency = 'label_transparency',
}

/**
 * Scoring version — tracks which algorithm version produced a score.
 */
export enum ScoringVersion {
  V1 = '1.0.0',
}

/**
 * Grade labels mapped from numeric scores.
 */
export enum ScoreGrade {
  APlus = 'A+',
  A = 'A',
  AMinus = 'A-',
  BPlus = 'B+',
  B = 'B',
  BMinus = 'B-',
  CPlus = 'C+',
  C = 'C',
  CMinus = 'C-',
  DPlus = 'D+',
  D = 'D',
  DMinus = 'D-',
  F = 'F',
}

/**
 * Severity levels for scoring warnings.
 */
export enum WarningSeverity {
  Info = 'info',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Trigger reason for score computation.
 */
export enum ScoreTrigger {
  Manual = 'manual',
  Scheduled = 'scheduled',
  DataChange = 'data_change',
  Import = 'import',
  Seed = 'seed',
}
