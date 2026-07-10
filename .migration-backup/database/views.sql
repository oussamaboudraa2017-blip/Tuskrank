-- ============================================================
-- Tuskrank — Production Database Views
-- ------------------------------------------------------------
-- All views:
--   * Marked WITH (security_invoker = true) so RLS (when enabled)
--     is evaluated against the calling role.
--   * Filter to active rows (deleted_at IS NULL).
--   * Indexes paired in indexes.sql where useful.
--
-- Materialized views (top_brands / top_rated) are refreshed by the
-- scheduled maintenance job (see database/README.md). Plain views
-- (detail / panel) stay live so they always reflect current edits.
-- ============================================================

SET client_min_messages = WARNING;

SET search_path = public;

-- ============================================================
-- Top Rated Products (PLAIN view — current product scores)
-- ============================================================
CREATE VIEW v_top_rated_products
WITH (security_invoker = true) AS
SELECT
    p.id              AS product_id,
    p.name            AS product_name,
    p.slug            AS product_slug,
    p.brand_id,
    b.name            AS brand_name,
    b.slug            AS brand_slug,
    ps.overall_score,
    ps.quality_score,
    ps.safety_score,
    ps.nutrition_score,
    ps.transparency_score,
    ps.scoring_version,
    p.published_at,
    p.created_at
FROM products p
JOIN brands b         ON b.id = p.brand_id
JOIN product_scores ps
     ON ps.product_id = p.id
    AND ps.is_current
WHERE p.deleted_at IS NULL
  AND p.is_active
  AND b.deleted_at IS NULL
  AND b.is_active;

-- ============================================================
-- Top Rated Ingredients (PLAIN view)
-- ============================================================
CREATE VIEW v_top_rated_ingredients
WITH (security_invoker = true) AS
SELECT
    i.id             AS ingredient_id,
    i.name           AS ingredient_name,
    i.slug           AS ingredient_slug,
    i.canonical_name,
    i.is_controversial,
    i.is_common_allergen,
    i.is_animal_derived,
    c.id             AS category_id,
    c.name           AS category_name,
    c.slug           AS category_slug,
    s.score,
    s.grade,
    s.reasoning,
    s.scoring_version
FROM ingredients i
JOIN ingredient_scores s
     ON s.ingredient_id = i.id
    AND s.is_current
LEFT JOIN ingredient_categories c
       ON c.id = i.category_id
WHERE i.deleted_at IS NULL
  AND i.is_active
  AND s.deleted_at IS NULL;

-- ============================================================
-- Top Brands (PLAIN view — current scores)
-- ============================================================
CREATE VIEW v_top_brands
WITH (security_invoker = true) AS
WITH product_metrics AS (
    SELECT
        p.brand_id,
        count(*)                                       AS product_count,
        avg(ps.overall_score)                          AS avg_overall_score,
        avg(ps.quality_score)                          AS avg_quality_score,
        avg(ps.safety_score)                           AS avg_safety_score,
        avg(ps.nutrition_score)                        AS avg_nutrition_score,
        avg(ps.transparency_score)                     AS avg_transparency_score
    FROM products p
    JOIN product_scores ps
         ON ps.product_id = p.id
        AND ps.is_current
    WHERE p.deleted_at IS NULL
      AND p.is_active
      AND ps.deleted_at IS NULL
    GROUP BY p.brand_id
),
recall_count AS (
    SELECT
        brand_id,
        count(*) AS open_recall_count
    FROM recalls
    WHERE deleted_at IS NULL
      AND status IN ('announced', 'ongoing')
    GROUP BY brand_id
)
SELECT
    b.id                                              AS brand_id,
    b.name                                            AS brand_name,
    b.slug                                            AS brand_slug,
    b.country_code,
    pm.product_count,
    pm.avg_overall_score,
    pm.avg_quality_score,
    pm.avg_safety_score,
    pm.avg_nutrition_score,
    pm.avg_transparency_score,
    coalesce(rc.open_recall_count, 0)                 AS open_recall_count
FROM brands b
LEFT JOIN product_metrics pm ON pm.brand_id = b.id
LEFT JOIN recall_count rc     ON rc.brand_id = b.id
WHERE b.deleted_at IS NULL
  AND b.is_active;

-- ============================================================
-- Latest Recalls (PLAIN view)
-- ============================================================
CREATE VIEW v_latest_recalls
WITH (security_invoker = true) AS
SELECT
    r.id              AS recall_id,
    r.title,
    r.description,
    r.announced_on,
    r.resolved_on,
    r.severity,
    r.status,
    r.source_label,
    r.source_url,
    r.case_number,
    b.id              AS brand_id,
    b.name            AS brand_name,
    b.slug            AS brand_slug,
    p.id              AS product_id,
    p.name            AS product_name,
    p.slug            AS product_slug
FROM recalls r
LEFT JOIN brands   b ON b.id = r.brand_id   AND b.deleted_at IS NULL
LEFT JOIN products p ON p.id = r.product_id AND p.deleted_at IS NULL
WHERE r.deleted_at IS NULL;

-- ============================================================
-- Trending Searches (PLAIN view — counts raw popular_searches rows)
-- ============================================================
CREATE VIEW v_trending_searches
WITH (security_invoker = true) AS
SELECT
    ps.normalized,
    sum(ps.count)        AS total_count,
    max(ps.window_end)   AS latest_window_end,
    max(ps.locale)       AS locale,
    count(*)             AS window_count
FROM popular_searches ps
WHERE ps.deleted_at IS NULL
GROUP BY ps.normalized;

-- ============================================================
-- Top Rated Products — MATERIALIZED (used by API cache layer)
-- ------------------------------------------------------------
-- Materialized because rebuild-on-every-read is wasteful; API layer
-- pulls from this for top-rated lists. Refresh strategy:
--   * Scheduled: REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_rated_products;
--     hourly during business hours, every 6h off-peak.
--   * Triggered: after scoring pipeline batches finish.
-- ============================================================
CREATE MATERIALIZED VIEW mv_top_rated_products AS
SELECT
    p.id              AS product_id,
    p.name            AS product_name,
    p.slug            AS product_slug,
    p.brand_id,
    b.name            AS brand_name,
    b.slug            AS brand_slug,
    ps.overall_score,
    ps.quality_score,
    ps.safety_score,
    ps.nutrition_score,
    ps.transparency_score,
    ps.scoring_version,
    p.published_at
FROM products p
JOIN brands b         ON b.id = p.brand_id
JOIN product_scores ps
     ON ps.product_id = p.id
    AND ps.is_current
WHERE p.deleted_at IS NULL
  AND p.is_active
  AND b.deleted_at IS NULL
  AND b.is_active;

-- Unique index required for CONCURRENTLY refresh.
CREATE UNIQUE INDEX uq_mv_top_rated_products_id
    ON mv_top_rated_products (product_id);
CREATE INDEX idx_mv_top_rated_products_overall
    ON mv_top_rated_products (overall_score DESC, published_at DESC);
CREATE INDEX idx_mv_top_rated_products_brand
    ON mv_top_rated_products (brand_id, overall_score DESC);

-- ============================================================
-- Top Brands — MATERIALIZED (used by brand explorer)
-- ============================================================
CREATE MATERIALIZED VIEW mv_top_brands AS
WITH product_metrics AS (
    SELECT
        p.brand_id,
        count(*)                            AS product_count,
        avg(ps.overall_score)               AS avg_overall_score,
        avg(ps.quality_score)               AS avg_quality_score,
        avg(ps.safety_score)                AS avg_safety_score,
        avg(ps.nutrition_score)             AS avg_nutrition_score,
        avg(ps.transparency_score)          AS avg_transparency_score
    FROM products p
    JOIN product_scores ps
         ON ps.product_id = p.id
        AND ps.is_current
    WHERE p.deleted_at IS NULL
      AND p.is_active
      AND ps.deleted_at IS NULL
    GROUP BY p.brand_id
),
recall_count AS (
    SELECT brand_id, count(*) AS open_recall_count
    FROM recalls
    WHERE deleted_at IS NULL AND status IN ('announced', 'ongoing')
    GROUP BY brand_id
)
SELECT
    b.id                              AS brand_id,
    b.name                            AS brand_name,
    b.slug                            AS brand_slug,
    b.country_code,
    pm.product_count,
    pm.avg_overall_score,
    pm.avg_quality_score,
    pm.avg_safety_score,
    pm.avg_nutrition_score,
    pm.avg_transparency_score,
    coalesce(rc.open_recall_count, 0) AS open_recall_count
FROM brands b
LEFT JOIN product_metrics pm ON pm.brand_id = b.id
LEFT JOIN recall_count rc    ON rc.brand_id = b.id
WHERE b.deleted_at IS NULL
  AND b.is_active;

CREATE UNIQUE INDEX uq_mv_top_brands_id
    ON mv_top_brands (brand_id);
CREATE INDEX idx_mv_top_brands_overall
    ON mv_top_brands (avg_overall_score DESC NULLS LAST, product_count DESC);

-- ============================================================
-- Top Rated Ingredients — MATERIALIZED
-- ============================================================
CREATE MATERIALIZED VIEW mv_top_rated_ingredients AS
SELECT
    i.id             AS ingredient_id,
    i.name           AS ingredient_name,
    i.slug           AS ingredient_slug,
    i.canonical_name,
    i.is_controversial,
    i.is_common_allergen,
    i.is_animal_derived,
    c.id             AS category_id,
    c.name           AS category_name,
    c.slug           AS category_slug,
    s.score,
    s.grade,
    s.reasoning,
    s.scoring_version
FROM ingredients i
JOIN ingredient_scores s
     ON s.ingredient_id = i.id
    AND s.is_current
LEFT JOIN ingredient_categories c ON c.id = i.category_id
WHERE i.deleted_at IS NULL
  AND i.is_active
  AND s.deleted_at IS NULL;

CREATE UNIQUE INDEX uq_mv_top_rated_ingredients_id
    ON mv_top_rated_ingredients (ingredient_id);
CREATE INDEX idx_mv_top_rated_ingredients_score
    ON mv_top_rated_ingredients (score DESC);

-- ============================================================
-- Latest Recalls — MATERIALIZED (last 365 days only)
-- ============================================================
CREATE MATERIALIZED VIEW mv_latest_recalls AS
SELECT
    r.id              AS recall_id,
    r.title,
    r.description,
    r.announced_on,
    r.resolved_on,
    r.severity,
    r.status,
    r.source_label,
    r.source_url,
    r.case_number,
    b.id              AS brand_id,
    b.name            AS brand_name,
    b.slug            AS brand_slug,
    p.id              AS product_id,
    p.name            AS product_name,
    p.slug            AS product_slug
FROM recalls r
LEFT JOIN brands   b ON b.id = r.brand_id   AND b.deleted_at IS NULL
LEFT JOIN products p ON p.id = r.product_id AND p.deleted_at IS NULL
WHERE r.deleted_at IS NULL
  AND r.announced_on >= (current_date - interval '365 days');

CREATE UNIQUE INDEX uq_mv_latest_recalls_id
    ON mv_latest_recalls (recall_id);
CREATE INDEX idx_mv_latest_recalls_date
    ON mv_latest_recalls (announced_on DESC);
CREATE INDEX idx_mv_latest_recalls_brand
    ON mv_latest_recalls (brand_id, announced_on DESC);

-- ============================================================
-- Product Detail (live view)
-- ============================================================
CREATE VIEW v_product_detail
WITH (security_invoker = true) AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.upc,
    p.sku,
    p.package_size_grams,
    p.package_size_label,
    p.published_at,
    p.created_at,
    p.updated_at,
    b.id            AS brand_id,
    b.name          AS brand_name,
    b.slug          AS brand_slug,
    ff.name         AS food_form_name,
    ff.slug         AS food_form_slug,
    prs.name        AS primary_protein_name,
    prs.slug        AS primary_protein_slug,
    ps.overall_score,
    ps.quality_score,
    ps.safety_score,
    ps.nutrition_score,
    ps.transparency_score,
    ps.scoring_version
FROM products p
JOIN brands b                  ON b.id = p.brand_id
LEFT JOIN food_forms ff        ON ff.id = p.food_form_id
LEFT JOIN protein_sources prs  ON prs.id = p.primary_protein_source_id
LEFT JOIN product_scores ps    ON ps.product_id = p.id AND ps.is_current
WHERE p.deleted_at IS NULL
  AND p.is_active
  AND b.deleted_at IS NULL
  AND b.is_active;

-- ============================================================
-- Ingredient Detail (live view)
-- ============================================================
CREATE VIEW v_ingredient_detail
WITH (security_invoker = true) AS
SELECT
    i.id,
    i.name,
    i.slug,
    i.inci_name,
    i.canonical_name,
    i.is_animal_derived,
    i.is_common_allergen,
    i.is_controversial,
    i.description,
    c.id            AS category_id,
    c.name          AS category_name,
    c.slug          AS category_slug,
    s.score,
    s.grade,
    s.reasoning,
    s.scoring_version
FROM ingredients i
LEFT JOIN ingredient_categories c ON c.id = i.category_id
LEFT JOIN ingredient_scores    s
       ON s.ingredient_id = i.id AND s.is_current
WHERE i.deleted_at IS NULL
  AND i.is_active;

-- ============================================================
-- Product Ingredients (ordered ingredient panel)
-- ============================================================
CREATE VIEW v_product_ingredient_list
WITH (security_invoker = true) AS
SELECT
    pi.id                AS product_ingredient_id,
    pi.product_id,
    pi.position,
    pi.raw_label,
    pi.is_primary,
    pi.percentage_value,
    i.id                 AS ingredient_id,
    i.name               AS ingredient_name,
    i.slug               AS ingredient_slug,
    i.canonical_name,
    i.is_controversial,
    i.is_common_allergen,
    i.is_animal_derived,
    s.grade              AS ingredient_grade,
    s.score              AS ingredient_score
FROM product_ingredients pi
JOIN ingredients i            ON i.id  = pi.ingredient_id
LEFT JOIN ingredient_scores s ON s.ingredient_id = i.id AND s.is_current
WHERE pi.deleted_at IS NULL
  AND i.deleted_at IS NULL
  AND i.is_active;

-- ============================================================
-- Current vs Historical view aids
-- ------------------------------------------------------------
-- A consistent "current_scores" view that does NOT rely on the
-- is_current boolean (which is mutated inside transactions).
-- It instead uses ROW_NUMBER() over (product_id, score_version_time DESC).
-- Useful for auditing / debugging partial updates.
-- ============================================================
CREATE VIEW v_current_product_scores
WITH (security_invoker = true) AS
SELECT *
FROM (
    SELECT
        ps.*,
        row_number() OVER (
            PARTITION BY ps.product_id
            ORDER BY ps.created_at DESC
        ) AS rn
    FROM product_scores ps
    WHERE ps.deleted_at IS NULL
) s
WHERE rn = 1;
