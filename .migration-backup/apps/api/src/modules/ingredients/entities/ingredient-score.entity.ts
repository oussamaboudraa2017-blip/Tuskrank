import type { Uuid } from '@types';

/**
 * Ingredient score entity interface.
 * Mirrors the `ingredient_scores` table columns.
 */
export interface IngredientScoreEntity {
  readonly id: Uuid;
  readonly ingredientId: Uuid;
  readonly score: number;
  readonly grade: string;
  readonly reasoning: string | null;
  readonly scoringVersion: string;
  readonly isCurrent: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
