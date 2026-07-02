import type { Uuid } from '@types';

/**
 * Internal representation of a row in the `nutrition_profiles` table.
 *
 * Mirrors `database/schema.sql` (`nutrition_profiles`):
 *   id              uuid PRIMARY KEY
 *   product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE
 *   kcal_per_100g   numeric(7,3) NULL
 *   kcal_per_cup    numeric(7,3) NULL
 *   moisture_pct    numeric(5,2) NULL
 *   effective_from   date NOT NULL
 *   effective_to     date NULL
 *   source          nutrition_source NULL  -- ENUM
 *   notes           text NULL
 *   created_at, updated_at, deleted_at
 */
export interface NutritionProfileEntity {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly kcalPer100g: string | null;
  readonly kcalPerCup: string | null;
  readonly moisturePct: string | null;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly source: 'label' | 'lab' | 'vendor' | 'calculated' | 'official' | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
