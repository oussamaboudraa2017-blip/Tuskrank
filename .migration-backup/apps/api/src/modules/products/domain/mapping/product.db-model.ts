import type { Uuid } from '@types';

/**
 * Database-level row-shape types for the products module.
 *
 * These are the *joined* row shapes that the pg repository returns
 * (one row per `products` row, with all FK targets denormalised as
 * nested objects). The mapper takes these and constructs the
 * domain model.
 *
 * Mirrors the actual SELECT in `database/schema.sql`:
 *   SELECT
 *     products.*,
 *     brands.*                       (1:1),
 *     food_forms.*                   (1:0..1),
 *     protein_sources.*              (1:0..1),
 *     product_scores.*               (1:0..1, current),
 *     product_images.*               (1:N),
 *     product_ingredients.*          (1:N, joined with ingredients),
 *     product_targeting.*            (1:N),
 *     product_tags.* + tags.*        (1:N),
 *     product_claims.* + claims.*    (1:N),
 *     nutrition_profiles.*           (1:N),
 *     product_nutrients.*            (1:N),
 *     score_history.*                (1:N, last N rows)
 *   FROM products …
 *
 * These are *internal* — they are never exposed on the wire. They
 * exist so the mapper layer has a stable contract with the
 * repository, and so the SQL has a single point of change.
 */
export interface ProductRow {
  // products columns
  readonly id: Uuid;
  readonly brand_id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly upc: string | null;
  readonly sku: string | null;
  readonly package_size_grams: string | null;       // numeric → string
  readonly package_size_label: string | null;
  readonly food_form_id: Uuid | null;
  readonly primary_protein_source_id: Uuid | null;
  readonly is_active: boolean;
  readonly published_at: Date | null;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly deleted_at: Date | null;

  // brands (1:1)
  readonly brand_id_2?: never;          // alias-shadowing guard
  readonly brand_name: string;
  readonly brand_slug: string;
  readonly brand_manufacturer: string | null;
  readonly brand_country_code: string | null;
  readonly brand_website_url: string | null;
  readonly brand_description: string | null;
  readonly brand_logo_image_url: string | null;
  readonly brand_is_active: boolean;

  // food_forms (1:0..1) — denormalised columns
  readonly food_form_slug: string | null;
  readonly food_form_name: string | null;
  readonly food_form_is_active: boolean | null;

  // protein_sources (1:0..1)
  readonly protein_source_slug: string | null;
  readonly protein_source_name: string | null;
  readonly protein_source_origin: 'animal' | 'plant' | 'insect' | 'fungi' | 'synthetic' | null;
  readonly protein_source_is_active: boolean | null;

  // product_scores (1:0..1, current)
  readonly score_id: Uuid | null;
  readonly score_overall: string | null;        // numeric → string
  readonly score_quality: string | null;
  readonly score_safety: string | null;
  readonly score_nutrition: string | null;
  readonly score_transparency: string | null;
  readonly score_grade: string | null;
  readonly score_scoring_version: string | null;
  readonly score_updated_at: Date | null;
  readonly score_is_current: boolean | null;

  // Children: arrays of denormalised rows.
  readonly images: ReadonlyArray<ProductImageRow>;
  readonly ingredient_panel: ReadonlyArray<ProductIngredientRow>;
  readonly tags: ReadonlyArray<ProductTagRow>;
  readonly claims: ReadonlyArray<ProductClaimRow>;
  readonly targeting: ReadonlyArray<ProductTargetingRow>;
  readonly nutrition_profiles: ReadonlyArray<NutritionProfileRow>;
  readonly nutrient_values: ReadonlyArray<ProductNutrientValueRow>;
  readonly score_history: ReadonlyArray<ScoreHistoryRow>;
}

/* ==================================================================
 * Children
 * ================================================================== */

export interface ProductImageRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly storage_path: string;
  readonly public_url: string;
  readonly alt_text: string | null;
  readonly width_px: number | null;
  readonly height_px: number | null;
  readonly bytes: number | null;
  readonly mime_type: string | null;
  readonly sort_order: number;
  readonly is_primary: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
}

export interface ProductIngredientRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly ingredient_id: Uuid;
  readonly position: number;
  readonly raw_label: string | null;
  readonly is_primary: boolean;
  readonly percentage_value: string | null;        // numeric → string
  readonly is_active: boolean;
  // joined `ingredients`
  readonly ingredient_slug: string;
  readonly ingredient_name: string;
  readonly ingredient_current_score: string | null;
  readonly ingredient_current_grade: string | null;
  readonly ingredient_is_controversial: boolean;
  readonly ingredient_is_common_allergen: boolean;
  readonly ingredient_is_animal_derived: boolean;
}

export interface ProductTagRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly tag_id: Uuid;
  readonly tag_slug: string;
  readonly tag_name: string;
}

export interface ProductClaimRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly claim_id: Uuid;
  readonly claim_slug: string;
  readonly claim_name: string;
  readonly evidence_note: string | null;
}

export interface ProductTargetingRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly pet_type_id: Uuid;
  readonly life_stage_id: Uuid | null;
  readonly breed_size_id: Uuid | null;
  readonly category_id: Uuid | null;
  readonly is_active: boolean;
}

export interface NutritionProfileRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly kcal_per_100g: string | null;
  readonly kcal_per_cup: string | null;
  readonly moisture_pct: string | null;
  readonly effective_from: string;
  readonly effective_to: string | null;
  readonly source: string | null;
  readonly notes: string | null;
}

export interface ProductNutrientValueRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly nutrient_id: Uuid;
  readonly nutrition_profile_id: Uuid | null;
  readonly amount: string;
  readonly unit: string;
  readonly bound: 'exact' | 'min' | 'max' | 'typical';
}

export interface ScoreHistoryRow {
  readonly id: Uuid;
  readonly product_id: Uuid;
  readonly overall: string;
  readonly quality: string | null;
  readonly safety: string | null;
  readonly nutrition: string | null;
  readonly transparency: string | null;
  readonly scoring_version: string;
  readonly computed_at: Date;
  readonly triggered_by: string | null;
  readonly notes: string | null;
}
