import type { Uuid } from '@types';

/**
 * Row-shape interfaces for joined SQL results.
 *
 * These match the column aliases returned by the repository queries.
 */

export interface IngredientRow {
  id: Uuid;
  name: string;
  slug: string;
  inci_name: string | null;
  category_id: Uuid | null;
  canonical_name: string;
  description: string | null;
  is_animal_derived: boolean;
  is_common_allergen: boolean;
  is_controversial: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  // Joined: category
  category_id_joined: Uuid | null;
  category_name: string | null;
  category_slug: string | null;

  // Joined: score
  score_id: Uuid | null;
  score_value: number | null;
  score_grade: string | null;
  score_reasoning: string | null;
  score_scoring_version: string | null;

  // Joined: product count
  product_count: number | null;
}

export interface IngredientCategoryRow {
  id: Uuid;
  slug: string;
  name: string;
  description: string | null;
  parent_id: Uuid | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface IngredientScoreRow {
  id: Uuid;
  ingredient_id: Uuid;
  score: number;
  grade: string;
  reasoning: string | null;
  scoring_version: string;
  is_current: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface ProductIngredientRow {
  product_ingredient_id: Uuid;
  product_id: Uuid;
  position: number;
  raw_label: string | null;
  is_primary: boolean;
  percentage_value: number | null;
  ingredient_id: Uuid;
  ingredient_name: string;
  ingredient_slug: string;
  ingredient_canonical_name: string;
  is_controversial: boolean;
  is_common_allergen: boolean;
  is_animal_derived: boolean;
  ingredient_grade: string | null;
  ingredient_score: number | null;
}

export interface IngredientReferenceRow {
  id: Uuid;
  ingredient_id: Uuid;
  reference_id: Uuid;
  evidence_type: string | null;
  relevance_score: number | null;
  notes: string | null;
  title: string;
  authors: string | null;
  publication: string | null;
  published_year: number | null;
  doi: string | null;
  url: string | null;
}
