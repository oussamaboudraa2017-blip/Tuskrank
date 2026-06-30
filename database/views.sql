-- ============================================================
-- Tuskrank Database Views
-- PostgreSQL 16 / Supabase Compatible
-- ============================================================

BEGIN;

-- ============================================================
-- TOP RATED PRODUCTS
-- ============================================================

/**
 * View: Top rated products with full context.
 * Joins product data with scores, brand, category, and food form.
 * Ordered by overall score descending.
 * Use: SELECT * FROM v_top_rated_products WHERE pet_type_slug = 'dog' LIMIT 20;
 */
CREATE OR REPLACE VIEW v_top_rated_products AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.slug AS product_slug,
    b.name AS brand_name,
    b.slug AS brand_slug,
    c.name AS category_name,
    c.slug AS category_slug,
    pt.name AS pet_type_name,
    pt.slug AS pet_type_slug,
    ff.name AS food_form_name,
    ps.overall_score,
    ps.grade,
    ps.ingredient_quality_score,
    ps.nutritional_adequacy_score,
    ps.safety_score,
    ps.transparency_score,
    p.price_cents,
    p.food_form_id,
    p.category_id,
    p.pet_type_id,
    p.brand_id,
    ps.computed_at AS scored_at
FROM products p
INNER JOIN product_scores ps ON ps.product_id = p.id
INNER JOIN brands b ON b.id = p.brand_id
INNER JOIN categories c ON c.id = p.category_id
INNER JOIN pet_types pt ON pt.id = p.pet_type_id
INNER JOIN food_forms ff ON ff.id = p.food_form_id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
  AND b.deleted_at IS NULL
ORDER BY ps.overall_score DESC, ps.computed_at DESC;


-- ============================================================
-- TOP RATED INGREDIENTS
-- ============================================================

/**
 * View: Top rated ingredients with safety and category info.
 * Use: SELECT * FROM v_top_rated_ingredients WHERE safety_tier = 'premium' LIMIT 20;
 */
CREATE OR REPLACE VIEW v_top_rated_ingredients AS
SELECT
    i.id AS ingredient_id,
    i.name AS ingredient_name,
    i.slug AS ingredient_slug,
    i.scientific_name,
    i.safety_tier,
    i.is_common_allergen,
    i.is_artificial,
    i.is_filler,
    i.is_preservative,
    ic.name AS category_name,
    ic.slug AS category_slug,
    iscore.overall_score,
    iscore.grade,
    iscore.quality_score,
    iscore.safety_score,
    iscore.nutritional_value_score,
    (
        SELECT count(*)
        FROM product_ingredients pi
        INNER JOIN products p ON p.id = pi.product_id AND p.is_active = true AND p.deleted_at IS NULL
        WHERE pi.ingredient_id = i.id
    ) AS product_count
FROM ingredients i
INNER JOIN ingredient_scores iscore ON iscore.ingredient_id = i.id
LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
WHERE i.is_active = true
  AND i.deleted_at IS NULL
ORDER BY iscore.overall_score DESC;


-- ============================================================
-- TOP BRANDS
-- ============================================================

/**
 * View: Top brands ranked by average product score.
 * Includes product count and average grade.
 * Use: SELECT * FROM v_top_brands WHERE pet_type_slug = 'dog' LIMIT 20;
 */
CREATE OR REPLACE VIEW v_top_brands AS
SELECT
    b.id AS brand_id,
    b.name AS brand_name,
    b.slug AS brand_slug,
    b.country,
    b.description,
    count(ps.id) AS product_count,
    round(avg(ps.overall_score), 2) AS avg_overall_score,
    min(ps.overall_score) AS min_score,
    max(ps.overall_score) AS max_score,
    -- Mode grade (most common)
    (
        SELECT ps2.grade
        FROM product_scores ps2
        INNER JOIN products p2 ON p2.id = ps2.product_id
        WHERE p2.brand_id = b.id AND p2.is_active = true AND p2.deleted_at IS NULL
        GROUP BY ps2.grade
        ORDER BY count(*) DESC, ps2.grade ASC
        LIMIT 1
    ) AS common_grade
FROM brands b
INNER JOIN products p ON p.brand_id = b.id AND p.is_active = true AND p.deleted_at IS NULL
INNER JOIN product_scores ps ON ps.product_id = p.id
WHERE b.is_active = true
  AND b.deleted_at IS NULL
GROUP BY b.id, b.name, b.slug, b.country, b.description
ORDER BY avg_overall_score DESC, product_count DESC;


-- ============================================================
-- LATEST RECALLS
-- ============================================================

/**
 * View: Most recent recalls with product and brand context.
 * Use: SELECT * FROM v_latest_recalls ORDER BY recall_date DESC LIMIT 20;
 */
CREATE OR REPLACE VIEW v_latest_recalls AS
SELECT
    r.id AS recall_id,
    r.recall_date,
    r.reason,
    r.severity,
    r.status,
    r.agency,
    r.affected_lots,
    r.resolution_date,
    r.resolution_notes,
    r.announcement_url,
    COALESCE(p.name, 'Multiple products / Brand-wide') AS product_name,
    COALESCE(p.slug, '') AS product_slug,
    COALESCE(b.name, '') AS brand_name,
    COALESCE(b.slug, '') AS brand_slug
FROM recalls r
LEFT JOIN products p ON p.id = r.product_id
LEFT JOIN brands b ON b.id = COALESCE(r.brand_id, (SELECT brand_id FROM products WHERE id = r.product_id))
ORDER BY r.recall_date DESC;


-- ============================================================
-- TRENDING SEARCHES
-- ============================================================

/**
 * View: Trending search queries from the last 7 days.
 * Ordered by search frequency descending.
 * Use: SELECT * FROM v_trending_searches LIMIT 20;
 */
CREATE OR REPLACE VIEW v_trending_searches AS
SELECT
    ps.id,
    ps.query,
    ps.search_count,
    ps.result_count,
    ps.last_searched_at,
    ps.is_trending,
    ps.trend_start_at
FROM popular_searches ps
WHERE ps.last_searched_at >= now() - INTERVAL '7 days'
  AND ps.search_count >= 3
ORDER BY ps.search_count DESC, ps.last_searched_at DESC;


-- ============================================================
-- PRODUCT DETAIL (for API responses)
-- ============================================================

/**
 * View: Full product detail with score and brand.
 * Use: SELECT * FROM v_product_detail WHERE product_slug = 'brand-product-name';
 */
CREATE OR REPLACE VIEW v_product_detail AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.package_weight_oz,
    p.package_weight_label,
    p.price_cents,
    p.currency,
    p.aafco_statement,
    p.manufacturer,
    p.manufacturing_country,
    p.upc,
    p.external_url,
    p.created_at,
    b.id AS brand_id,
    b.name AS brand_name,
    b.slug AS brand_slug,
    c.id AS category_id,
    c.name AS category_name,
    c.slug AS category_slug,
    pt.id AS pet_type_id,
    pt.name AS pet_type_name,
    pt.slug AS pet_type_slug,
    ff.id AS food_form_id,
    ff.name AS food_form_name,
    ff.slug AS food_form_slug,
    ls.id AS life_stage_id,
    ls.name AS life_stage_name,
    bs.id AS breed_size_id,
    bs.name AS breed_size_name,
    ps.id AS product_score_id,
    ps.overall_score,
    ps.grade,
    ps.ingredient_quality_score,
    ps.nutritional_adequacy_score,
    ps.safety_score,
    ps.transparency_score,
    ps.rationale AS score_rationale,
    ps.computed_at AS score_computed_at,
    (
        SELECT url FROM product_images
        WHERE product_id = p.id AND is_primary = true AND is_active = true
        LIMIT 1
    ) AS primary_image_url,
    (
        SELECT count(*) FROM product_ingredients
        WHERE product_id = p.id
    ) AS ingredient_count,
    (
        SELECT count(*) FROM recalls r
        WHERE (r.product_id = p.id OR r.brand_id = p.brand_id) AND r.status = 'active'
    ) AS active_recall_count
FROM products p
INNER JOIN brands b ON b.id = p.brand_id
INNER JOIN categories c ON c.id = p.category_id
INNER JOIN pet_types pt ON pt.id = p.pet_type_id
INNER JOIN food_forms ff ON ff.id = p.food_form_id
LEFT JOIN life_stages ls ON ls.id = p.life_stage_id
LEFT JOIN breed_sizes bs ON bs.id = p.breed_size_id
LEFT JOIN product_scores ps ON ps.product_id = p.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL;


-- ============================================================
-- INGREDIENT DETAIL (for API responses)
-- ============================================================

/**
 * View: Full ingredient detail with score and usage stats.
 * Use: SELECT * FROM v_ingredient_detail WHERE ingredient_slug = 'chicken-meal';
 */
CREATE OR REPLACE VIEW v_ingredient_detail AS
SELECT
    i.id,
    i.name,
    i.slug,
    i.description,
    i.scientific_name,
    i.safety_tier,
    i.is_common_allergen,
    i.is_artificial,
    i.is_filler,
    i.is_preservative,
    i.nutritional_function,
    i.safety_notes,
    i.wikipedia_url,
    i.created_at,
    ic.id AS category_id,
    ic.name AS category_name,
    ic.slug AS category_slug,
    iscore.id AS ingredient_score_id,
    iscore.overall_score,
    iscore.grade,
    iscore.quality_score,
    iscore.safety_score,
    iscore.nutritional_value_score,
    iscore.rationale AS score_rationale,
    (
        SELECT count(*)
        FROM product_ingredients pi
        INNER JOIN products p ON p.id = pi.product_id AND p.is_active = true AND p.deleted_at IS NULL
        WHERE pi.ingredient_id = i.id
    ) AS product_count
FROM ingredients i
LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
LEFT JOIN ingredient_scores iscore ON iscore.ingredient_id = i.id
WHERE i.is_active = true
  AND i.deleted_at IS NULL;


-- ============================================================
-- PRODUCT COMPARISON
-- ============================================================

/**
 * View: Product comparison data.
 * Use with a WHERE filter for specific product IDs.
 * SELECT * FROM v_product_comparison
 * WHERE product_id IN (uuid1, uuid2, uuid3)
 * ORDER BY pn.nutrient_sort_order;
 */
CREATE OR REPLACE VIEW v_product_comparison AS
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.slug AS product_slug,
    b.name AS brand_name,
    ps.overall_score,
    ps.grade,
    ps.ingredient_quality_score,
    ps.nutritional_adequacy_score,
    ps.safety_score,
    ps.transparency_score,
    p.price_cents,
    -- Per-product nutrition data as JSONB for easy comparison
    (
        SELECT jsonb_object_agg(
            n.name,
            jsonb_build_object(
                'min', pn.min_value,
                'max', pn.max_value,
                'guaranteed', pn.guaranteed_value,
                'unit', n.unit
            )
        )
        FROM product_nutrients pn
        INNER JOIN nutrients n ON n.id = pn.nutrient_id
        INNER JOIN nutrition_profiles np ON np.id = pn.nutrition_profile_id
        WHERE np.product_id = p.id
    ) AS nutrition_data,
    -- Ingredient list as ordered array
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'name', i.name,
                'slug', i.slug,
                'ordinal', pi.ordinal_position,
                'is_primary', pi.is_primary,
                'safety_tier', i.safety_tier
            ) ORDER BY pi.ordinal_position
        )
        FROM product_ingredients pi
        INNER JOIN ingredients i ON i.id = pi.ingredient_id
        WHERE pi.product_id = p.id
    ) AS ingredients_list,
    -- Active recalls count
    (
        SELECT count(*)
        FROM recalls r
        WHERE (r.product_id = p.id OR r.brand_id = p.brand_id) AND r.status = 'active'
    ) AS active_recalls
FROM products p
INNER JOIN brands b ON b.id = p.brand_id
INNER JOIN product_scores ps ON ps.product_id = p.id
WHERE p.is_active = true
  AND p.deleted_at IS NULL;


COMMIT;