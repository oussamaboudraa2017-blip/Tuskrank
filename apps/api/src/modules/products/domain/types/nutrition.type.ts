import type { Uuid } from '@types';
import type { ScoreValueType } from '../enums';

/**
 * Nutrient value bound to a product, e.g. "Protein 28% (min)".
 *
 * `amountUnit` is the canonical unit *at write time* — see
 * `database/schema.sql` (product_nutrients.amount_unit).
 */
export interface ProductNutrientValue {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly nutrientId: Uuid;
  readonly nutritionProfileId: Uuid | null;
  readonly amount: number;
  readonly unit: string;
  readonly bound: ScoreValueType;
}

export interface NutritionProfile {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly kcalPer100g: number | null;
  readonly kcalPerCup: number | null;
  readonly moisturePct: number | null;
  readonly effectiveFrom: string; // ISO 8601 date
  readonly effectiveTo: string | null;
  readonly source: string | null;
  readonly notes: string | null;
}
