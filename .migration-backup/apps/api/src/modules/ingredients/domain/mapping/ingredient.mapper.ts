import type {
  IngredientRow,
  IngredientCategoryRow,
  ProductIngredientRow,
  IngredientReferenceRow,
} from './ingredient.db-model';
import type {
  Ingredient,
  IngredientSummary,
  IngredientCategory,
  IngredientCategoryTree,
  ProductIngredientEntry,
  IngredientReference,
} from '../types';

/**
 * Pure mapper functions for the Ingredients module.
 *
 * No I/O, no logging, trivially testable.
 */
export const IngredientMapper = {
  /**
   * Map a joined DB row to an Ingredient aggregate.
   */
  rowToIngredient(row: IngredientRow): Ingredient {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      inciName: row.inci_name,
      categoryId: row.category_id,
      canonicalName: row.canonical_name,
      description: row.description,
      isAnimalDerived: row.is_animal_derived,
      isCommonAllergen: row.is_common_allergen,
      isControversial: row.is_controversial,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      category: row.category_id_joined
        ? {
            id: row.category_id_joined,
            slug: row.category_slug ?? '',
            name: row.category_name ?? '',
            description: null,
            parentId: null,
            sortOrder: 0,
            isActive: true,
          }
        : undefined,
      currentScore: row.score_id
        ? {
            id: row.score_id,
            ingredientId: row.id,
            score: Number(row.score_value),
            grade: row.score_grade ?? '',
            reasoning: row.score_reasoning,
            scoringVersion: row.score_scoring_version ?? '',
            isCurrent: true,
          }
        : undefined,
      productCount: row.product_count ?? 0,
    };
  },

  /**
   * Map a DB row to a lightweight IngredientSummary.
   */
  rowToSummary(row: IngredientRow): IngredientSummary {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      canonicalName: row.canonical_name,
      isAnimalDerived: row.is_animal_derived,
      isCommonAllergen: row.is_common_allergen,
      isControversial: row.is_controversial,
      isActive: row.is_active,
      categoryName: row.category_name,
      categorySlug: row.category_slug,
      score: row.score_value !== null && row.score_value !== undefined ? Number(row.score_value) : null,
      grade: row.score_grade,
      productCount: row.product_count ?? 0,
    };
  },

  /**
   * Map a DB row to an IngredientCategory.
   */
  rowToCategory(row: IngredientCategoryRow): IngredientCategory {
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description,
      parentId: row.parent_id,
      sortOrder: row.sort_order,
      isActive: row.is_active,
    };
  },

  /**
   * Build a category tree from a flat list of categories.
   */
  buildCategoryTree(categories: ReadonlyArray<IngredientCategory>): IngredientCategoryTree[] {
    const map = new Map<string, IngredientCategoryTree>();
    const roots: IngredientCategoryTree[] = [];

    for (const cat of categories) {
      map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId) {
        const parent = map.get(cat.parentId);
        if (parent) {
          parent.children = [...parent.children, node];
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  /**
   * Map a ProductIngredientRow to a ProductIngredientEntry.
   */
  rowToProductIngredientEntry(row: ProductIngredientRow): ProductIngredientEntry {
    return {
      productIngredientId: row.product_ingredient_id,
      productId: row.product_id,
      position: row.position,
      rawLabel: row.raw_label,
      isPrimary: row.is_primary,
      percentageValue: row.percentage_value !== null ? Number(row.percentage_value) : null,
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name,
      ingredientSlug: row.ingredient_slug,
      ingredientCanonicalName: row.ingredient_canonical_name,
      isControversial: row.is_controversial,
      isCommonAllergen: row.is_common_allergen,
      isAnimalDerived: row.is_animal_derived,
      ingredientGrade: row.ingredient_grade,
      ingredientScore: row.ingredient_score !== null && row.ingredient_score !== undefined ? Number(row.ingredient_score) : null,
    };
  },

  /**
   * Map a reference row to an IngredientReference.
   */
  rowToReference(row: IngredientReferenceRow): IngredientReference {
    return {
      id: row.id,
      ingredientId: row.ingredient_id,
      referenceId: row.reference_id,
      evidenceType: row.evidence_type,
      relevanceScore: row.relevance_score !== null && row.relevance_score !== undefined ? Number(row.relevance_score) : null,
      notes: row.notes,
      title: row.title,
      authors: row.authors,
      publication: row.publication,
      publishedYear: row.published_year,
      doi: row.doi,
      url: row.url,
    };
  },
};
