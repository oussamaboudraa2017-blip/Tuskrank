import type { Uuid } from '@types';

/**
 * Internal representation of a row in the `food_forms` lookup table.
 *
 * Mirrors `database/schema.sql` (`food_forms`):
 *   id           uuid PRIMARY KEY
 *   slug         text NOT NULL UNIQUE
 *   name         text NOT NULL
 *   is_active    boolean NOT NULL DEFAULT true
 *   created_at, updated_at, deleted_at
 */
export interface FoodFormEntity {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly isActive: boolean;
}

/**
 * Internal representation of a row in the `protein_sources` lookup table.
 *
 * Mirrors `database/schema.sql` (`protein_sources`):
 *   id        uuid PRIMARY KEY
 *   slug      text NOT NULL UNIQUE
 *   name      text NOT NULL
 *   origin    protein_origin NULL  -- ENUM('animal','plant','insect','fungi','synthetic')
 *   is_active boolean NOT NULL DEFAULT true
 */
export interface ProteinSourceEntity {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly origin: 'animal' | 'plant' | 'insect' | 'fungi' | 'synthetic' | null;
  readonly isActive: boolean;
}
