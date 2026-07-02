import type { Uuid } from '@types';

/**
 * Ingredient entity interface.
 * Mirrors the `ingredients` table columns.
 */
export interface IngredientEntity {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly inciName: string | null;
  readonly categoryId: Uuid | null;
  readonly canonicalName: string;
  readonly description: string | null;
  readonly isAnimalDerived: boolean;
  readonly isCommonAllergen: boolean;
  readonly isControversial: boolean;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
