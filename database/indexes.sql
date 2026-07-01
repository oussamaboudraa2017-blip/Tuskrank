-- ============================================================
-- Tuskrank Database Indexes
-- Optimized for 100,000+ products and millions of searches
-- PostgreSQL 16 / Supabase Compatible
-- ============================================================

-- BEGIN;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Brands
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON brands USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_brands_name_lower ON brands(lower(name)) WHERE deleted_at IS NULL;

-- Products
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_pet_type_id ON products(pet_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_food_form_id ON products(food_form_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_life_stage_id ON products(life_stage_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_breed_size_id ON products(breed_size_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_protein_id ON products(primary_protein_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_cents) WHERE price_cents IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_composite_filter ON products(pet_type_id, food_form_id, category_id) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_products_brand_category ON products(brand_id, category_id) WHERE deleted_at IS NULL;

-- Ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_slug ON ingredients(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_safety_tier ON ingredients(safety_tier) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_allergen ON ingredients(is_common_allergen) WHERE is_common_allergen = true AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_name_trgm ON ingredients USING gin(name gin_trgm_ops) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON ingredients(is_active) WHERE is_active = true AND deleted_at IS NULL;

-- Product-Ingredient join
CREATE INDEX IF NOT EXISTS idx_pi_product_id ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_pi_ingredient_id ON product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_pi_ordinal ON product_ingredients(product_id, ordinal_position);
CREATE INDEX IF NOT EXISTS idx_pi_primary ON product_ingredients(product_id, is_primary) WHERE is_primary = true;

-- ============================================================
-- PRODUCT INFORMATION
-- ============================================================

-- Product images
CREATE INDEX IF NOT EXISTS idx_pimg_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_pimg_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- Nutrition profiles
CREATE INDEX IF NOT EXISTS idx_nutrition_product ON nutrition_profiles(product_id) WHERE deleted_at IS NULL;

-- Product nutrients
CREATE INDEX IF NOT EXISTS idx_pn_profile_id ON product_nutrients(nutrition_profile_id);
CREATE INDEX IF NOT EXISTS idx_pn_nutrient_id ON product_nutrients(nutrient_id);

-- Product claims
CREATE INDEX IF NOT EXISTS idx_pclaim_product ON product_claims(product_id);
CREATE INDEX IF NOT EXISTS idx_pclaim_claim ON product_claims(claim_id);

-- Product tags
CREATE INDEX IF NOT EXISTS idx_ptag_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_ptag_tag ON product_tags(tag_id);

-- ============================================================
-- SCORING
-- ============================================================

-- Product scores
CREATE INDEX IF NOT EXISTS idx_pscore_product ON product_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_pscore_overall ON product_scores(overall_score DESC) WHERE overall_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pscore_grade ON product_scores(grade);
CREATE INDEX IF NOT EXISTS idx_pscore_composite ON product_scores(grade, overall_score DESC);

-- Ingredient scores
CREATE INDEX IF NOT EXISTS idx_iscore_ingredient ON ingredient_scores(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_iscore_overall ON ingredient_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_iscore_grade ON ingredient_scores(grade);

-- Score history
CREATE INDEX IF NOT EXISTS idx_shistory_product ON score_history(product_id);
CREATE INDEX IF NOT EXISTS idx_shistory_product_version ON score_history(product_id, score_version DESC);

-- ============================================================
-- SCIENCE
-- ============================================================

-- Scientific references
CREATE INDEX IF NOT EXISTS idx_sref_year ON scientific_references(year DESC);
CREATE INDEX IF NOT EXISTS idx_sref_doi ON scientific_references(doi) WHERE doi IS NOT NULL;

-- Ingredient references
CREATE INDEX IF NOT EXISTS idx_iref_ingredient ON ingredient_references(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_iref_reference ON ingredient_references(reference_id);

-- ============================================================
-- TRUST
-- ============================================================

-- Recalls
CREATE INDEX IF NOT EXISTS idx_recalls_product ON recalls(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recalls_brand ON recalls(brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recalls_date ON recalls(recall_date DESC);
CREATE INDEX IF NOT EXISTS idx_recalls_severity ON recalls(severity);
CREATE INDEX IF NOT EXISTS idx_recalls_status ON recalls(status);
CREATE INDEX IF NOT EXISTS idx_recalls_active ON recalls(recall_date DESC) WHERE status = 'active';

-- Certifications
CREATE INDEX IF NOT EXISTS idx_certs_product ON certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_certs_authority ON certifications(authority);
CREATE INDEX IF NOT EXISTS idx_certs_verified ON certifications(is_verified) WHERE is_verified = true;

-- Transparency reports
CREATE INDEX IF NOT EXISTS idx_transparency_product ON transparency_reports(product_id);

-- ============================================================
-- SEARCH (CRITICAL PERFORMANCE)
-- ============================================================

-- Full-text search on search_keywords
CREATE INDEX IF NOT EXISTS idx_search_keywords_vector ON search_keywords USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_keywords_entity ON search_keywords(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_keywords_primary ON search_keywords(entity_type, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_search_keywords_weight ON search_keywords(entity_type, weight DESC);

-- Search synonyms
CREATE INDEX IF NOT EXISTS idx_synonyms_term ON search_synonyms(term) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_synonyms_synonym ON search_synonyms(synonym) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_synonyms_term_trgm ON search_synonyms USING gin(term gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_synonyms_synonym_trgm ON search_synonyms USING gin(synonym gin_trgm_ops);

-- Popular searches
CREATE INDEX IF NOT EXISTS idx_popsearch_count ON popular_searches(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_popsearch_recent ON popular_searches(last_searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_popsearch_trending ON popular_searches(is_trending) WHERE is_trending = true;
CREATE INDEX IF NOT EXISTS idx_popsearch_query_trgm ON popular_searches USING gin(query gin_trgm_ops);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================

-- Product alternatives
CREATE INDEX IF NOT EXISTS idx_alts_product ON product_alternatives(product_id);
CREATE INDEX IF NOT EXISTS idx_alts_alternative ON product_alternatives(alternative_product_id);
CREATE INDEX IF NOT EXISTS idx_alts_healthier ON product_alternatives(product_id, is_healthier) WHERE is_healthier = true;

-- Related products
CREATE INDEX IF NOT EXISTS idx_related_product ON related_products(product_id);
CREATE INDEX IF NOT EXISTS idx_related_related ON related_products(related_product_id);

-- ============================================================
-- SEO
-- ============================================================

-- SEO pages
CREATE INDEX IF NOT EXISTS idx_seo_path ON seo_pages(path);
CREATE INDEX IF NOT EXISTS idx_seo_entity ON seo_pages(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seo_indexable ON seo_pages(is_indexable) WHERE is_indexable = true;

-- FAQ items
CREATE INDEX IF NOT EXISTS idx_faq_page ON faq_items(seo_page_id) WHERE seo_page_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_faq_entity ON faq_items(entity_type, entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_faq_active ON faq_items(is_active) WHERE is_active = true;

-- ============================================================
-- AI ANALYSIS
-- ============================================================

-- Product analyses
CREATE INDEX IF NOT EXISTS idx_pan_product ON product_analyses(product_id);
CREATE INDEX IF NOT EXISTS idx_pan_status ON product_analyses(status);
CREATE INDEX IF NOT EXISTS idx_pan_expires ON product_analyses(expires_at) WHERE expires_at IS NOT NULL;

-- Ingredient analyses
CREATE INDEX IF NOT EXISTS idx_ian_ingredient ON ingredient_analyses(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ian_status ON ingredient_analyses(status);

-- ============================================================
-- SYSTEM
-- ============================================================

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit_logs(changed_by);

-- ============================================================
-- LOOKUP TABLES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_categories_pet_type ON categories(pet_type_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

CREATE INDEX IF NOT EXISTS idx_life_stages_pet_type ON life_stages(pet_type_id);

CREATE INDEX IF NOT EXISTS idx_ingredient_categories_parent ON ingredient_categories(parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_claims_type ON claims(claim_type);

-- COMMIT;