import type { Uuid } from '@types';

/**
 * Pet-type taxonomy mirrors `database/schema.sql` (`pet_types`).
 * The schema ENUM is the source of truth; this type is the wire/contract.
 */
export const PET_TYPES = ['dog', 'cat', 'rabbit', 'bird', 'small-mammal'] as const;
export type PetType = (typeof PET_TYPES)[number];

export const FOOD_FORMS = [
  'kibble',
  'wet',
  'raw',
  'freeze-dried',
  'dehydrated',
  'soft',
  'topper',
  'mixer',
  'treat',
  'supplement',
] as const;
export type FoodFormSlug = (typeof FOOD_FORMS)[number];

export const LIFE_STAGES = [
  'puppy',
  'junior',
  'adult',
  'senior',
  'geriatric',
] as const;
export type LifeStageSlug = (typeof LIFE_STAGES)[number];

export const BREED_SIZES = [
  'toy',
  'small',
  'medium',
  'large',
  'giant',
] as const;
export type BreedSizeSlug = (typeof BREED_SIZES)[number];

export const PROTEIN_ORIGINS = ['animal', 'plant', 'insect', 'fungi', 'synthetic'] as const;
export type ProteinOrigin = (typeof PROTEIN_ORIGINS)[number];

/**
 * Listing filters. Optional — controllers compose these into a
 * `ListProductsParams` shape at the boundary.
 *
 * Range checks (`min_score <= max_score`) are validated at the DTO layer
 * (see `dto/list-products.filters.dto.ts`) when it lands; this type only
 * carries shape.
 */
export interface ProductListFilters {
  readonly q?: string;
  readonly brandId?: Uuid;
  readonly petType?: PetType;
  readonly lifeStage?: LifeStageSlug;
  readonly breedSize?: BreedSizeSlug;
  readonly foodForm?: FoodFormSlug;
  readonly proteinOrigin?: ProteinOrigin;
  readonly minScore?: number;
  readonly maxScore?: number;
  readonly isActive?: boolean;
  readonly isPublished?: boolean;
}
