-- ============================================================
-- Tuskrank — Production Database Indexes
-- ------------------------------------------------------------
-- Loaded AFTER schema.sql
-- Designed for: 100k+ products, millions of searches.
--
-- Index strategy:
--   * B-tree on FKs, slug columns, sort keys, status flags
--   * Partial indexes filtered to (deleted_at IS NULL)
--   * Partial unique indexes for soft-delete-aware uniqueness
--   * Partial single-current indexes on (is_current = true)
--   * Composite indexes covering hot read paths
--   * GIN trigram for fuzzy name search
--   * GIN tsvector on generated `search_vector` columns
--   * GIN trigram on canonical/normalised search keys
-- ============================================================

SET client_min_messages = WARNING;

SET search_path = public;

-- ============================================================
-- BRANDS
-- ============================================================
CREATE INDEX idx_brands_active_name
    ON brands (lower(name))
    WHERE deleted_at IS NULL AND is_active;

-- country_code is a CHAR(2) now (alpha-2); this B-tree replaces the
-- previous char-class-string indexed column.
CREATE INDEX idx_brands_country
    ON brands (country_code)
    WHERE deleted_at IS NULL AND country_code IS NOT NULL;

-- ============================================================
-- INGREDIENTS
-- ============================================================
CREATE INDEX idx_ingredients_active_category
    ON ingredients (category_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_ingredients_canonical
    ON ingredients (canonical_name)
    WHERE deleted_at IS NULL;                       -- citext is b-tree-indexable
CREATE INDEX idx_ingredients_controversial
    ON ingredients (id)
    WHERE deleted_at IS NULL AND is_controversial;
CREATE INDEX idx_ingredients_allergen
    ON ingredients (id)
    WHERE deleted_at IS NULL AND is_common_allergen;
CREATE INDEX idx_ingredients_animal
    ON ingredients (id)
    WHERE deleted_at IS NULL AND is_animal_derived;
CREATE INDEX idx_ingredients_category_controversial
    ON ingredients (category_id)
    WHERE deleted_at IS NULL AND is_controversial AND category_id IS NOT NULL;

-- GIN trigram for fuzzy name search (sparse on canonical citext is overkill;
-- the generated FTS column below handles recall; keep trigram on the display
-- name for typo correction).
CREATE INDEX idx_ingredients_name_trgm
    ON ingredients USING gin (name gin_trgm_ops)
    WHERE deleted_at IS NULL AND is_active;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE INDEX idx_products_brand
    ON products (brand_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_products_published_at
    ON products (published_at DESC)
    WHERE deleted_at IS NULL AND is_active AND published_at IS NOT NULL;
CREATE INDEX idx_products_food_form
    ON products (food_form_id)
    WHERE deleted_at IS NULL AND food_form_id IS NOT NULL;
CREATE INDEX idx_products_primary_protein
    ON products (primary_protein_source_id)
    WHERE deleted_at IS NULL AND primary_protein_source_id IS NOT NULL;

-- Hot path: detail page fetches by brand + slug. We have the unique
-- on (brand_id, slug), but a partial covering index helps admin lookup.
CREATE INDEX idx_products_brand_slug_active
    ON products (brand_id, slug)
    WHERE deleted_at IS NULL AND is_active;

-- Global UPC/SKU uniqueness on rows that actually carry them.
CREATE UNIQUE INDEX uq_products_upc_active
    ON products (upc)
    WHERE deleted_at IS NULL AND upc IS NOT NULL;
CREATE UNIQUE INDEX uq_products_sku_brand_active
    ON products (brand_id, sku)
    WHERE deleted_at IS NULL AND sku IS NOT NULL;

-- Trigram name search
CREATE INDEX idx_products_name_trgm
    ON products USING gin (name gin_trgm_ops)
    WHERE deleted_at IS NULL AND is_active;

-- ============================================================
-- PRODUCT_INGREDIENTS
-- ============================================================
CREATE INDEX idx_pi_product
    ON product_ingredients (product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pi_ingredient
    ON product_ingredients (ingredient_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pi_product_position
    ON product_ingredients (product_id, position)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pi_primary
    ON product_ingredients (product_id)
    WHERE is_primary AND deleted_at IS NULL;

-- Soft-delete-aware partial uniques
CREATE UNIQUE INDEX uq_pi_product_position_active
    ON product_ingredients (product_id, position)
    WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_pi_product_ingredient_active
    ON product_ingredients (product_id, ingredient_id)
    WHERE deleted_at IS NULL;

-- ============================================================
-- PRODUCT_TARGETING
-- ============================================================
CREATE INDEX idx_pt_product
    ON product_targeting (product_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_pt_pet_life_breed
    ON product_targeting (pet_type_id, life_stage_id, breed_size_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_pt_category
    ON product_targeting (category_id)
    WHERE deleted_at IS NULL AND category_id IS NOT NULL;
CREATE INDEX idx_pt_pet_active
    ON product_targeting (product_id, pet_type_id)
    WHERE deleted_at IS NULL AND is_active;

-- ============================================================
-- PRODUCT_IMAGES
-- ============================================================
CREATE INDEX idx_product_images_product
    ON product_images (product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_primary
    ON product_images (product_id)
    WHERE is_primary AND deleted_at IS NULL;
-- A single product can have multiple images with the same sort_order
-- when the source dataset is dirty; keep a hard unique per product+primary:
CREATE UNIQUE INDEX uq_product_images_one_primary_per_product
    ON product_images (product_id)
    WHERE is_primary AND deleted_at IS NULL;

-- ============================================================
-- NUTRITION_PROFILES / PRODUCT_NUTRIENTS
-- ============================================================
CREATE INDEX idx_nutrition_profiles_product
    ON nutrition_profiles (product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_nutrition_profiles_effective
    ON nutrition_profiles (effective_from DESC, product_id)
    WHERE deleted_at IS NULL;

-- Single currently-effective profile per product (effective_to IS NULL).
CREATE UNIQUE INDEX uq_nutrition_profiles_product_current
    ON nutrition_profiles (product_id)
    WHERE deleted_at IS NULL AND effective_to IS NULL;

-- product_nutrients hot read is "give me all nutrient values for product X"
-- so a small covering index on (product_id, nutrient_id, unit, amount, bound)
-- is the right shape. The unique constraints below also use (product_id, ...).
CREATE INDEX idx_product_nutrients_product_nutrient
    ON product_nutrients (product_id, nutrient_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_product_nutrients_profile
    ON product_nutrients (nutrition_profile_id, nutrient_id)
    WHERE deleted_at IS NULL AND nutrition_profile_id IS NOT NULL;
CREATE INDEX idx_product_nutrients_nutrient
    ON product_nutrients (nutrient_id)
    WHERE deleted_at IS NULL;

-- Partial uniques (active rows only). Now includes the `bound` column
-- so we can store both "minimum guaranteed crude protein" and
-- "typical crude protein" for the same product.
CREATE UNIQUE INDEX uq_pn_product_nutrient_no_profile
    ON product_nutrients (product_id, nutrient_id, bound)
    WHERE deleted_at IS NULL AND nutrition_profile_id IS NULL;
CREATE UNIQUE INDEX uq_pn_product_nutrient_with_profile
    ON product_nutrients (product_id, nutrient_id, bound, nutrition_profile_id)
    WHERE deleted_at IS NULL AND nutrition_profile_id IS NOT NULL;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE INDEX idx_categories_pet
    ON categories (pet_type_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_categories_parent
    ON categories (parent_id)
    WHERE parent_id IS NOT NULL AND deleted_at IS NULL;

-- ============================================================
-- LOOKUP TABLES
-- ============================================================
CREATE INDEX idx_life_stages_pet
    ON life_stages (pet_type_id, sort_order)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_breed_sizes_pet
    ON breed_sizes (pet_type_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_food_forms_active
    ON food_forms (slug)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_protein_sources
    ON protein_sources (origin, slug)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_ingredient_cats_parent
    ON ingredient_categories (parent_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_tags_active
    ON tags (slug)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_claims_active
    ON claims (slug)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_nutrients_active
    ON nutrients (slug)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_relation_types_active
    ON relation_types (slug)
    WHERE deleted_at IS NULL AND is_active;

-- ============================================================
-- CLAIMS / TAGS joins
-- ============================================================
CREATE INDEX idx_product_claims_product
    ON product_claims (product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_product_claims_claim
    ON product_claims (claim_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_product_tags_product
    ON product_tags (product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_product_tags_tag
    ON product_tags (tag_id)
    WHERE deleted_at IS NULL;

-- ============================================================
-- SCORING
-- ============================================================
CREATE INDEX idx_ingredient_scores_current
    ON ingredient_scores (ingredient_id)
    WHERE is_current AND deleted_at IS NULL;
CREATE INDEX idx_ingredient_scores_version
    ON ingredient_scores (scoring_version);

CREATE INDEX idx_product_scores_current
    ON product_scores (product_id)
    WHERE is_current AND deleted_at IS NULL;
CREATE INDEX idx_product_scores_overall
    ON product_scores (overall_score DESC)
    WHERE is_current AND deleted_at IS NULL;
CREATE INDEX idx_product_scores_quality
    ON product_scores (quality_score DESC NULLS LAST)
    WHERE is_current AND deleted_at IS NULL;
CREATE INDEX idx_product_scores_safety
    ON product_scores (safety_score DESC NULLS LAST)
    WHERE is_current AND deleted_at IS NULL;
CREATE INDEX idx_product_scores_version
    ON product_scores (scoring_version);

-- "single current" partial uniques
CREATE UNIQUE INDEX uq_ingredient_scores_single_current
    ON ingredient_scores (ingredient_id)
    WHERE is_current AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_product_scores_single_current
    ON product_scores (product_id)
    WHERE is_current AND deleted_at IS NULL;

CREATE INDEX idx_score_history_product
    ON score_history (product_id, computed_at DESC);
CREATE INDEX idx_score_history_version
    ON score_history (scoring_version);
CREATE INDEX idx_score_history_computed_at
    ON score_history (computed_at DESC);

-- ============================================================
-- SCIENCE / CITATIONS
-- ============================================================
CREATE INDEX idx_ingredient_references_ingredient
    ON ingredient_references (ingredient_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_ingredient_references_reference
    ON ingredient_references (reference_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_ingredient_references_evidence
    ON ingredient_references (evidence_type)
    WHERE deleted_at IS NULL AND evidence_type IS NOT NULL;
CREATE INDEX idx_scientific_references_year
    ON scientific_references (published_year)
    WHERE deleted_at IS NULL AND published_year IS NOT NULL;
CREATE INDEX idx_scientific_references_doi
    ON scientific_references (doi)
    WHERE doi IS NOT NULL AND deleted_at IS NULL;

-- ============================================================
-- TRUST
-- ============================================================
CREATE INDEX idx_recalls_brand
    ON recalls (brand_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_recalls_product
    ON recalls (product_id)
    WHERE deleted_at IS NULL AND product_id IS NOT NULL;
CREATE INDEX idx_recalls_active_date
    ON recalls (announced_on DESC)
    WHERE deleted_at IS NULL AND status IN ('announced', 'ongoing');
CREATE INDEX idx_recalls_severity
    ON recalls (severity)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_recalls_status
    ON recalls (status)
    WHERE deleted_at IS NULL;
-- "Active recalls" hot list (status filter + brand)
CREATE INDEX idx_recalls_brand_status_active
    ON recalls (brand_id, severity, announced_on DESC)
    WHERE deleted_at IS NULL
      AND status IN ('announced', 'ongoing')
      AND brand_id IS NOT NULL;
-- Natural-key dedupe at ingestion (per source + case#)
CREATE UNIQUE INDEX uq_recalls_source_case
    ON recalls (source_label, case_number)
    WHERE deleted_at IS NULL
      AND case_number IS NOT NULL
      AND source_label IS NOT NULL;

CREATE INDEX idx_brand_certifications_brand
    ON brand_certifications (brand_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_brand_certifications_cert
    ON brand_certifications (certification_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_brand_certifications_expiry
    ON brand_certifications (expires_on)
    WHERE deleted_at IS NULL AND expires_on IS NOT NULL;

CREATE INDEX idx_transparency_reports_brand_year
    ON transparency_reports (brand_id, reporting_year DESC)
    WHERE deleted_at IS NULL;

-- ============================================================
-- SEARCH
-- ============================================================
-- search_keywords.normalized is now citext; b-tree index on it is fine.
-- Partial on active rows keeps the hot path cheap.
CREATE INDEX idx_search_keywords_normalized
    ON search_keywords (normalized)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_search_keywords_entity
    ON search_keywords (entity_type, entity_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_search_keywords_locale
    ON search_keywords (locale)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_search_synonyms_canonical
    ON search_synonyms (canonical);

CREATE INDEX idx_popular_searches_window
    ON popular_searches (window_end DESC);
CREATE INDEX idx_popular_searches_norm
    ON popular_searches (normalized, window_end DESC);
CREATE INDEX idx_popular_searches_locale
    ON popular_searches (locale, window_end DESC);

CREATE INDEX idx_search_logs_took_at
    ON search_logs (took_at DESC);
-- BRIN keeps the time-window scans cheap on this append-mostly table;
-- index size is ~O(blocks touched) not O(rows).
CREATE INDEX idx_search_logs_took_at_brin
    ON search_logs USING brin (took_at)
    WITH (pages_per_range = 32);
CREATE INDEX idx_search_logs_user
    ON search_logs (user_id)
    WHERE user_id IS NOT NULL;
-- Composite for "search history for user X".
CREATE INDEX idx_search_logs_user_took_at
    ON search_logs (user_id, took_at DESC)
    WHERE user_id IS NOT NULL;
CREATE INDEX idx_search_logs_normalized_at
    ON search_logs (normalized, took_at DESC);
CREATE INDEX idx_search_logs_session
    ON search_logs (session_id)
    WHERE session_id IS NOT NULL;
CREATE INDEX idx_search_logs_request
    ON search_logs (request_id)
    WHERE request_id IS NOT NULL;
-- entity_types is text[]; GIN supports array containment.
CREATE INDEX idx_search_logs_entity_types_gin
    ON search_logs USING gin (entity_types);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================
CREATE INDEX idx_product_alternatives_product
    ON product_alternatives (product_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_product_alternatives_alternative
    ON product_alternatives (alternative_product_id)
    WHERE deleted_at IS NULL AND is_active;
CREATE INDEX idx_product_alternatives_score_delta
    ON product_alternatives (score_delta DESC)
    WHERE deleted_at IS NULL AND is_active;
-- "Healthier alternatives for product X" — product + score DESC
CREATE INDEX idx_product_alternatives_product_delta
    ON product_alternatives (product_id, score_delta DESC)
    WHERE deleted_at IS NULL AND is_active AND score_delta > 0;

CREATE INDEX idx_related_products_product
    ON related_products (product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_related_products_related
    ON related_products (related_product_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_related_products_type
    ON related_products (relation_type_id)
    WHERE deleted_at IS NULL;

-- Symmetric-relation support: if the relation_type is undirected, an
-- application write into (a,b) is expected to also create a (b,a) row.
-- Index both directions for reads.

-- ============================================================
-- SEO
-- ============================================================
CREATE INDEX idx_seo_pages_kind
    ON seo_pages (kind)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_seo_pages_entity
    ON seo_pages (entity_id)
    WHERE entity_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_seo_pages_rendered_at
    ON seo_pages (last_rendered_at DESC NULLS LAST)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_seo_pages_language
    ON seo_pages (language)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_faq_items_page
    ON faq_items (page_id, sort_order)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_faq_items_language
    ON faq_items (language)
    WHERE deleted_at IS NULL;

-- ============================================================
-- AUDIT
-- ============================================================
CREATE INDEX idx_audit_logs_entity
    ON audit_logs (entity_type, entity_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_actor
    ON audit_logs (actor_id, occurred_at DESC)
    WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_occurred_at
    ON audit_logs (occurred_at DESC);
CREATE INDEX idx_audit_logs_request_id
    ON audit_logs (request_id)
    WHERE request_id IS NOT NULL;
CREATE INDEX idx_audit_logs_actor_type_time
    ON audit_logs (actor_type, occurred_at DESC)
    WHERE actor_type IS NOT NULL;
-- diff (jsonb) GIN index for forensics
CREATE INDEX idx_audit_logs_diff_gin
    ON audit_logs USING gin (diff jsonb_path_ops);

-- ============================================================
-- FULL-TEXT SEARCH VECTOR COLUMNS
-- ------------------------------------------------------------
-- Generated search vectors. We DO NOT create a separate `to_tsvector`
-- GIN below because the GENERATED ... STORED column already provides
-- one and adding another is a wasted write. We declare the GIN on
-- the generated columns instead.
-- ============================================================

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(description, '')), 'B')
    ) STORED;

ALTER TABLE ingredients
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(canonical_name::text, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(inci_name, '')), 'B')
    ) STORED;

ALTER TABLE brands
    ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('simple', coalesce(manufacturer, '')), 'B')
    ) STORED;

CREATE INDEX idx_products_search_vector
    ON products USING gin (search_vector);
CREATE INDEX idx_ingredients_search_vector
    ON ingredients USING gin (search_vector);
CREATE INDEX idx_brands_search_vector
    ON brands USING gin (search_vector);

-- ============================================================
-- DESCRIPTIVE STATISTICS / COST TARGETS
-- ------------------------------------------------------------
-- After data load, run:
--   VACUUM (ANALYZE) <table>;
--   SELECT * FROM pg_stats WHERE tablename = '<table>';
-- Compare against index definitions to confirm selectivity.
-- ============================================================
