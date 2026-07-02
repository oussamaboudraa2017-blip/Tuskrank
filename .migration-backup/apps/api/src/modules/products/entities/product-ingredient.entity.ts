import type { Uuid } from '@types';

/**
 * Internal representation of a row in the `product_ingredients` table.
 *
 * Mirrors `database/schema.sql` (`product_ingredients`):
 *   id                uuid PRIMARY KEY
 *   product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE
 *   ingredient_id     uuid NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT
 *   position          integer NOT NULL
 *   raw_label         text NULL
 *   is_primary        boolean NOT NULL DEFAULT false
 *   percentage_value  numeric(6,3) NULL
 *   is_active         boolean NOT NULL DEFAULT true
 *   created_at, updated_at, deleted_at
 *
 * The `ingredient` join is loaded eagerly when the panel is requested.
 * Its full type lives in the (future) Ingredients module.
 */
export interface ProductIngredientEntity {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly ingredientId: Uuid;
  readonly position: number;
  readonly rawLabel: string | null;
  readonly isPrimary: boolean;
  readonly percentageValue: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

/**
 * Loose reference shape for a joined `ingredients` row.
 * Materialised by future Ingredients module; defined locally so that
 * the panel mapper has a stable contract today.
 */
export interface IngredientReference {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly currentScore: number | null;
  readonly currentGrade: string | null;
}
