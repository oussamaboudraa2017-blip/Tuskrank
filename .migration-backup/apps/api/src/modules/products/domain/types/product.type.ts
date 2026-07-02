import type { Uuid } from '@types';
import type { ProductImageSource } from '../enums';
import type { FoodForm } from './food-form.type';
import type { ProductImage } from './product-image.type';
import type { ProductNutrientValue, NutritionProfile } from './nutrition.type';
import type { ProductScore, ProductScoreHistory } from './score.type';
import type { ProteinSource } from './protein-source.type';
import type { Brand } from './brand.type';

/* ==================================================================
 * Ingredients panel (read-side)
 * ================================================================== */

/**
 * One row of the ordered ingredient panel — `position` is 1-based.
 *
 * `ingredient` is a slim projection of the (future) `ingredients` table
 * carrying the fields the public product page renders. The
 * `ProductIngredient` row carries `rawLabel` (verbatim from the package)
 * for compliance / accessibility use cases.
 */
export interface ProductIngredientEntry {
  readonly position: number;
  readonly rawLabel: string | null;
  readonly isPrimary: boolean;
  readonly percentageValue: number | null;
  readonly ingredient: ProductIngredientReference;
}

/** Cross-domain reference to an `ingredients` row. */
export interface ProductIngredientReference {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly currentScore: number | null;
  readonly currentGrade: string | null;
  readonly isControversial: boolean;
  readonly isCommonAllergen: boolean;
  readonly isAnimalDerived: boolean;
}

/* ==================================================================
 * Tag & claim references
 * ================================================================== */

export interface ProductTag {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
}

export interface ProductClaim {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly evidenceNote: string | null;
}

/* ==================================================================
 * Targeting (one row per (product, pet_type, life_stage, breed_size, category))
 * ================================================================== */

export interface ProductTargeting {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly petTypeId: Uuid;
  readonly lifeStageId: Uuid | null;
  readonly breedSizeId: Uuid | null;
  readonly categoryId: Uuid | null;
  readonly isActive: boolean;
}

/* ==================================================================
 * Concrete product aggregate
 * ================================================================== */

/**
 * The full product domain aggregate.
 *
 * Aggregates the table data plus joined entities (brand, food form,
 * protein source) plus the full ingredient panel / tags / claims /
 * images / nutrition / current score.
 *
 * The service returns this; controllers call `toDetailDto(product)`
 * (in `domain/mapping/`) to produce the wire shape.
 */
export interface Product {
  readonly id: Uuid;
  readonly brandId: Uuid;
  readonly brand: Brand;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly upc: string | null;
  readonly sku: string | null;
  readonly packageSizeGrams: number | null;
  readonly packageSizeLabel: string | null;
  readonly foodFormId: Uuid | null;
  readonly foodForm: FoodForm | null;
  readonly primaryProteinSourceId: Uuid | null;
  readonly primaryProteinSource: ProteinSource | null;
  readonly isActive: boolean;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
  readonly score: ProductScore | null;
  readonly scoreHistory: ProductScoreHistory;
  readonly images: ReadonlyArray<ProductImage>;
  readonly ingredientPanel: ReadonlyArray<ProductIngredientEntry>;
  readonly tags: ReadonlyArray<ProductTag>;
  readonly claims: ReadonlyArray<ProductClaim>;
  readonly targeting: ReadonlyArray<ProductTargeting>;
  readonly nutritionProfiles: ReadonlyArray<NutritionProfile>;
  readonly nutrientValues: ReadonlyArray<ProductNutrientValue>;
}

/**
 * Lightweight list-row projection.
 *
 * Returned by `findMany`, `search`, and similar list endpoints. Includes
 * the brand (always) and the current score, but not images / panel /
 * targeting / nutrition. The detail projection is `Product`.
 */
export interface ProductSummary {
  readonly id: Uuid;
  readonly brandId: Uuid;
  readonly brand: Brand;
  readonly name: string;
  readonly slug: string;
  readonly foodForm: FoodForm | null;
  readonly primaryProteinSource: ProteinSource | null;
  readonly packageSizeGrams: number | null;
  readonly packageSizeLabel: string | null;
  readonly isActive: boolean;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly score: ProductScore | null;
  readonly currentGrade: string | null;
}
