-- ============================================================
-- Tuskrank Database Schema
-- Pet Food Search & Intelligence Platform
-- PostgreSQL 16 / Supabase Compatible
-- ============================================================

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE pet_type_enum AS ENUM ('dog', 'cat', 'bird', 'fish', 'small_animal', 'reptile');

CREATE TYPE food_form_enum AS ENUM (
    'dry_kibble', 'wet_canned', 'wet_pouch', 'semi_moist',
    'raw_frozen', 'raw_freeze_dried', 'dehydrated',
    'fresh_refrigerated', 'treat', 'supplement', 'topper', 'mixer'
);

CREATE TYPE protein_source_enum AS ENUM (
    'chicken', 'turkey', 'beef', 'lamb', 'pork', 'fish',
    'salmon', 'duck', 'venison', 'rabbit', 'bison', 'boar',
    'plant_based', 'insect', 'mixed', 'other'
);

CREATE TYPE breed_size_enum AS ENUM ('toy', 'small', 'medium', 'large', 'giant');

CREATE TYPE safety_tier_enum AS ENUM ('premium', 'standard', 'low', 'controversial', 'unknown');

CREATE TYPE recall_severity_enum AS ENUM ('low', 'moderate', 'high', 'critical');

CREATE TYPE recall_status_enum AS ENUM ('active', 'resolved', 'expired');

CREATE TYPE score_grade_enum AS ENUM ('A', 'B', 'C', 'D', 'F');

CREATE TYPE analysis_status_enum AS ENUM ('pending', 'generating', 'completed', 'failed');

CREATE TYPE certification_authority_enum AS ENUM (
    'aafco', 'usda_organic', 'nsf', 'fda', 'third_party', 'self_claimed'
);

CREATE TYPE seo_page_type_enum AS ENUM (
    'product', 'ingredient', 'brand', 'category', 'comparison', 'guide', 'landing'
);

CREATE TYPE audit_action_enum AS ENUM (
    'create', 'update', 'delete', 'restore', 'import', 'score_compute', 'analysis_generate'
);

CREATE TYPE claim_type_enum AS ENUM (
    'nutritional_adequacy', 'life_stage', 'breed_size', 'health_benefit',
    'dietary', 'manufacturing', 'certification', 'marketing'
);

-- ============================================================
-- LOOKUP TABLES
-- ============================================================

-- Pet types (dog, cat, etc.)
CREATE TABLE pet_types (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    slug            VARCHAR(60) NOT NULL UNIQUE,
    plural_name     VARCHAR(50) NOT NULL,
    description     TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Life stages (puppy, adult, senior, etc.)
CREATE TABLE life_stages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    slug            VARCHAR(60) NOT NULL UNIQUE,
    pet_type_id     UUID NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    description     TEXT,
    min_age_months  INTEGER,
    max_age_months  INTEGER,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Food forms (dry kibble, wet canned, etc.)
CREATE TABLE food_forms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(80) NOT NULL,
    slug            VARCHAR(90) NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Protein sources
CREATE TABLE protein_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(50) NOT NULL,
    slug            VARCHAR(60) NOT NULL UNIQUE,
    category        protein_source_enum NOT NULL,
    description     TEXT,
    is_common_allergen BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ingredient categories
CREATE TABLE ingredient_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(110) NOT NULL UNIQUE,
    description     TEXT,
    parent_id       UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ingredient_categories_name_parent UNIQUE (name, parent_id)
);

-- Breed sizes
CREATE TABLE breed_sizes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(30) NOT NULL,
    slug            VARCHAR(40) NOT NULL UNIQUE,
    weight_min_lbs  DECIMAL(6,2),
    weight_max_lbs  DECIMAL(6,2),
    description     TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Claims (AAFCO compliant, grain-free, etc.)
CREATE TABLE claims (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(210) NOT NULL UNIQUE,
    claim_type      claim_type_enum NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags
CREATE TABLE tags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(110) NOT NULL UNIQUE,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories (product categories)
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(110) NOT NULL UNIQUE,
    description     TEXT,
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
    pet_type_id     UUID NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    image_url       TEXT,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_categories_name_parent UNIQUE (name, parent_id)
);

-- Nutrients (protein, fat, fiber, moisture, etc.)
CREATE TABLE nutrients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(110) NOT NULL UNIQUE,
    unit            VARCHAR(20) NOT NULL DEFAULT '%',
    description     TEXT,
    is_guaranteed   BOOLEAN NOT NULL DEFAULT false,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Brands
CREATE TABLE brands (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    slug            VARCHAR(210) NOT NULL UNIQUE,
    website_url     TEXT,
    headquarters     VARCHAR(200),
    country         VARCHAR(100),
    year_founded    INTEGER,
    description     TEXT,
    logo_url        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_brands_year_founded CHECK (year_founded IS NULL OR (year_founded >= 1800 AND year_founded <= EXTRACT(YEAR FROM now())))
);

-- Products
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
    name            VARCHAR(300) NOT NULL,
    slug            VARCHAR(310) NOT NULL,
    description     TEXT,
    category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    pet_type_id     UUID NOT NULL REFERENCES pet_types(id) ON DELETE RESTRICT,
    food_form_id    UUID NOT NULL REFERENCES food_forms(id) ON DELETE RESTRICT,
    life_stage_id   UUID REFERENCES life_stages(id) ON DELETE SET NULL,
    breed_size_id   UUID REFERENCES breed_sizes(id) ON DELETE SET NULL,
    primary_protein_id UUID REFERENCES protein_sources(id) ON DELETE SET NULL,
    package_weight_oz DECIMAL(8,2),
    package_weight_label VARCHAR(100),
    price_cents     INTEGER,
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD',
    aafco_statement TEXT,
    manufacturer    VARCHAR(300),
    manufacturing_country VARCHAR(100),
    upc             VARCHAR(20),
    external_url    TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT uq_products_brand_slug UNIQUE (brand_id, slug),
    CONSTRAINT chk_products_price CHECK (price_cents IS NULL OR price_cents >= 0),
    CONSTRAINT chk_products_weight CHECK (package_weight_oz IS NULL OR package_weight_oz > 0),
    CONSTRAINT chk_products_currency CHECK (currency ~ '^[A-Z]{3}$')
);

-- Ingredients
CREATE TABLE ingredients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(300) NOT NULL,
    slug            VARCHAR(310) NOT NULL UNIQUE,
    category_id     UUID REFERENCES ingredient_categories(id) ON DELETE SET NULL,
    description     TEXT,
    scientific_name VARCHAR(300),
    safety_tier     safety_tier_enum NOT NULL DEFAULT 'unknown',
    is_common_allergen BOOLEAN NOT NULL DEFAULT false,
    is_artificial   BOOLEAN NOT NULL DEFAULT false,
    is_filler       BOOLEAN NOT NULL DEFAULT false,
    is_preservative BOOLEAN NOT NULL DEFAULT false,
    nutritional_function TEXT,
    safety_notes    TEXT,
    wikipedia_url   TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- Product-Ingredient join table
CREATE TABLE product_ingredients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
    ordinal_position INTEGER NOT NULL DEFAULT 0,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    quantity_pct    DECIMAL(5,2),
    quantity_label  VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_ingredient UNIQUE (product_id, ingredient_id),
    CONSTRAINT chk_pi_quantity CHECK (quantity_pct IS NULL OR (quantity_pct > 0 AND quantity_pct <= 100)),
    CONSTRAINT chk_pi_ordinal CHECK (ordinal_position >= 0)
);

-- ============================================================
-- PRODUCT INFORMATION
-- ============================================================

-- Product images
CREATE TABLE product_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    alt_text        VARCHAR(300),
    width_px        INTEGER,
    height_px       INTEGER,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_pi_images_sort CHECK (sort_order >= 0)
);

-- Nutrition profiles (guaranteed analysis per product)
CREATE TABLE nutrition_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(100),
    serving_size_g  DECIMAL(8,2),
    calories_per_100g DECIMAL(8,2),
    metabolizable_energy_kcal DECIMAL(8,2),
    moisture_basis  VARCHAR(50) DEFAULT 'as_fed',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT uq_nutrition_profile_product UNIQUE (product_id),
    CONSTRAINT chk_nutrition_calories CHECK (calories_per_100g IS NULL OR calories_per_100g > 0)
);

-- Product-Nutrient values
CREATE TABLE product_nutrients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nutrition_profile_id UUID NOT NULL REFERENCES nutrition_profiles(id) ON DELETE CASCADE,
    nutrient_id     UUID NOT NULL REFERENCES nutrients(id) ON DELETE RESTRICT,
    min_value       DECIMAL(8,2),
    max_value       DECIMAL(8,2),
    guaranteed_value DECIMAL(8,2),
    dry_matter_basis DECIMAL(8,2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_nutrient UNIQUE (nutrition_profile_id, nutrient_id),
    CONSTRAINT chk_pn_values CHECK (
        guaranteed_value IS NULL OR guaranteed_value >= 0
    ),
    CONSTRAINT chk_pn_min_max CHECK (
        (min_value IS NULL OR min_value >= 0) AND
        (max_value IS NULL OR max_value >= 0) AND
        (min_value IS NULL OR max_value IS NULL OR min_value <= max_value)
    )
);

-- Product claims join
CREATE TABLE product_claims (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    claim_id        UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    verified_by     VARCHAR(200),
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_claim UNIQUE (product_id, claim_id)
);

-- Product tags join
CREATE TABLE product_tags (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id          UUID NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_tag UNIQUE (product_id, tag_id)
);

-- ============================================================
-- SCORING
-- ============================================================

-- Ingredient scores
CREATE TABLE ingredient_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quality_score   DECIMAL(5,2) NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
    safety_score    DECIMAL(5,2) NOT NULL CHECK (safety_score >= 0 AND safety_score <= 100),
    nutritional_value_score DECIMAL(5,2) NOT NULL CHECK (nutritional_value_score >= 0 AND nutritional_value_score <= 100),
    overall_score   DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    grade           score_grade_enum NOT NULL,
    rationale       TEXT,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ingredient_score_active UNIQUE (ingredient_id)
);

-- Product scores
CREATE TABLE product_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    ingredient_quality_score DECIMAL(5,2) NOT NULL CHECK (ingredient_quality_score >= 0 AND ingredient_quality_score <= 100),
    nutritional_adequacy_score DECIMAL(5,2) NOT NULL CHECK (nutritional_adequacy_score >= 0 AND nutritional_adequacy_score <= 100),
    safety_score    DECIMAL(5,2) NOT NULL CHECK (safety_score >= 0 AND safety_score <= 100),
    transparency_score DECIMAL(5,2) NOT NULL CHECK (transparency_score >= 0 AND transparency_score <= 100),
    overall_score   DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    grade           score_grade_enum NOT NULL,
    score_version   INTEGER NOT NULL DEFAULT 1,
    rationale       TEXT,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_score_active UNIQUE (product_id),
    CONSTRAINT chk_ps_version CHECK (score_version >= 1)
);

-- Score history (track score changes over time)
CREATE TABLE score_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    score_version   INTEGER NOT NULL,
    overall_score   DECIMAL(5,2) NOT NULL,
    ingredient_quality_score DECIMAL(5,2) NOT NULL,
    nutritional_adequacy_score DECIMAL(5,2) NOT NULL,
    safety_score    DECIMAL(5,2) NOT NULL,
    transparency_score DECIMAL(5,2) NOT NULL,
    grade           score_grade_enum NOT NULL,
    change_reason   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_score_history_version UNIQUE (product_id, score_version),
    CONSTRAINT chk_sh_version CHECK (score_version >= 1)
);

-- ============================================================
-- SCIENCE
-- ============================================================

-- Scientific references
CREATE TABLE scientific_references (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    authors         TEXT,
    journal         VARCHAR(300),
    year            INTEGER,
    doi             VARCHAR(100),
    url             TEXT,
    abstract        TEXT,
    reference_type  VARCHAR(50) NOT NULL DEFAULT 'study',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_sr_year CHECK (year IS NULL OR (year >= 1900 AND year <= EXTRACT(YEAR FROM now())))
);

-- Ingredient-Reference join
CREATE TABLE ingredient_references (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    reference_id    UUID NOT NULL REFERENCES scientific_references(id) ON DELETE CASCADE,
    relevance_note  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ingredient_reference UNIQUE (ingredient_id, reference_id)
);

-- ============================================================
-- TRUST
-- ============================================================

-- Recalls
CREATE TABLE recalls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id        UUID REFERENCES brands(id) ON DELETE SET NULL,
    product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
    recall_date     DATE NOT NULL,
    announcement_url TEXT,
    reason          TEXT NOT NULL,
    severity        recall_severity_enum NOT NULL DEFAULT 'moderate',
    status          recall_status_enum NOT NULL DEFAULT 'active',
    agency          VARCHAR(100) NOT NULL DEFAULT 'FDA',
    affected_lots   TEXT,
    resolution_date DATE,
    resolution_notes TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certifications
CREATE TABLE certifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,
    authority       certification_authority_enum NOT NULL,
    certificate_number VARCHAR(100),
    valid_from      DATE,
    valid_until     DATE,
    verification_url TEXT,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_cert_dates CHECK (
        (valid_from IS NULL OR valid_until IS NULL OR valid_from <= valid_until)
    )
);

-- Transparency reports
CREATE TABLE transparency_reports (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sourcing_score  DECIMAL(5,2) CHECK (sourcing_score IS NULL OR (sourcing_score >= 0 AND sourcing_score <= 100)),
    labeling_score  DECIMAL(5,2) CHECK (labeling_score IS NULL OR (labeling_score >= 0 AND labeling_score <= 100)),
    testing_score   DECIMAL(5,2) CHECK (testing_score IS NULL OR (testing_score >= 0 AND testing_score <= 100)),
    overall_score   DECIMAL(5,2) CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
    report_text     TEXT,
    report_version  INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- SEARCH
-- ============================================================

-- Search keywords (denormalized search index)
CREATE TABLE search_keywords (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     VARCHAR(30) NOT NULL CHECK (entity_type IN ('product', 'ingredient', 'brand')),
    entity_id       UUID NOT NULL,
    keyword         VARCHAR(300) NOT NULL,
    search_vector   TSVECTOR NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    weight          INTEGER NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_search_keyword UNIQUE (entity_type, entity_id, keyword)
);

-- Search synonyms
CREATE TABLE search_synonyms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term            VARCHAR(200) NOT NULL,
    synonym         VARCHAR(200) NOT NULL,
    entity_type     VARCHAR(30) CHECK (entity_type IN ('product', 'ingredient', 'brand', 'general')),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_search_synonym UNIQUE (term, synonym)
);

-- Popular searches
CREATE TABLE popular_searches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query           VARCHAR(300) NOT NULL,
    search_count    INTEGER NOT NULL DEFAULT 1,
    result_count    INTEGER NOT NULL DEFAULT 0,
    last_searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_trending     BOOLEAN NOT NULL DEFAULT false,
    trend_start_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_popular_search_query UNIQUE (query),
    CONSTRAINT chk_popular_search_count CHECK (search_count >= 1)
);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================

-- Product alternatives
CREATE TABLE product_alternatives (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,2) NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 100),
    reason          VARCHAR(500),
    is_healthier    BOOLEAN NOT NULL DEFAULT false,
    is_cheaper      BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_alt_self_ref CHECK (product_id != alternative_product_id),
    CONSTRAINT uq_product_alternative UNIQUE (product_id, alternative_product_id)
);

-- Related products
CREATE TABLE related_products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    relation_type   VARCHAR(50) NOT NULL DEFAULT 'similar',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_rel_self_ref CHECK (product_id != related_product_id),
    CONSTRAINT uq_related_product UNIQUE (product_id, related_product_id),
    CONSTRAINT chk_rel_sort CHECK (sort_order >= 0)
);

-- ============================================================
-- SEO
-- ============================================================

-- SEO page metadata
CREATE TABLE seo_pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type     seo_page_type_enum NOT NULL,
    entity_id       UUID,
    path            VARCHAR(500) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    description     VARCHAR(500),
    canonical_url   TEXT,
    og_title        VARCHAR(200),
    og_description  VARCHAR(300),
    og_image_url    TEXT,
    twitter_card    VARCHAR(50) DEFAULT 'summary_large_image',
    robots_directive VARCHAR(200) DEFAULT 'index, follow',
    structured_data JSONB,
    is_indexable    BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FAQ items
CREATE TABLE faq_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seo_page_id     UUID REFERENCES seo_pages(id) ON DELETE SET NULL,
    entity_type     VARCHAR(30),
    entity_id       UUID,
    question        TEXT NOT NULL,
    answer          TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_faq_sort CHECK (sort_order >= 0)
);

-- ============================================================
-- AI ANALYSIS (caching)
-- ============================================================

CREATE TABLE product_analyses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    analysis_type   VARCHAR(50) NOT NULL DEFAULT 'full',
    status          analysis_status_enum NOT NULL DEFAULT 'pending',
    content         TEXT,
    model_used      VARCHAR(100),
    prompt_hash     VARCHAR(64),
    token_count     INTEGER,
    cached_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_product_analysis UNIQUE (product_id, analysis_type),
    CONSTRAINT chk_pa_tokens CHECK (token_count IS NULL OR token_count > 0)
);

CREATE TABLE ingredient_analyses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    analysis_type   VARCHAR(50) NOT NULL DEFAULT 'full',
    status          analysis_status_enum NOT NULL DEFAULT 'pending',
    content         TEXT,
    model_used      VARCHAR(100),
    prompt_hash     VARCHAR(64),
    token_count     INTEGER,
    cached_at       TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ingredient_analysis UNIQUE (ingredient_id, analysis_type),
    CONSTRAINT chk_ia_tokens CHECK (token_count IS NULL OR token_count > 0)
);

-- ============================================================
-- SYSTEM
-- ============================================================

-- Audit logs
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name      VARCHAR(100) NOT NULL,
    record_id       UUID NOT NULL,
    action          audit_action_enum NOT NULL,
    old_data        JSONB,
    new_data        JSONB,
    changed_by      VARCHAR(200),
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;