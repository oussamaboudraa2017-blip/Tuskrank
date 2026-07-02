import type { Uuid } from '@types';

/**
 * Slug-only projection of a `food_forms` row.
 *
 * The full lookup is owned by the (future) Lookups module. Here we
 * just need the slug for product wire shapes.
 */
export interface FoodForm {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly isActive: boolean;
}
