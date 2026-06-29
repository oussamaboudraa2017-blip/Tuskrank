-- ============================================================
-- Tuskrank Database Triggers
-- PostgreSQL 16 / Supabase Compatible
-- ============================================================

BEGIN;

-- ============================================================
-- AUTO UPDATE UPDATED_AT
-- ============================================================

-- Lookup tables (no deleted_at)
CREATE TRIGGER trg_pet_types_updated_at
    BEFORE UPDATE ON pet_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_life_stages_updated_at
    BEFORE UPDATE ON life_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_food_forms_updated_at
    BEFORE UPDATE ON food_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_protein_sources_updated_at
    BEFORE UPDATE ON protein_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ingredient_categories_updated_at
    BEFORE UPDATE ON ingredient_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_breed_sizes_updated_at
    BEFORE UPDATE ON breed_sizes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_claims_updated_at
    BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nutrients_updated_at
    BEFORE UPDATE ON nutrients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Core tables (with deleted_at)
CREATE TRIGGER trg_brands_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_nutrition_profiles_updated_at
    BEFORE UPDATE ON nutrition_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_nutrients_updated_at
    BEFORE UPDATE ON product_nutrients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Scoring
CREATE TRIGGER trg_ingredient_scores_updated_at
    BEFORE UPDATE ON ingredient_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_product_scores_updated_at
    BEFORE UPDATE ON product_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trust
CREATE TRIGGER trg_recalls_updated_at
    BEFORE UPDATE ON recalls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_certifications_updated_at
    BEFORE UPDATE ON certifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transparency_reports_updated_at
    BEFORE UPDATE ON transparency_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search
CREATE TRIGGER trg_search_synonyms_updated_at
    BEFORE UPDATE ON search_synonyms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_popular_searches_updated_at
    BEFORE UPDATE ON popular_searches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recommendations
CREATE TRIGGER trg_product_alternatives_updated_at
    BEFORE UPDATE ON product_alternatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_related_products_updated_at
    BEFORE UPDATE ON related_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEO
CREATE TRIGGER trg_seo_pages_updated_at
    BEFORE UPDATE ON seo_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_faq_items_updated_at
    BEFORE UPDATE ON faq_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- AI Analysis
CREATE TRIGGER trg_product_analyses_updated_at
    BEFORE UPDATE ON product_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_ingredient_analyses_updated_at
    BEFORE UPDATE ON ingredient_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- AUTO GENERATE SLUGS
-- ============================================================

/**
 * Auto-generate slug for brands on INSERT if slug is empty.
 */
CREATE TRIGGER trg_brands_auto_slug
    BEFORE INSERT ON brands
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION generate_unique_brand_slug(NEW.name);

/**
 * Auto-generate slug for products on INSERT if slug is empty.
 * Requires brand_id to be set first.
 */
CREATE TRIGGER trg_products_auto_slug
    BEFORE INSERT ON products
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION generate_unique_product_slug(NEW.brand_id, NEW.name);

/**
 * Auto-generate slug for ingredients on INSERT if slug is empty.
 */
CREATE TRIGGER trg_ingredients_auto_slug
    BEFORE INSERT ON ingredients
    FOR EACH ROW
    WHEN (NEW.slug IS NULL OR NEW.slug = '')
    EXECUTE FUNCTION generate_unique_ingredient_slug(NEW.name);


-- ============================================================
-- AUTO REFRESH SEARCH INDEX
-- ============================================================

/**
 * Refresh search keywords when a product is inserted or updated.
 * Only triggers when name or brand_id changes, or on insert.
 */
CREATE TRIGGER trg_products_refresh_search
    AFTER INSERT OR UPDATE OF name, brand_id, category_id, pet_type_id, food_form_id, is_active
    ON products
    FOR EACH ROW
    WHEN (NEW.is_active = true AND NEW.deleted_at IS NULL)
    EXECUTE PROCEDURE refresh_search_keywords_for_product(NEW.id);

/**
 * Remove search keywords when a product is soft-deleted or deactivated.
 */
CREATE TRIGGER trg_products_remove_search
    AFTER UPDATE OF is_active, deleted_at
    ON products
    FOR EACH ROW
    WHEN (NEW.is_active = false OR NEW.deleted_at IS NOT NULL)
    EXECUTE LANGUAGE plpgsql $$
    BEGIN
        DELETE FROM search_keywords WHERE entity_type = 'product' AND entity_id = NEW.id;
    END;
    $$;

/**
 * Refresh search keywords when an ingredient is inserted or updated.
 */
CREATE TRIGGER trg_ingredients_refresh_search
    AFTER INSERT OR UPDATE OF name, category_id, scientific_name, is_active
    ON ingredients
    FOR EACH ROW
    WHEN (NEW.is_active = true AND NEW.deleted_at IS NULL)
    EXECUTE PROCEDURE refresh_search_keywords_for_ingredient(NEW.id);

/**
 * Remove search keywords when an ingredient is soft-deleted or deactivated.
 */
CREATE TRIGGER trg_ingredients_remove_search
    AFTER UPDATE OF is_active, deleted_at
    ON ingredients
    FOR EACH ROW
    WHEN (NEW.is_active = false OR NEW.deleted_at IS NOT NULL)
    EXECUTE LANGUAGE plpgsql $$
    BEGIN
        DELETE FROM search_keywords WHERE entity_type = 'ingredient' AND entity_id = NEW.id;
    END;
    $$;

/**
 * Refresh search keywords when a brand is inserted or updated.
 */
CREATE TRIGGER trg_brands_refresh_search
    AFTER INSERT OR UPDATE OF name, is_active
    ON brands
    FOR EACH ROW
    WHEN (NEW.is_active = true AND NEW.deleted_at IS NULL)
    EXECUTE PROCEDURE refresh_search_keywords_for_brand(NEW.id);

/**
 * Remove search keywords when a brand is soft-deleted or deactivated.
 */
CREATE TRIGGER trg_brands_remove_search
    AFTER UPDATE OF is_active, deleted_at
    ON brands
    FOR EACH ROW
    WHEN (NEW.is_active = false OR NEW.deleted_at IS NOT NULL)
    EXECUTE LANGUAGE plpgsql $$
    BEGIN
        DELETE FROM search_keywords WHERE entity_type = 'brand' AND entity_id = NEW.id;
    END;
    $$;

/**
 * Refresh product search keywords when ingredients change.
 */
CREATE TRIGGER trg_product_ingredients_refresh_search
    AFTER INSERT OR DELETE OR UPDATE
    ON product_ingredients
    FOR EACH ROW
    EXECUTE LANGUAGE plpgsql $$
    DECLARE
        v_product_id UUID;
    BEGIN
        v_product_id := COALESCE(NEW.product_id, OLD.product_id);
        IF v_product_id IS NOT NULL THEN
            PERFORM refresh_search_keywords_for_product(v_product_id);
        END IF;
    END;
    $$;


-- ============================================================
-- SCORE HISTORY ON UPDATE
-- ============================================================

/**
 * When a product score is updated, archive the old score to score_history.
 */
CREATE TRIGGER trg_product_scores_archive_history
    AFTER UPDATE OF overall_score ON product_scores
    FOR EACH ROW
    WHEN (OLD.overall_score IS DISTINCT FROM NEW.overall_score)
    EXECUTE LANGUAGE plpgsql $$
    BEGIN
        INSERT INTO score_history (
            product_id, score_version, overall_score,
            ingredient_quality_score, nutritional_adequacy_score,
            safety_score, transparency_score, grade, change_reason
        ) VALUES (
            NEW.product_id, NEW.score_version, OLD.overall_score,
            OLD.ingredient_quality_score, OLD.nutritional_adequacy_score,
            OLD.safety_score, OLD.transparency_score, OLD.grade,
            'Score updated from version ' || OLD.score_version
        );
    END;
    $$;


COMMIT;