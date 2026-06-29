-- ============================================================
-- Tuskrank — Production Database Schema
-- ------------------------------------------------------------
-- Target : PostgreSQL 14+ (compatible with Supabase)
-- Style  : 3NF, UUID primary keys, FK enforcement, audit columns
-- Soft delete : deleted_at (nullable) on mutable domain rows
-- ============================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- trigram indexes
CREATE EXTENSION IF NOT EXISTS citext;        -- case-insensitive text

-- ----------------------------------------------------------------
-- Conventions
-- ----------------------------------------------------------------
-- * Tables          : plural snake_case
-- * Columns         : snake_case
-- * Primary keys    : id uuid default gen_random_uuid()
-- * Audit columns   : created_at, updated_at, deleted_at (nullable)
-- * ENUMs           : Postgres ENUM types
-- * Foreign keys    : ON DELETE behavior chosen per relationship
-- * Indexes         : idx_<table>_<col[s]>
-- * Unique          : uq_<table>_<col[s]>
-- * Check           : ck_<table>_<rule>
-- ----------------------------------------------------------------

SET client_min_messages = WARNING;

-- ============================================================
-- SECTION 1 — LOOKUP / DOMAIN (no FKs at this layer)
-- ============================================================

-- Pet types: dog, cat, etc.
CREATE TABLE pet_types (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    description  text,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_pet_types_slug UNIQUE (slug),
    CONSTRAINT ck_pet_types_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_pet_types_name CHECK (length(name) BETWEEN 1 AND 100),
    CONSTRAINT ck_pet_types_description CHECK (
        description IS NULL OR length(description) <= 2000
    )
);

-- Life stages: puppy, adult, senior, etc.
CREATE TABLE life_stages (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_type_id  uuid NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    slug         text NOT NULL,
    name         text NOT NULL,
    sort_order   integer NOT NULL DEFAULT 0,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_life_stages_pet_slug UNIQUE (pet_type_id, slug),
    CONSTRAINT ck_life_stages_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_life_stages_sort CHECK (sort_order >= 0),
    CONSTRAINT ck_life_stages_name CHECK (length(name) BETWEEN 1 AND 100)
);

-- Breed sizes: small, medium, large, giant
CREATE TABLE breed_sizes (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_type_id  uuid NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    slug         text NOT NULL,
    name         text NOT NULL,
    min_weight_kg numeric(6, 2),
    max_weight_kg numeric(6, 2),
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_breed_sizes_pet_slug UNIQUE (pet_type_id, slug),
    CONSTRAINT ck_breed_sizes_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_breed_sizes_name CHECK (length(name) BETWEEN 1 AND 100),
    CONSTRAINT ck_breed_sizes_weight_range CHECK (
        (min_weight_kg IS NULL OR min_weight_kg >= 0)
        AND (max_weight_kg IS NULL OR max_weight_kg > 0)
        AND (min_weight_kg IS NULL OR max_weight_kg IS NULL OR min_weight_kg <= max_weight_kg)
    )
);

-- Food forms: kibble, wet, raw, freeze-dried, etc.
CREATE TABLE food_forms (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_food_forms_slug UNIQUE (slug),
    CONSTRAINT ck_food_forms_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_food_forms_name CHECK (length(name) BETWEEN 1 AND 100)
);

CREATE TYPE protein_origin AS ENUM ('animal', 'plant', 'insect', 'fungi', 'synthetic');

-- Protein sources: chicken, beef, salmon, etc.
CREATE TABLE protein_sources (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    origin       protein_origin,                        -- animal / plant / insect / etc.
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_protein_sources_slug UNIQUE (slug),
    CONSTRAINT ck_protein_sources_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_protein_sources_name CHECK (length(name) BETWEEN 1 AND 100)
);

-- Ingredient categories: protein, fat, carbohydrate, additive, ...
CREATE TABLE ingredient_categories (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    description  text,
    parent_id    uuid REFERENCES ingredient_categories(id) ON DELETE SET NULL,
    sort_order   integer NOT NULL DEFAULT 0,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_ingredient_categories_slug UNIQUE (slug),
    CONSTRAINT ck_ingredient_categories_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_ingredient_categories_sort CHECK (sort_order >= 0),
    CONSTRAINT ck_ingredient_categories_name CHECK (length(name) BETWEEN 1 AND 100),
    CONSTRAINT ck_ingredient_categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
    -- Depth policy (max 3 levels) is enforced by application code on write
    -- and audited weekly by an ops job (see database/README.md).
);

-- Marketing / nutritional claims
CREATE TABLE claims (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    description  text,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_claims_slug UNIQUE (slug),
    CONSTRAINT ck_claims_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_claims_name CHECK (length(name) BETWEEN 1 AND 200)
);

-- Tags: free-form orthogonal labels (grain-free, limited-ingredient, ...)
CREATE TABLE tags (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_tags_slug UNIQUE (slug),
    CONSTRAINT ck_tags_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_tags_name CHECK (length(name) BETWEEN 1 AND 100)
);

-- Nutrients (definition): protein, fat, fiber, ash, calcium, ...
CREATE TABLE nutrients (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            text NOT NULL,
    name            text NOT NULL,
    symbol          text,                              -- e.g. "Ca", "Vit E"
    unit            text NOT NULL,                     -- canonical unit, e.g. "%", "mg/kg"
    description     text,
    is_guaranteed   boolean NOT NULL DEFAULT true,     -- guaranteed analysis vs typical
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT uq_nutrients_slug UNIQUE (slug),
    CONSTRAINT ck_nutrients_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_nutrients_unit CHECK (length(unit) BETWEEN 1 AND 16),
    CONSTRAINT ck_nutrients_symbol CHECK (symbol IS NULL OR length(symbol) BETWEEN 1 AND 16),
    CONSTRAINT ck_nutrients_name CHECK (length(name) BETWEEN 1 AND 200)
);

-- Scientific references: citations for claims/safety
CREATE TABLE scientific_references (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title            text NOT NULL,
    authors          text,
    publication      text,
    published_year   integer,
    doi              text,
    url              text,
    summary          text,
    citation_key     text NOT NULL,                     -- compact cite key
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,
    CONSTRAINT uq_scientific_references_citation_key UNIQUE (citation_key),
    CONSTRAINT ck_scientific_references_title CHECK (length(title) BETWEEN 3 AND 1000),
    CONSTRAINT ck_scientific_references_year CHECK (
        published_year IS NULL OR (published_year BETWEEN 1800 AND 2200)
    ),
    CONSTRAINT ck_scientific_references_doi CHECK (
        doi IS NULL OR doi ~ '^10\.'
    ),
    CONSTRAINT ck_scientific_references_url CHECK (
        url IS NULL OR url ~* '^https?://'
    )
);

-- ============================================================
-- SECTION 2 — BRANDS, PRODUCTS, INGREDIENTS (CORE)
-- ============================================================

CREATE TABLE brands (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name            text NOT NULL,
    slug            text NOT NULL,
    manufacturer    text,
    country_code    char(2),                           -- ISO-3166 alpha-2
    website_url     text,
    description     text,
    logo_image_url  text,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT uq_brands_slug UNIQUE (slug),
    CONSTRAINT ck_brands_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_brands_name_nonempty CHECK (length(name) > 0 AND length(name) <= 200),
    CONSTRAINT ck_brands_country_iso CHECK (country_code ~ '^[A-Z]{2}$')
    -- NOTE: country_code is CHAR(2) so values are stored space-padded only
    -- when shorter than 2 chars. Indexes on it (idx_brands_country) treat
    -- spaces as significant in equality; this is the documented behaviour.
);

CREATE TABLE ingredients (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     text NOT NULL,
    slug                     text NOT NULL,
    inci_name                text,
    category_id              uuid REFERENCES ingredient_categories(id) ON DELETE RESTRICT,
    canonical_name           citext NOT NULL,         -- normalized lowercase name
    description              text,
    is_animal_derived        boolean NOT NULL DEFAULT false,
    is_common_allergen       boolean NOT NULL DEFAULT false,
    is_controversial         boolean NOT NULL DEFAULT false,
    is_active                boolean NOT NULL DEFAULT true,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz,
    CONSTRAINT uq_ingredients_slug UNIQUE (slug),
    CONSTRAINT ck_ingredients_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_ingredients_name CHECK (length(name) BETWEEN 1 AND 200),
    CONSTRAINT ck_ingredients_canonical CHECK (length(canonical_name) BETWEEN 1 AND 200),
    CONSTRAINT ck_ingredients_description CHECK (
        description IS NULL OR length(description) <= 8000
    )
);

CREATE TABLE products (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id            uuid NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    name                text NOT NULL,
    slug                text NOT NULL,
    description         text,
    upc                 text,                          -- GTIN/UPC (8/12/13/14 digits)
    sku                 text,                          -- manufacturer SKU
    package_size_grams  numeric(10, 2),
    package_size_label  text,                          -- e.g. "5 lb", "2.5 kg"
    food_form_id        uuid REFERENCES food_forms(id) ON DELETE RESTRICT,
    primary_protein_source_id uuid REFERENCES protein_sources(id) ON DELETE RESTRICT,
    is_active           boolean NOT NULL DEFAULT true,
    published_at        timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT uq_products_brand_slug UNIQUE (brand_id, slug),
    CONSTRAINT ck_products_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_products_name_nonempty CHECK (length(name) > 0 AND length(name) <= 200),
    CONSTRAINT ck_products_package_size CHECK (
        package_size_grams IS NULL OR package_size_grams > 0
    ),
    CONSTRAINT ck_products_upc_format CHECK (
        upc IS NULL OR upc ~ '^[0-9]{8,14}$'
    ),
    CONSTRAINT ck_products_upc_check_digit CHECK (
        upc IS NULL OR length(upc) IN (8, 12, 13, 14)
    )
);

-- Join: product ↔ ingredient (with position for ingredient order)
CREATE TABLE product_ingredients (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id     uuid NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    position          integer NOT NULL,                -- order on ingredient panel
    raw_label         text,                            -- verbatim label string
    is_primary        boolean NOT NULL DEFAULT false,  -- primary ingredient flag
    percentage_value  numeric(6, 3),
    is_active         boolean NOT NULL DEFAULT true,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    CONSTRAINT ck_product_ingredients_position_pos CHECK (position > 0 AND position <= 500),
    CONSTRAINT ck_product_ingredients_percentage CHECK (
        percentage_value IS NULL OR (percentage_value > 0 AND percentage_value <= 100)
    ),
    CONSTRAINT ck_product_ingredients_raw_label_len CHECK (
        raw_label IS NULL OR length(raw_label) BETWEEN 1 AND 500
    )
);

-- ============================================================
-- SECTION 3 — PRODUCT INFORMATION EXTENSIONS
-- ============================================================

CREATE TABLE categories (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_type_id     uuid NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    slug            text NOT NULL,
    name            text NOT NULL,
    description     text,
    parent_id       uuid REFERENCES categories(id) ON DELETE SET NULL,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT uq_categories_pet_slug UNIQUE (pet_type_id, slug),
    CONSTRAINT ck_categories_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_categories_name CHECK (length(name) BETWEEN 1 AND 100),
    CONSTRAINT ck_categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

-- Product × category × life stage × breed size — fan-out
-- pet_type is required (every product targets ≥1 species); the other
-- dimensions narrow the target.
CREATE TABLE product_targeting (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pet_type_id     uuid NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    life_stage_id   uuid REFERENCES life_stages(id) ON DELETE RESTRICT,
    breed_size_id   uuid REFERENCES breed_sizes(id) ON DELETE RESTRICT,
    category_id     uuid REFERENCES categories(id) ON DELETE RESTRICT,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT uq_product_targeting UNIQUE (product_id, pet_type_id, life_stage_id, breed_size_id, category_id),
    CONSTRAINT ck_product_targeting_dimensions CHECK (
        life_stage_id IS NOT NULL
        OR breed_size_id IS NOT NULL
        OR category_id   IS NOT NULL
    ),
    CONSTRAINT ck_product_targeting_breed_life_combo CHECK (
        breed_size_id IS NULL OR life_stage_id IS NULL OR category_id IS NOT NULL
        OR breed_size_id IS NOT NULL
    )
);

CREATE TABLE product_images (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    storage_path     text NOT NULL,                   -- supabase storage path
    public_url       text NOT NULL,
    alt_text         text,
    width_px         integer,
    height_px        integer,
    bytes            bigint,
    mime_type        text,
    sort_order       integer NOT NULL DEFAULT 0,
    is_primary       boolean NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    deleted_at       timestamptz,
    CONSTRAINT ck_product_images_width CHECK (width_px IS NULL OR width_px > 0),
    CONSTRAINT ck_product_images_height CHECK (height_px IS NULL OR height_px > 0),
    CONSTRAINT ck_product_images_bytes CHECK (bytes IS NULL OR bytes > 0),
    CONSTRAINT ck_product_images_sort CHECK (sort_order >= 0),
    CONSTRAINT ck_product_images_mime CHECK (
        mime_type IS NULL OR mime_type ~ '^[a-z]+/[a-z0-9.+-]+$'
    ),
    CONSTRAINT ck_product_images_url CHECK (public_url ~* '^https?://'),
    CONSTRAINT ck_product_images_storage_path CHECK (
        storage_path ~ '^[A-Za-z0-9._/-]+$'
    ),
    CONSTRAINT ck_product_images_alt CHECK (alt_text IS NULL OR length(alt_text) <= 1000)
);

-- Nutrition profile (one guaranteed analysis row per product; history captured separately)
CREATE TABLE nutrition_profiles (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    kcal_per_100g       numeric(7, 3),
    kcal_per_cup        numeric(7, 3),
    moisture_pct        numeric(5, 2),
    effective_from      date NOT NULL,
    effective_to        date,
    source              nutrition_source,
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT ck_nutrition_profiles_kcal CHECK (
        kcal_per_100g IS NULL OR (kcal_per_100g > 0 AND kcal_per_100g <= 1000)
    ),
    CONSTRAINT ck_nutrition_profiles_kcal_cup CHECK (
        kcal_per_cup IS NULL OR (kcal_per_cup > 0 AND kcal_per_cup <= 5000)
    ),
    CONSTRAINT ck_nutrition_profiles_moisture CHECK (
        moisture_pct IS NULL OR (moisture_pct >= 0 AND moisture_pct <= 100)
    ),
    CONSTRAINT ck_nutrition_profiles_dates CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    ),
    CONSTRAINT ck_nutrition_profiles_notes CHECK (
        notes IS NULL OR length(notes) <= 4000
    )
);
-- (History-friendly: a product MAY have multiple historical nutrition
-- profiles. Uniqueness of the *currently effective* profile is enforced
-- in indexes.sql as a partial unique index on `effective_to IS NULL`.)

CREATE TYPE nutrient_bound AS ENUM ('exact', 'min', 'max', 'typical');

-- Product × nutrient values
-- amount_unit is normalized to the unit canonical to the parent nutrient.
-- For unit-ambiguous nutrients (e.g. energy in kcal vs kJ), record the
-- canonical unit at write time and validate via trigger if needed.
CREATE TABLE product_nutrients (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id               uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    nutrient_id              uuid NOT NULL REFERENCES nutrients(id) ON DELETE RESTRICT,
    nutrition_profile_id     uuid REFERENCES nutrition_profiles(id) ON DELETE CASCADE,
    amount                   numeric(12, 6) NOT NULL,
    unit                     text NOT NULL,            -- canonical unit at write time
    bound                    nutrient_bound NOT NULL DEFAULT 'exact',
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz,
    CONSTRAINT ck_product_nutrients_amount CHECK (amount >= 0),
    CONSTRAINT ck_product_nutrients_unit CHECK (length(unit) BETWEEN 1 AND 16)
    -- Uniqueness (active rows):
    --   1. (product_id, nutrient_id, bound) WHERE nutrition_profile_id IS NULL
    --   2. (product_id, nutrient_id, bound, nutrition_profile_id) WHERE NOT NULL
    -- declared as partial unique indexes in indexes.sql
);

CREATE TABLE product_claims (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    claim_id          uuid NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    evidence_note     text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    CONSTRAINT uq_product_claims UNIQUE (product_id, claim_id),
    CONSTRAINT ck_product_claims_note CHECK (
        evidence_note IS NULL OR length(evidence_note) <= 4000
    )
);

CREATE TABLE product_tags (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id       uuid NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_product_tags UNIQUE (product_id, tag_id)
);

-- ============================================================
-- SECTION 4 — SCORING
-- ============================================================

CREATE TABLE ingredient_scores (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id       uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    score               numeric(5, 2) NOT NULL,
    grade               text NOT NULL,                -- A+ ... F
    reasoning           text,
    scoring_version     text NOT NULL,
    is_current          boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT ck_ingredient_scores_score_range CHECK (
        score >= 0 AND score <= 100
    ),
    CONSTRAINT ck_ingredient_scores_grade CHECK (
        grade ~ '^([ABCDEF][+-]?)$'
    ),
    CONSTRAINT ck_ingredient_scores_version CHECK (length(scoring_version) BETWEEN 1 AND 32),
    CONSTRAINT ck_ingredient_scores_reasoning CHECK (
        reasoning IS NULL OR length(reasoning) <= 4000
    )
    -- "single current" partial unique: at most one is_current=true row per
    -- ingredient (across active rows). Enforced in indexes.sql.
);

CREATE TABLE product_scores (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    overall_score       numeric(5, 2) NOT NULL,
    quality_score       numeric(5, 2),
    safety_score        numeric(5, 2),
    nutrition_score     numeric(5, 2),
    transparency_score  numeric(5, 2),
    scoring_version     text NOT NULL,
    is_current          boolean NOT NULL DEFAULT true,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT ck_product_scores_overall CHECK (
        overall_score >= 0 AND overall_score <= 100
    ),
    CONSTRAINT ck_product_scores_quality CHECK (
        quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)
    ),
    CONSTRAINT ck_product_scores_safety CHECK (
        safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100)
    ),
    CONSTRAINT ck_product_scores_nutrition CHECK (
        nutrition_score IS NULL OR (nutrition_score >= 0 AND nutrition_score <= 100)
    ),
    CONSTRAINT ck_product_scores_transparency CHECK (
        transparency_score IS NULL OR (transparency_score >= 0 AND transparency_score <= 100)
    ),
    CONSTRAINT ck_product_scores_version CHECK (length(scoring_version) BETWEEN 1 AND 32)
    -- "single current" partial unique: at most one is_current=true row per
    -- product (across active rows). Enforced in indexes.sql.
);

CREATE TABLE score_history (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    overall_score       numeric(5, 2) NOT NULL,
    quality_score       numeric(5, 2),
    safety_score        numeric(5, 2),
    nutrition_score     numeric(5, 2),
    transparency_score  numeric(5, 2),
    scoring_version     text NOT NULL,
    computed_at         timestamptz NOT NULL DEFAULT now(),
    triggered_by        score_history_trigger,        -- manual / scheduled / data_change / import / seed
    notes               text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_score_history_overall CHECK (
        overall_score >= 0 AND overall_score <= 100
    ),
    CONSTRAINT ck_score_history_quality CHECK (
        quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100)
    ),
    CONSTRAINT ck_score_history_safety CHECK (
        safety_score IS NULL OR (safety_score >= 0 AND safety_score <= 100)
    ),
    CONSTRAINT ck_score_history_nutrition CHECK (
        nutrition_score IS NULL OR (nutrition_score >= 0 AND nutrition_score <= 100)
    ),
    CONSTRAINT ck_score_history_transparency CHECK (
        transparency_score IS NULL OR (transparency_score >= 0 AND transparency_score <= 100)
    ),
    CONSTRAINT ck_score_history_version CHECK (length(scoring_version) BETWEEN 1 AND 32),
    CONSTRAINT ck_score_history_notes CHECK (
        notes IS NULL OR length(notes) <= 4000
    )
    -- Append-only by convention. Direct UPDATE/DELETE are revoked from
    -- application roles; use fn_write_audit for any audit-meta updates and
    -- never modify scoring history directly. Future retention:
    --   DELETE FROM score_history WHERE computed_at < now() - interval '2 years';
    -- is run from a maintenance job after partitioning migration.
);

-- ============================================================
-- SECTION 5 — SCIENCE / CITATIONS
-- ============================================================

CREATE TYPE evidence_type_t AS ENUM ('supports', 'refutes', 'neutral');

CREATE TABLE ingredient_references (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id      uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    reference_id       uuid NOT NULL REFERENCES scientific_references(id) ON DELETE CASCADE,
    evidence_type      evidence_type_t,               -- supports / refutes / neutral
    relevance_score    numeric(4, 2),
    notes              text,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT uq_ingredient_references UNIQUE (ingredient_id, reference_id),
    CONSTRAINT ck_ingredient_references_relevance CHECK (
        relevance_score IS NULL OR (relevance_score >= 0 AND relevance_score <= 10)
    ),
    CONSTRAINT ck_ingredient_references_notes CHECK (
        notes IS NULL OR length(notes) <= 4000
    )
);

-- ============================================================
-- SECTION 6 — TRUST
-- ============================================================

CREATE TYPE recall_severity AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE recall_status   AS ENUM ('announced', 'ongoing', 'resolved', 'withdrawn');
CREATE TYPE nutrition_source AS ENUM ('label', 'lab', 'vendor', 'calculated', 'official');
CREATE TYPE score_history_trigger AS ENUM ('manual', 'scheduled', 'data_change', 'import', 'seed');

CREATE TABLE recalls (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id           uuid REFERENCES brands(id) ON DELETE SET NULL,
    product_id         uuid REFERENCES products(id) ON DELETE SET NULL,
    title              text NOT NULL,
    description        text NOT NULL,
    announced_on       date NOT NULL,
    resolved_on        date,
    severity           recall_severity NOT NULL,
    status             recall_status NOT NULL DEFAULT 'announced',
    source_label       text,                          -- e.g. FDA, manufacturer
    source_url         text,
    case_number        text,                          -- external case id
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    deleted_at         timestamptz,
    CONSTRAINT ck_recalls_dates CHECK (
        resolved_on IS NULL OR resolved_on >= announced_on
    ),
    CONSTRAINT ck_recalls_title_nonempty CHECK (length(title) BETWEEN 1 AND 500),
    CONSTRAINT ck_recalls_description_nonempty CHECK (length(description) BETWEEN 1 AND 10000),
    CONSTRAINT ck_recalls_source_url CHECK (source_url IS NULL OR source_url ~* '^https?://')
    -- Natural-id uniqueness for de-duplication on ingestion is enforced in
    -- indexes.sql as a partial unique on (source_label, case_number)
    -- WHERE case_number IS NOT NULL AND deleted_at IS NULL.
);

CREATE TABLE certifications (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    description  text,
    issuer       text NOT NULL,
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_certifications_slug UNIQUE (slug),
    CONSTRAINT ck_certifications_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_certifications_name CHECK (length(name) BETWEEN 1 AND 200),
    CONSTRAINT ck_certifications_issuer CHECK (length(issuer) BETWEEN 1 AND 200),
    CONSTRAINT ck_certifications_description CHECK (
        description IS NULL OR length(description) <= 8000
    )
);

CREATE TABLE brand_certifications (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id          uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    certification_id  uuid NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    issued_on         date NOT NULL,
    expires_on        date,
    certificate_url   text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now(),
    deleted_at        timestamptz,
    CONSTRAINT uq_brand_certifications UNIQUE (brand_id, certification_id),
    CONSTRAINT ck_brand_certifications_dates CHECK (
        expires_on IS NULL OR expires_on >= issued_on
    ),
    CONSTRAINT ck_brand_certifications_url CHECK (
        certificate_url IS NULL OR certificate_url ~* '^https?://'
    )
);

CREATE TABLE transparency_reports (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id     uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    reporting_year integer NOT NULL,
    title        text NOT NULL,
    summary      text,
    url          text,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_transparency_reports UNIQUE (brand_id, reporting_year),
    CONSTRAINT ck_transparency_reports_year CHECK (
        reporting_year BETWEEN 1900 AND 2200
    ),
    CONSTRAINT ck_transparency_reports_title CHECK (length(title) BETWEEN 1 AND 300),
    CONSTRAINT ck_transparency_reports_url CHECK (
        url IS NULL OR url ~* '^https?://'
    )
);

-- ============================================================
-- SECTION 7 — SEARCH
-- ============================================================

CREATE TABLE search_keywords (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized    citext NOT NULL,
    raw           text NOT NULL,
    entity_type   text NOT NULL,                  -- product / brand / ingredient / general
    entity_id     uuid,                          -- nullable; FK enforced by application
    locale        text NOT NULL DEFAULT 'en-US',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT ck_search_keywords_entity CHECK (
        entity_type IN ('product', 'brand', 'ingredient', 'general')
    ),
    CONSTRAINT ck_search_keywords_norm_nonempty CHECK (length(normalized) BETWEEN 1 AND 200),
    CONSTRAINT ck_search_keywords_raw CHECK (length(raw) BETWEEN 1 AND 500),
    CONSTRAINT ck_search_keywords_locale CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    CONSTRAINT uq_search_keywords_unique UNIQUE (normalized, entity_type, entity_id, locale)
);

CREATE TABLE search_synonyms (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical    citext NOT NULL,
    synonym      citext NOT NULL,
    locale       text NOT NULL DEFAULT 'en-US',
    entity_type  text,                           -- optional narrowing
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_search_synonyms UNIQUE (canonical, synonym, locale),
    CONSTRAINT ck_search_synonyms_norm CHECK (
        length(canonical) BETWEEN 1 AND 200
        AND length(synonym)  BETWEEN 1 AND 200
    ),
    CONSTRAINT ck_search_synonyms_entity CHECK (
        entity_type IS NULL OR entity_type IN ('product','brand','ingredient','general')
    ),
    CONSTRAINT ck_search_synonyms_no_self CHECK (canonical <> synonym)
);

CREATE TABLE popular_searches (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    normalized    citext NOT NULL,
    window_start  timestamptz NOT NULL,
    window_end    timestamptz NOT NULL,
    count         bigint NOT NULL,
    locale        text NOT NULL DEFAULT 'en-US',
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    deleted_at    timestamptz,
    CONSTRAINT uq_popular_searches_window UNIQUE (normalized, window_start, window_end),
    CONSTRAINT ck_popular_searches_dates CHECK (window_end > window_start),
    CONSTRAINT ck_popular_searches_count CHECK (count >= 0),
    CONSTRAINT ck_popular_searches_window_len CHECK (
        window_end - window_start >= interval '1 hour'
        AND window_end - window_start <= interval '7 days'
    )
);

-- Search analytics (raw event log; not the aggregate)
-- High-volume table; partitioning is planned (see database/README.md).
CREATE TABLE search_logs (
    id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    took_at         timestamptz  NOT NULL DEFAULT now(),
    user_id         uuid,
    session_id      text,
    normalized      text         NOT NULL,
    raw             text         NOT NULL,
    result_count    integer      NOT NULL,
    latency_ms      integer      NOT NULL,
    entity_types    text[]       NOT NULL DEFAULT '{}',
    request_id      text,
    ip_address      inet,
    user_agent      text,
    CONSTRAINT ck_search_logs_count CHECK (result_count >= 0),
    CONSTRAINT ck_search_logs_latency CHECK (latency_ms >= 0 AND latency_ms <= 60000),
    CONSTRAINT ck_search_logs_norm_nonempty CHECK (length(normalized) BETWEEN 1 AND 500),
    CONSTRAINT ck_search_logs_raw_nonempty CHECK (length(raw) BETWEEN 1 AND 500),
    CONSTRAINT ck_search_logs_session_len CHECK (
        session_id IS NULL OR length(session_id) BETWEEN 1 AND 128
    ),
    CONSTRAINT ck_search_logs_user_agent_len CHECK (
        user_agent IS NULL OR length(user_agent) <= 512
    ),
    CONSTRAINT ck_search_logs_ip CHECK (ip_address IS NULL OR family(ip_address) IN (4, 6)),
    CONSTRAINT ck_search_logs_request_id_len CHECK (
        request_id IS NULL OR length(request_id) BETWEEN 1 AND 64
    )
);

-- ============================================================
-- SECTION 8 — RECOMMENDATIONS
-- ============================================================

CREATE TABLE product_alternatives (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id               uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    score_delta              numeric(5, 2) NOT NULL,
    reasoning                text,
    scoring_version          text NOT NULL,
    is_active                boolean NOT NULL DEFAULT true,
    created_at               timestamptz NOT NULL DEFAULT now(),
    updated_at               timestamptz NOT NULL DEFAULT now(),
    deleted_at               timestamptz,
    CONSTRAINT uq_product_alternatives UNIQUE (product_id, alternative_product_id),
    CONSTRAINT ck_product_alternatives_no_self CHECK (product_id <> alternative_product_id),
    CONSTRAINT ck_product_alternatives_delta CHECK (
        score_delta >= -100 AND score_delta <= 100
    ),
    CONSTRAINT ck_product_alternatives_reasoning CHECK (
        reasoning IS NULL OR length(reasoning) <= 4000
    ),
    CONSTRAINT ck_product_alternatives_version CHECK (length(scoring_version) BETWEEN 1 AND 32)
);

CREATE TABLE relation_types (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         text NOT NULL,
    name         text NOT NULL,
    description  text,
    is_directed  boolean NOT NULL DEFAULT true,       -- symmetric or asymmetric?
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT uq_relation_types_slug UNIQUE (slug),
    CONSTRAINT ck_relation_types_slug CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT ck_relation_types_name CHECK (length(name) BETWEEN 1 AND 100),
    CONSTRAINT ck_relation_types_description CHECK (
        description IS NULL OR length(description) <= 4000
    )
);

CREATE TABLE related_products (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    related_product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    relation_type_id    uuid NOT NULL REFERENCES relation_types(id) ON DELETE RESTRICT,
    weight              numeric(4, 2) NOT NULL DEFAULT 1.0,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz,
    CONSTRAINT uq_related_products UNIQUE (product_id, related_product_id, relation_type_id),
    CONSTRAINT ck_related_products_no_self CHECK (product_id <> related_product_id),
    CONSTRAINT ck_related_products_weight CHECK (weight >= 0 AND weight <= 10)
);

-- ============================================================
-- SECTION 9 — SEO
-- ============================================================

CREATE TYPE seo_page_kind AS ENUM ('product', 'ingredient', 'brand', 'comparison', 'editorial', 'category');

CREATE TABLE seo_pages (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind            seo_page_kind NOT NULL,
    slug            text NOT NULL,                   -- URL slug for the page
    entity_id       uuid,                            -- optional back-reference
    title           text NOT NULL,
    meta_title      text,
    meta_description text,
    canonical_url   text,
    robots          text NOT NULL DEFAULT 'index,follow',
    language        text NOT NULL DEFAULT 'en-US',
    structured_data jsonb,                           -- JSON-LD blob
    last_rendered_at timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    deleted_at      timestamptz,
    CONSTRAINT uq_seo_pages_kind_slug UNIQUE (kind, slug),
    CONSTRAINT uq_seo_pages_canonical UNIQUE (canonical_url),
    CONSTRAINT ck_seo_pages_slug CHECK (slug ~ '^[a-z0-9-]+(/[a-z0-9-]+)*$' AND length(slug) <= 512),
    CONSTRAINT ck_seo_pages_title CHECK (length(title) BETWEEN 1 AND 300),
    CONSTRAINT ck_seo_pages_meta_title CHECK (meta_title IS NULL OR length(meta_title) BETWEEN 1 AND 200),
    CONSTRAINT ck_seo_pages_meta_description CHECK (
        meta_description IS NULL OR length(meta_description) BETWEEN 1 AND 1000
    ),
    CONSTRAINT ck_seo_pages_robots CHECK (
        robots ~ '^([a-z]+(,[a-z]+)*)$'
    ),
    CONSTRAINT ck_seo_pages_language CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    CONSTRAINT ck_seo_pages_canonical_url CHECK (
        canonical_url IS NULL OR canonical_url ~* '^https?://'
    ),
    CONSTRAINT ck_seo_pages_structured_data_obj CHECK (
        structured_data IS NULL OR jsonb_typeof(structured_data) = 'object'
    ),
    CONSTRAINT ck_seo_pages_structured_data_len CHECK (
        structured_data IS NULL OR length(structured_data::text) <= 50000
    )
);

CREATE TABLE faq_items (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id      uuid NOT NULL REFERENCES seo_pages(id) ON DELETE CASCADE,
    question     text NOT NULL,
    answer       text NOT NULL,
    sort_order   integer NOT NULL DEFAULT 0,
    language     text NOT NULL DEFAULT 'en-US',
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    deleted_at   timestamptz,
    CONSTRAINT ck_faq_items_q_nonempty CHECK (length(question) BETWEEN 3 AND 500),
    CONSTRAINT ck_faq_items_a_nonempty CHECK (length(answer) BETWEEN 1 AND 4000),
    CONSTRAINT ck_faq_items_sort CHECK (sort_order >= 0)
);

-- ============================================================
-- SECTION 10 — SYSTEM / AUDIT
-- ============================================================

CREATE TYPE actor_type_t AS ENUM ('admin', 'system', 'user', 'job', 'service');

CREATE TABLE audit_logs (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    occurred_at   timestamptz NOT NULL DEFAULT now(),
    actor_id      uuid,                              -- nullable for system-triggered events
    actor_type    actor_type_t,
    entity_type   text NOT NULL,
    entity_id     uuid NOT NULL,
    action        text NOT NULL,                     -- create / update / delete / publish / ...
    before        jsonb,
    after         jsonb,
    diff          jsonb GENERATED ALWAYS AS (
        CASE
            WHEN before IS NULL AND after IS NULL THEN NULL
            ELSE jsonb_build_object('before', before, 'after', after)
        END
    ) STORED,
    request_id    text,
    ip_address    inet,
    user_agent    text,
    CONSTRAINT ck_audit_logs_action_nonempty CHECK (length(action) BETWEEN 1 AND 64),
    CONSTRAINT ck_audit_logs_entity_nonempty CHECK (length(entity_type) BETWEEN 1 AND 64),
    CONSTRAINT ck_audit_logs_ip_or_null CHECK (ip_address IS NULL OR family(ip_address) IN (4, 6)),
    CONSTRAINT ck_audit_logs_before_size CHECK (
        before IS NULL OR length(before::text) <= 100000
    ),
    CONSTRAINT ck_audit_logs_after_size CHECK (
        after IS NULL OR length(after::text) <= 100000
    ),
    CONSTRAINT ck_audit_logs_request_id_len CHECK (
        request_id IS NULL OR length(request_id) BETWEEN 1 AND 64
    ),
    CONSTRAINT ck_audit_logs_user_agent_len CHECK (
        user_agent IS NULL OR length(user_agent) <= 512
    )
);
-- Partitioning strategy: see database/README.md. The column shape is
-- intentionally forward-compatible (occurred_at is the natural partition key).
-- A subsequent Sprint will execute:
--   ALTER TABLE audit_logs ... RANGE PARTITION BY occurred_at;
-- without changing application contracts (uuid id, occurred_at).

-- Bot mitigation: prevent accidental direct UPDATE/DELETE on raw search logs in app code paths.
-- (Audit table is append-only by convention.)
