import type { Uuid } from '@types';

/**
 * Wire-side types for the Ingredients module.
 *
 * These are the read-side shapes returned by the service layer.
 * The service is the only consumer of the repository; the controller
 * maps these to DTOs.
 */

export interface IngredientCategory {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: Uuid | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface IngredientScore {
  readonly id: Uuid;
  readonly ingredientId: Uuid;
  readonly score: number;
  readonly grade: string;
  readonly reasoning: string | null;
  readonly scoringVersion: string;
  readonly isCurrent: boolean;
}

export interface IngredientReference {
  readonly id: Uuid;
  readonly ingredientId: Uuid;
  readonly referenceId: Uuid;
  readonly evidenceType: string | null;
  readonly relevanceScore: number | null;
  readonly notes: string | null;
  readonly title: string;
  readonly authors: string | null;
  readonly publication: string | null;
  readonly publishedYear: number | null;
  readonly doi: string | null;
  readonly url: string | null;
}

/**
 * Full ingredient aggregate (detail view).
 */
export interface Ingredient {
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

  /** Joined: category (null if no category). */
  readonly category?: IngredientCategory | undefined;
  /** Joined: current score (null if unscored). */
  readonly currentScore?: IngredientScore | undefined;
  /** Joined: related products count. */
  readonly productCount?: number;
}

/**
 * Lightweight ingredient list projection.
 */
export interface IngredientSummary {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly canonicalName: string;
  readonly isAnimalDerived: boolean;
  readonly isCommonAllergen: boolean;
  readonly isControversial: boolean;
  readonly isActive: boolean;
  readonly categoryName: string | null;
  readonly categorySlug: string | null;
  readonly score: number | null;
  readonly grade: string | null;
  readonly productCount: number;
}

/**
 * Ingredient category with children (tree view).
 */
export interface IngredientCategoryTree {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly parentId: Uuid | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  children: IngredientCategoryTree[];
}

/**
 * Product ingredient panel entry.
 */
export interface ProductIngredientEntry {
  readonly productIngredientId: Uuid;
  readonly productId: Uuid;
  readonly position: number;
  readonly rawLabel: string | null;
  readonly isPrimary: boolean;
  readonly percentageValue: number | null;
  readonly ingredientId: Uuid;
  readonly ingredientName: string;
  readonly ingredientSlug: string;
  readonly ingredientCanonicalName: string;
  readonly isControversial: boolean;
  readonly isCommonAllergen: boolean;
  readonly isAnimalDerived: boolean;
  readonly ingredientGrade: string | null;
  readonly ingredientScore: number | null;
}
