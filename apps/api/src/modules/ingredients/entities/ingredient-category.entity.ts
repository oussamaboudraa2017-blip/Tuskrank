import type { Uuid } from '@types';

/**
 * Ingredient category entity interface.
 * Mirrors the `ingredient_categories` table columns.
 */
export interface IngredientCategoryEntity {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: Uuid | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
