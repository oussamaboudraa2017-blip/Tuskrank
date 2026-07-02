-- ============================================================
-- Migration 001: Initial Schema
-- Tuskrank — Production-ready schema with indexes
-- ============================================================

-- Enable pg_trgm for ILIKE / trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid-ossp for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  manufacturer  TEXT,
  country_code  CHAR(2),
  website_url   TEXT,
  description   TEXT,
  logo_image_url TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands (slug);
CREATE INDEX IF NOT EXISTS idx_brands_is_active ON brands (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brands_created_at ON brands (created_at DESC);

-- ============================================================
-- INGREDIENT CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  parent_id     UUID REFERENCES ingredient_categories(id),
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingredient_categories_parent ON ingredient_categories (parent_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_categories_slug ON ingredient_categories (slug);

-- ============================================================
-- INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  inci_name         TEXT,
  category_id       UUID REFERENCES ingredient_categories(id),
  canonical_name    TEXT NOT NULL,
  description       TEXT,
  risk_level        TEXT CHECK (risk_level IN ('LOW','MEDIUM','HIGH','UNKNOWN')) DEFAULT 'UNKNOWN',
  is_animal_derived   BOOLEAN NOT NULL DEFAULT false,
  is_common_allergen  BOOLEAN NOT NULL DEFAULT false,
  is_controversial    BOOLEAN NOT NULL DEFAULT false,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingredients_slug ON ingredients (slug);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients (category_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_trgm ON ingredients USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ingredients_canonical_name ON ingredients (canonical_name);
CREATE INDEX IF NOT EXISTS idx_ingredients_created_at ON ingredients (created_at DESC);

-- ============================================================
-- INGREDIENT SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
  score           NUMERIC(5,2) NOT NULL,
  grade           TEXT,
  reasoning       TEXT,
  scoring_version TEXT NOT NULL,
  is_current      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingredient_scores_ingredient ON ingredient_scores (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_scores_current ON ingredient_scores (ingredient_id) WHERE is_current AND deleted_at IS NULL;

-- ============================================================
-- FOOD FORMS
-- ============================================================
CREATE TABLE IF NOT EXISTS food_forms (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PROTEIN SOURCES
-- ============================================================
CREATE TABLE IF NOT EXISTS protein_sources (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  origin     TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id                  UUID NOT NULL REFERENCES brands(id),
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL,
  description               TEXT,
  upc                       TEXT,
  sku                       TEXT,
  package_size_grams        NUMERIC(10,2),
  package_size_label        TEXT,
  food_form_id              UUID REFERENCES food_forms(id),
  primary_protein_source_id UUID REFERENCES protein_sources(id),
  is_active                 BOOLEAN NOT NULL DEFAULT true,
  published_at              TIMESTAMPTZ,
  overall_score             NUMERIC(5,2),
  quality_score             NUMERIC(5,2),
  safety_score              NUMERIC(5,2),
  nutrition_score           NUMERIC(5,2),
  transparency_score        NUMERIC(5,2),
  score_grade               TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ,
  CONSTRAINT uq_products_brand_slug UNIQUE (brand_id, slug),
  CONSTRAINT uq_products_upc UNIQUE (upc),
  CONSTRAINT uq_products_sku UNIQUE (brand_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products (slug);
CREATE INDEX IF NOT EXISTS idx_products_upc ON products (upc);
CREATE INDEX IF NOT EXISTS idx_products_food_form ON products (food_form_id);
CREATE INDEX IF NOT EXISTS idx_products_protein_source ON products (primary_protein_source_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products (is_active) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

-- Full-text search index on products
CREATE INDEX IF NOT EXISTS idx_products_fts
  ON products USING GIN (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '')));

-- Composite index for cursor-based pagination
CREATE INDEX IF NOT EXISTS idx_products_list_cursor
  ON products (created_at DESC, id DESC)
  WHERE deleted_at IS NULL AND is_active = true;

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id),
  storage_path TEXT NOT NULL,
  public_url   TEXT,
  alt_text     TEXT,
  width_px     INTEGER,
  height_px    INTEGER,
  bytes        INTEGER,
  mime_type    TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_primary   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images (product_id) WHERE is_primary AND deleted_at IS NULL;

-- ============================================================
-- PRODUCT INGREDIENTS (junction)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_ingredients (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES products(id),
  ingredient_id    UUID NOT NULL REFERENCES ingredients(id),
  position         INTEGER NOT NULL DEFAULT 0,
  raw_label        TEXT,
  is_primary       BOOLEAN NOT NULL DEFAULT false,
  percentage_value NUMERIC(5,2),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at       TIMESTAMPTZ,
  CONSTRAINT uq_product_ingredient UNIQUE (product_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON product_ingredients (product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON product_ingredients (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_position ON product_ingredients (product_id, position);

-- ============================================================
-- PRODUCT TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  tag_id     UUID NOT NULL,
  tag_slug   TEXT NOT NULL,
  tag_name   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT uq_product_tag UNIQUE (product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags (product_id);

-- ============================================================
-- PRODUCT CLAIMS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_claims (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id    UUID NOT NULL REFERENCES products(id),
  claim_id      UUID NOT NULL,
  claim_slug    TEXT NOT NULL,
  claim_name    TEXT NOT NULL,
  evidence_note TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_claims_product ON product_claims (product_id);

-- ============================================================
-- PRODUCT TARGETING
-- ============================================================
CREATE TABLE IF NOT EXISTS product_targeting (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id   UUID NOT NULL REFERENCES products(id),
  pet_type_id  UUID NOT NULL,
  life_stage_id UUID,
  breed_size_id UUID,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_targeting_product ON product_targeting (product_id);

-- ============================================================
-- NUTRITION PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id),
  kcal_per_100g   NUMERIC(8,2),
  kcal_per_cup    NUMERIC(8,2),
  moisture_pct    NUMERIC(5,2),
  effective_from  TIMESTAMPTZ,
  effective_to    TIMESTAMPTZ,
  source          TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_nutrition_profiles_product ON nutrition_profiles (product_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_profiles_effective ON nutrition_profiles (product_id, effective_from DESC);

-- ============================================================
-- PRODUCT NUTRIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_nutrients (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES products(id),
  nutrient_id          UUID NOT NULL,
  nutrition_profile_id UUID REFERENCES nutrition_profiles(id),
  amount               NUMERIC(10,2) NOT NULL,
  unit                 TEXT NOT NULL,
  bound                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_nutrients_product ON product_nutrients (product_id);
CREATE INDEX IF NOT EXISTS idx_product_nutrients_profile ON product_nutrients (nutrition_profile_id);

-- ============================================================
-- PRODUCT SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_scores (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id        UUID NOT NULL REFERENCES products(id),
  overall           NUMERIC(5,2) NOT NULL,
  quality           NUMERIC(5,2),
  safety            NUMERIC(5,2),
  nutrition         NUMERIC(5,2),
  transparency      NUMERIC(5,2),
  grade             TEXT,
  scoring_version   TEXT NOT NULL,
  is_current        BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_scores_product ON product_scores (product_id);
CREATE INDEX IF NOT EXISTS idx_product_scores_current ON product_scores (product_id) WHERE is_current AND deleted_at IS NULL;

-- ============================================================
-- SCORE HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS score_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id),
  overall         NUMERIC(5,2) NOT NULL,
  quality         NUMERIC(5,2),
  safety          NUMERIC(5,2),
  nutrition       NUMERIC(5,2),
  transparency    NUMERIC(5,2),
  scoring_version TEXT NOT NULL,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  triggered_by    TEXT NOT NULL DEFAULT 'manual',
  notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_score_history_product ON score_history (product_id);
CREATE INDEX IF NOT EXISTS idx_score_history_computed ON score_history (product_id, computed_at DESC);

-- ============================================================
-- RECALLS
-- ============================================================
CREATE TABLE IF NOT EXISTS recalls (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id   UUID NOT NULL REFERENCES brands(id),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','pending')),
  title      TEXT NOT NULL,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recalls_brand ON recalls (brand_id);
CREATE INDEX IF NOT EXISTS idx_recalls_status ON recalls (status) WHERE deleted_at IS NULL;

-- ============================================================
-- USER FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_favorite UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_product ON user_favorites (product_id);

-- ============================================================
-- SEARCH ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS search_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  normalized   TEXT NOT NULL,
  raw_query    TEXT,
  result_count INTEGER NOT NULL DEFAULT 0,
  latency_ms   INTEGER,
  user_id      UUID,
  session_id   TEXT,
  request_id   TEXT,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_normalized ON search_logs (normalized);

-- ============================================================
-- SEARCH KEYWORDS / SYNONYMS
-- ============================================================
CREATE TABLE IF NOT EXISTS search_keywords (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword    TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL,
  entity_id  UUID NOT NULL,
  weight     INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_keywords_keyword ON search_keywords (keyword);
CREATE INDEX IF NOT EXISTS idx_search_keywords_entity ON search_keywords (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS search_synonyms (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term       TEXT NOT NULL,
  synonym    TEXT NOT NULL,
  locale     TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_synonym UNIQUE (term, synonym, locale)
);

-- ============================================================
-- SCIENTIFIC REFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS scientific_references (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  authors        TEXT,
  publication    TEXT,
  published_year INTEGER,
  doi            TEXT,
  url            TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ingredient_references (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id),
  reference_id    UUID NOT NULL REFERENCES scientific_references(id),
  evidence_type   TEXT,
  relevance_score NUMERIC(3,2) DEFAULT 0.50,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT uq_ingredient_reference UNIQUE (ingredient_id, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_ingredient_references_ingredient ON ingredient_references (ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_references_relevance ON ingredient_references (ingredient_id, relevance_score DESC);

-- ============================================================
-- BRAND CERTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_certifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id),
  name        TEXT NOT NULL,
  issuer      TEXT,
  valid_until TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brand_certifications_brand ON brand_certifications (brand_id);
