-- ============================================================
-- Tuskrank Database Functions
-- PostgreSQL 16 / Supabase Compatible
-- ============================================================

BEGIN;

-- ============================================================
-- SLUG GENERATION
-- ============================================================

/**
 * Generate a URL-safe slug from a string.
 * Transliterates, lowercases, replaces non-alphanumeric chars with hyphens,
 * collapses consecutive hyphens, and trims hyphens from edges.
 */
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Lowercase
    result := lower(input_text);

    -- Replace common special chars with plain equivalents
    result := replace(result, '''', '');
    result := replace(result, '"', '');
    result := replace(result, '&', ' and ');
    result := replace(result, '+', ' plus ');

    -- Replace any non-alphanumeric character (except hyphen and space) with space
    result := regexp_replace(result, '[^a-z0-9\- ]', ' ', 'g');

    -- Replace spaces and consecutive hyphens with a single hyphen
    result := regexp_replace(result, '[\s\-]+', '-', 'g');

    -- Trim hyphens from start and end
    result := regexp_replace(result, '^-+|-+$', '', 'g');

    -- Limit length to 200 characters
    result := left(result, 200);

    RETURN result;
END;
$$;


/**
 * Generate a unique slug for brands.
 * Appends a numeric suffix if the slug already exists.
 */
CREATE OR REPLACE FUNCTION generate_unique_brand_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := generate_slug(name);
    candidate := base_slug;

    LOOP
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM brands
            WHERE slug = candidate AND deleted_at IS NULL
        );
        candidate := base_slug || '-' || counter;
        counter := counter + 1;

        -- Safety limit
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique slug for brand: %', name;
        END IF;
    END LOOP;

    RETURN candidate;
END;
$$;


/**
 * Generate a unique slug for products within a brand.
 */
CREATE OR REPLACE FUNCTION generate_unique_product_slug(brand_id UUID, name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := generate_slug(name);
    candidate := base_slug;

    LOOP
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM products
            WHERE brand_id = generate_unique_product_slug.brand_id
              AND slug = candidate
              AND deleted_at IS NULL
        );
        candidate := base_slug || '-' || counter;
        counter := counter + 1;

        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique product slug for: %', name;
        END IF;
    END LOOP;

    RETURN candidate;
END;
$$;


/**
 * Generate a unique slug for ingredients.
 */
CREATE OR REPLACE FUNCTION generate_unique_ingredient_slug(name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := generate_slug(name);
    candidate := base_slug;

    LOOP
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM ingredients
            WHERE slug = candidate AND deleted_at IS NULL
        );
        candidate := base_slug || '-' || counter;
        counter := counter + 1;

        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique slug for ingredient: %', name;
        END IF;
    END LOOP;

    RETURN candidate;
END;
$$;


-- ============================================================
-- TIMESTAMP MANAGEMENT
-- ============================================================

/**
 * Update the updated_at column to now() for the current row.
 * Called by triggers.
 */
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


-- ============================================================
-- SCORING FUNCTIONS
-- ============================================================

/**
 * Calculate the overall ingredient score from component scores.
 * Weights: quality 40%, safety 30%, nutritional value 30%
 */
CREATE OR REPLACE FUNCTION calculate_ingredient_overall_score(
    quality_score DECIMAL,
    safety_score DECIMAL,
    nutritional_value_score DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    overall DECIMAL;
    grade score_grade_enum;
BEGIN
    overall := (
        COALESCE(quality_score, 0) * 0.40 +
        COALESCE(safety_score, 0) * 0.30 +
        COALESCE(nutritional_value_score, 0) * 0.30
    );
    overall := round(overall, 2);
    RETURN overall;
END;
$$;


/**
 * Convert a numeric score (0-100) to a letter grade.
 */
CREATE OR REPLACE FUNCTION score_to_grade(score DECIMAL)
RETURNS score_grade_enum
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    IF score >= 90 THEN RETURN 'A';
    ELSIF score >= 80 THEN RETURN 'B';
    ELSIF score >= 65 THEN RETURN 'C';
    ELSIF score >= 50 THEN RETURN 'D';
    ELSE RETURN 'F';
    END IF;
END;
$$;


/**
 * Calculate the overall product score from dimension scores.
 * Weights: ingredient_quality 40%, nutritional_adequacy 30%, safety 20%, transparency 10%
 */
CREATE OR REPLACE FUNCTION calculate_product_overall_score(
    ingredient_quality_score DECIMAL,
    nutritional_adequacy_score DECIMAL,
    safety_score DECIMAL,
    transparency_score DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    overall DECIMAL;
BEGIN
    overall := (
        COALESCE(ingredient_quality_score, 0) * 0.40 +
        COALESCE(nutritional_adequacy_score, 0) * 0.30 +
        COALESCE(safety_score, 0) * 0.20 +
        COALESCE(transparency_score, 0) * 0.10
    );
    overall := round(overall, 2);
    RETURN overall;
END;
$$;


/**
 * Compute the full product score and insert/update product_scores.
 * Reads from product_ingredients and ingredient_scores.
 * Called manually or via admin endpoint.
 */
CREATE OR REPLACE FUNCTION compute_product_score(p_product_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_ingredient_quality DECIMAL;
    v_nutritional_adequacy DECIMAL;
    v_safety DECIMAL;
    v_transparency DECIMAL;
    v_overall DECIMAL;
    v_grade score_grade_enum;
    v_score_id UUID;
    v_ingredient_count INTEGER;
    v_allergen_count INTEGER;
    v_filler_count INTEGER;
    v_controversial_count INTEGER;
    v_avg_ingredient_score DECIMAL;
    v_primary_ingredient_score DECIMAL;
    v_nutrition_profile_id UUID;
    v_has_nutrition BOOLEAN;
    v_has_certifications BOOLEAN;
    v_existing_version INTEGER;
    v_rationale TEXT;
BEGIN
    -- Count ingredients
    SELECT count(*), count(*) FILTER (WHERE i.is_common_allergen),
           count(*) FILTER (WHERE i.is_filler),
           count(*) FILTER (WHERE i.safety_tier = 'controversial')
    INTO v_ingredient_count, v_allergen_count, v_filler_count, v_controversial_count
    FROM product_ingredients pi
    JOIN ingredients i ON i.id = pi.ingredient_id
    WHERE pi.product_id = p_product_id;

    -- Average ingredient score
    SELECT avg(iscore.overall_score)
    INTO v_avg_ingredient_score
    FROM product_ingredients pi
    JOIN ingredient_scores iscore ON iscore.ingredient_id = pi.ingredient_id
    WHERE pi.product_id = p_product_id;

    -- Primary ingredient (first) score
    SELECT iscore.overall_score
    INTO v_primary_ingredient_score
    FROM product_ingredients pi
    JOIN ingredient_scores iscore ON iscore.ingredient_id = pi.ingredient_id
    WHERE pi.product_id = p_product_id AND pi.ordinal_position = 0
    LIMIT 1;

    -- Check for nutrition profile
    SELECT count(*) > 0 INTO v_has_nutrition
    FROM nutrition_profiles WHERE product_id = p_product_id AND deleted_at IS NULL;

    -- Check for certifications
    SELECT count(*) > 0 INTO v_has_certifications
    FROM certifications WHERE product_id = p_product_id;

    -- === DIMENSION 1: Ingredient Quality (0-100) ===
    IF v_ingredient_count = 0 THEN
        v_ingredient_quality := 0;
    ELSE
        v_ingredient_quality := COALESCE(v_avg_ingredient_score, 0) * 0.6
                              + COALESCE(v_primary_ingredient_score, 0) * 0.3
                              + GREATEST(0, 100 - (v_filler_count * 15.0)) * 0.1;
        v_ingredient_quality := LEAST(100, GREATEST(0, v_ingredient_quality));
    END IF;

    -- === DIMENSION 2: Nutritional Adequacy (0-100) ===
    IF NOT v_has_nutrition THEN
        v_nutritional_adequacy := 30; -- Base score for having no data
    ELSE
        v_nutritional_adequacy := 70; -- Base for having nutrition data
        -- Bonus for key nutrients present
        SELECT v_nutritional_adequacy +
               count(*) FILTER (WHERE n.name IN ('Protein', 'Fat', 'Fiber', 'Moisture')) * 7.5
        INTO v_nutritional_adequacy
        FROM product_nutrients pn
        JOIN nutrients n ON n.id = pn.nutrient_id
        JOIN nutrition_profiles np ON np.id = pn.nutrition_profile_id
        WHERE np.product_id = p_product_id
          AND pn.guaranteed_value IS NOT NULL;

        v_nutritional_adequacy := LEAST(100, v_nutritional_adequacy);
    END IF;

    -- === DIMENSION 3: Safety (0-100) ===
    v_safety := 100.0
              - (v_controversial_count * 20.0)
              - (LEAST(v_allergen_count, 3) * 5.0);

    -- Deduct for active recalls
    SELECT v_safety - (count(*) * 15.0)
    INTO v_safety
    FROM recalls
    WHERE (product_id = p_product_id OR brand_id = (SELECT brand_id FROM products WHERE id = p_product_id))
      AND status = 'active';

    v_safety := GREATEST(0, LEAST(100, v_safety));

    -- === DIMENSION 4: Transparency (0-100) ===
    v_transparency := 50.0; -- Base
    IF v_has_nutrition THEN v_transparency := v_transparency + 15; END IF;
    IF v_has_certifications THEN v_transparency := v_transparency + 10; END IF;

    SELECT v_transparency + count(*) * 5
    INTO v_transparency
    FROM certifications WHERE product_id = p_product_id AND is_verified = true;

    -- Check for transparency report
    IF EXISTS (SELECT 1 FROM transparency_reports WHERE product_id = p_product_id) THEN
        v_transparency := v_transparency + 5;
    END IF;

    v_transparency := LEAST(100, v_transparency);

    -- === OVERALL ===
    v_overall := calculate_product_overall_score(
        v_ingredient_quality, v_nutritional_adequacy, v_safety, v_transparency
    );
    v_grade := score_to_grade(v_overall);

    -- Build rationale
    v_rationale := format(
        'Ingredient Quality: %.1f/100 (based on %s ingredients, %s fillers, %s controversial). ' ||
        'Nutritional Adequacy: %.1f/100. Safety: %.1f/100 (%s recalls). Transparency: %.1f/100.',
        v_ingredient_quality, v_ingredient_count, v_filler_count, v_controversial_count,
        v_nutritional_adequacy, v_safety,
        (SELECT count(*) FROM recalls WHERE product_id = p_product_id AND status = 'active'),
        v_transparency
    );

    -- Upsert product score
    INSERT INTO product_scores (
        product_id,
        ingredient_quality_score,
        nutritional_adequacy_score,
        safety_score,
        transparency_score,
        overall_score,
        grade,
        rationale
    ) VALUES (
        p_product_id,
        round(v_ingredient_quality, 2),
        round(v_nutritional_adequacy, 2),
        round(v_safety, 2),
        round(v_transparency, 2),
        v_overall,
        v_grade,
        v_rationale
    )
    ON CONFLICT (product_id) DO UPDATE SET
        ingredient_quality_score = EXCLUDED.ingredient_quality_score,
        nutritional_adequacy_score = EXCLUDED.nutritional_adequacy_score,
        safety_score = EXCLUDED.safety_score,
        transparency_score = EXCLUDED.transparency_score,
        overall_score = EXCLUDED.overall_score,
        grade = EXCLUDED.grade,
        score_version = product_scores.score_version + 1,
        rationale = EXCLUDED.rationale,
        computed_at = now()
    RETURNING id INTO v_score_id;

    -- Archive to score history
    SELECT COALESCE(max(score_version), 0) INTO v_existing_version
    FROM score_history WHERE product_id = p_product_id;

    INSERT INTO score_history (
        product_id, score_version, overall_score,
        ingredient_quality_score, nutritional_adequacy_score,
        safety_score, transparency_score, grade, change_reason
    ) VALUES (
        p_product_id, v_existing_version + 1, v_overall,
        round(v_ingredient_quality, 2), round(v_nutritional_adequacy_score, 2),
        round(v_safety, 2), round(v_transparency, 2), v_grade,
        'Score recomputed'
    )
    ON CONFLICT (product_id, score_version) DO NOTHING;

    RETURN v_score_id;
END;
$$;


/**
 * Batch compute scores for all products (or a specific set).
 */
CREATE OR REPLACE FUNCTION compute_all_product_scores()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER := 0;
    v_product_id UUID;
BEGIN
    FOR v_product_id IN
        SELECT id FROM products WHERE is_active = true AND deleted_at IS NULL
    LOOP
        PERFORM compute_product_score(v_product_id);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;


-- ============================================================
-- SEARCH FUNCTIONS
-- ============================================================

/**
 * Normalize a search query for matching:
 * - Lowercase
 * - Remove extra whitespace
 * - Strip special characters
 * - Return as TEXT
 */
CREATE OR REPLACE FUNCTION normalize_search_query(query TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    RETURN regexp_replace(
        lower(regexp_replace(query, '[^a-z0-9\s]', ' ', 'gi')),
        '\s+', ' ', 'g'
    );
END;
$$;


/**
 * Build a tsvector for search_keywords from a keyword string.
 * Uses a simple configuration for English text.
 */
CREATE OR REPLACE FUNCTION build_search_vector(keyword TEXT)
RETURNS TSVECTOR
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    RETURN to_tsvector('english', keyword);
END;
$$;


/**
 * Refresh search keywords for a single entity.
 * Removes old keywords and inserts new ones based on current data.
 */
CREATE OR REPLACE FUNCTION refresh_search_keywords_for_product(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_brand_name TEXT;
    v_product_name TEXT;
    v_category_name TEXT;
    v_pet_type_name TEXT;
    v_food_form_name TEXT;
    v_ingredient_names TEXT[];
BEGIN
    -- Delete existing keywords for this product
    DELETE FROM search_keywords WHERE entity_type = 'product' AND entity_id = p_product_id;

    -- Get product data
    SELECT
        p.name,
        COALESCE(b.name, ''),
        COALESCE(c.name, ''),
        COALESCE(pt.name, ''),
        COALESCE(ff.name, '')
    INTO v_product_name, v_brand_name, v_category_name, v_pet_type_name, v_food_form_name
    FROM products p
    LEFT JOIN brands b ON b.id = p.brand_id
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN pet_types pt ON pt.id = p.pet_type_id
    LEFT JOIN food_forms ff ON ff.id = p.food_form_id
    WHERE p.id = p_product_id;

    -- Insert product name (primary, high weight)
    INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
    VALUES ('product', p_product_id, v_product_name, build_search_vector(v_product_name), true, 10);

    -- Insert brand + product name
    IF v_brand_name IS NOT NULL AND v_brand_name != '' THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('product', p_product_id, v_brand_name || ' ' || v_product_name,
                build_search_vector(v_brand_name || ' ' || v_product_name), false, 8);

        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('product', p_product_id, v_brand_name, build_search_vector(v_brand_name), false, 5);
    END IF;

    -- Insert category + product
    IF v_category_name IS NOT NULL AND v_category_name != '' THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('product', p_product_id, v_category_name || ' ' || v_product_name,
                build_search_vector(v_category_name || ' ' || v_product_name), false, 6);
    END IF;

    -- Insert individual ingredient names
    SELECT array_agg(i.name) INTO v_ingredient_names
    FROM product_ingredients pi
    JOIN ingredients i ON i.id = pi.ingredient_id
    WHERE pi.product_id = p_product_id
    ORDER BY pi.ordinal_position;

    IF v_ingredient_names IS NOT NULL THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        SELECT
            'product', p_product_id, ing_name,
            build_search_vector(ing_name), false,
            CASE WHEN ordinal = 0 THEN 7 ELSE GREATEST(1, 5 - ordinal) END
        FROM unnest(v_ingredient_names) WITH ORDINALITY AS t(ing_name, ordinal);
    END IF;

    -- Pet type
    IF v_pet_type_name IS NOT NULL AND v_pet_type_name != '' THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('product', p_product_id, v_pet_type_name, build_search_vector(v_pet_type_name), false, 3);
    END IF;

    -- Food form
    IF v_food_form_name IS NOT NULL AND v_food_form_name != '' THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('product', p_product_id, v_food_form_name, build_search_vector(v_food_form_name), false, 3);
    END IF;
END;
$$;


/**
 * Refresh search keywords for a single ingredient.
 */
CREATE OR REPLACE FUNCTION refresh_search_keywords_for_ingredient(p_ingredient_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_name TEXT;
    v_category_name TEXT;
    v_scientific_name TEXT;
BEGIN
    DELETE FROM search_keywords WHERE entity_type = 'ingredient' AND entity_id = p_ingredient_id;

    SELECT i.name, COALESCE(ic.name, ''), COALESCE(i.scientific_name, '')
    INTO v_name, v_category_name, v_scientific_name
    FROM ingredients i
    LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
    WHERE i.id = p_ingredient_id;

    -- Primary name
    INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
    VALUES ('ingredient', p_ingredient_id, v_name, build_search_vector(v_name), true, 10);

    -- Scientific name
    IF v_scientific_name IS NOT NULL AND v_scientific_name != '' THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('ingredient', p_ingredient_id, v_scientific_name, build_search_vector(v_scientific_name), false, 6);
    END IF;

    -- Category
    IF v_category_name IS NOT NULL AND v_category_name != '' THEN
        INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
        VALUES ('ingredient', p_ingredient_id, v_category_name, build_search_vector(v_category_name), false, 4);
    END IF;
END;
$$;


/**
 * Refresh search keywords for a single brand.
 */
CREATE OR REPLACE FUNCTION refresh_search_keywords_for_brand(p_brand_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_name TEXT;
BEGIN
    DELETE FROM search_keywords WHERE entity_type = 'brand' AND entity_id = p_brand_id;

    SELECT name INTO v_name FROM brands WHERE id = p_brand_id;

    INSERT INTO search_keywords (entity_type, entity_id, keyword, search_vector, is_primary, weight)
    VALUES ('brand', p_brand_id, v_name, build_search_vector(v_name), true, 10);
END;
$$;


/**
 * Record a search query in popular_searches.
 * Upserts the query, increments count, updates timestamp.
 */
CREATE OR REPLACE FUNCTION record_search_query(query TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_normalized TEXT;
BEGIN
    v_normalized := normalize_search_query(query);
    v_normalized := btrim(v_normalized);

    IF v_normalized = '' THEN
        RETURN NULL;
    END IF;

    INSERT INTO popular_searches (query, search_count, last_searched_at)
    VALUES (v_normalized, 1, now())
    ON CONFLICT (query) DO UPDATE SET
        search_count = popular_searches.search_count + 1,
        last_searched_at = now()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;


-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

/**
 * Soft delete: set deleted_at instead of removing the row.
 */
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.deleted_at = now();
    NEW.is_active = false;
    RETURN NEW;
END;
$$;


/**
 * Return true if a UUID is not null and not all zeros.
 */
CREATE OR REPLACE FUNCTION is_valid_uuid(val UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
    RETURN val IS NOT NULL AND val != '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$;


COMMIT;