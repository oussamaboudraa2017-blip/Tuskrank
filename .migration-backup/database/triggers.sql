-- ============================================================
-- Tuskrank — Production Database Triggers
-- ------------------------------------------------------------
-- 1. updated_at touch on every table with updated_at.
-- 2. slug auto-fill on tables that have BOTH name + slug.
-- 3. search-keyword sync on brands/products/ingredients
--    (insert/update of name) and soft-delete cleanup.
-- 4. score-history archive + audit on product_scores.
-- 5. product_images "single primary" guard.
-- ============================================================

SET client_min_messages = WARNING;

SET search_path = public;

-- ============================================================
-- updated_at triggers (auto-applied)
-- ============================================================
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.column_name  = 'updated_at'
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_touch_updated_at ON %I;',
            r.table_name, r.table_name
        );
        EXECUTE format(
            'CREATE TRIGGER trg_%s_touch_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();',
            r.table_name, r.table_name
        );
    END LOOP;
END
$$;

-- ============================================================
-- Slug triggers on name-bearing lookup + core tables
-- ============================================================
DO $$
DECLARE
    r record;
    v_tables text[] := array[
        'pet_types','life_stages','breed_sizes','food_forms','protein_sources',
        'ingredient_categories','claims','tags','nutrients',
        'brands','ingredients','products','categories','certifications',
        'relation_types'
    ];
BEGIN
    FOR r IN
        SELECT c.table_name
        FROM information_schema.columns c
        JOIN information_schema.columns s
          ON s.table_schema = c.table_schema
         AND s.table_name   = c.table_name
        WHERE c.table_schema = 'public'
          AND c.column_name  = 'name'
          AND s.column_name  = 'slug'
          AND c.table_name = ANY(v_tables)
    LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS trg_%s_slug ON %I;',
            r.table_name, r.table_name
        );
        EXECUTE format(
            'CREATE TRIGGER trg_%s_slug BEFORE INSERT ON %I
             FOR EACH ROW EXECUTE FUNCTION fn_slug_from_name();',
            r.table_name, r.table_name
        );
    END LOOP;
END
$$;

-- ============================================================
-- Search keyword sync (insert / update of name)
-- ============================================================

CREATE OR REPLACE FUNCTION trg_brands_sync_keyword()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    PERFORM fn_upsert_search_keyword('brand', NEW.id, NEW.name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_brands_sync_keyword_insert ON brands;
CREATE TRIGGER trg_brands_sync_keyword_insert
AFTER INSERT ON brands
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION trg_brands_sync_keyword();

DROP TRIGGER IF EXISTS trg_brands_sync_keyword_update ON brands;
CREATE TRIGGER trg_brands_sync_keyword_update
AFTER UPDATE OF name ON brands
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION trg_brands_sync_keyword();

DROP TRIGGER IF EXISTS trg_brands_soft_delete_keywords ON brands;
CREATE TRIGGER trg_brands_soft_delete_keywords
AFTER UPDATE OF deleted_at ON brands
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION fn_soft_delete_keywords();

CREATE OR REPLACE FUNCTION trg_products_sync_keyword()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    PERFORM fn_upsert_search_keyword('product', NEW.id, NEW.name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_sync_keyword_insert ON products;
CREATE TRIGGER trg_products_sync_keyword_insert
AFTER INSERT ON products
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION trg_products_sync_keyword();

DROP TRIGGER IF EXISTS trg_products_sync_keyword_update ON products;
CREATE TRIGGER trg_products_sync_keyword_update
AFTER UPDATE OF name ON products
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION trg_products_sync_keyword();

DROP TRIGGER IF EXISTS trg_products_soft_delete_keywords ON products;
CREATE TRIGGER trg_products_soft_delete_keywords
AFTER UPDATE OF deleted_at ON products
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION fn_soft_delete_keywords();

CREATE OR REPLACE FUNCTION trg_ingredients_sync_keyword()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    PERFORM fn_upsert_search_keyword('ingredient', NEW.id, NEW.name);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ingredients_sync_keyword_insert ON ingredients;
CREATE TRIGGER trg_ingredients_sync_keyword_insert
AFTER INSERT ON ingredients
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION trg_ingredients_sync_keyword();

DROP TRIGGER IF EXISTS trg_ingredients_sync_keyword_update ON ingredients;
CREATE TRIGGER trg_ingredients_sync_keyword_update
AFTER UPDATE OF name ON ingredients
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL)
EXECUTE FUNCTION trg_ingredients_sync_keyword();

DROP TRIGGER IF EXISTS trg_ingredients_soft_delete_keywords ON ingredients;
CREATE TRIGGER trg_ingredients_soft_delete_keywords
AFTER UPDATE OF deleted_at ON ingredients
FOR EACH ROW
WHEN (NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION fn_soft_delete_keywords();

-- product_ingredients raw_label keyword ingestion
CREATE OR REPLACE FUNCTION trg_product_ingredients_sync_keyword()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF NEW.raw_label IS NOT NULL AND length(NEW.raw_label) > 0 THEN
        PERFORM fn_upsert_search_keyword('product', NEW.product_id, NEW.raw_label);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pi_sync_keyword ON product_ingredients;
CREATE TRIGGER trg_pi_sync_keyword
AFTER INSERT OR UPDATE OF raw_label ON product_ingredients
FOR EACH ROW
WHEN (NEW.deleted_at IS NULL AND NEW.raw_label IS NOT NULL)
EXECUTE FUNCTION trg_product_ingredients_sync_keyword();

-- ============================================================
-- Single-primary image guard
-- ------------------------------------------------------------
-- Reject inserts/updates that try to add a second primary image
-- to the same product. Does NOT rely on the partial unique index
-- alone (since partial indices cannot be CHECK-referenced).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_product_images_single_primary()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_existing_count integer;
BEGIN
    IF NEW.is_primary THEN
        SELECT count(*) INTO v_existing_count
        FROM product_images
        WHERE product_id = NEW.product_id
          AND is_primary
          AND deleted_at IS NULL
          AND id IS DISTINCT FROM NEW.id;
        IF v_existing_count > 0 THEN
            RAISE EXCEPTION 'product_images: product % already has a primary image', NEW.product_id
                USING ERRCODE = 'unique_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_images_single_primary ON product_images;
CREATE TRIGGER trg_product_images_single_primary
BEFORE INSERT OR UPDATE OF is_primary ON product_images
FOR EACH ROW
WHEN (NEW.is_primary)
EXECUTE FUNCTION fn_product_images_single_primary();

-- ============================================================
-- product_scores history archive + audit
-- ------------------------------------------------------------
-- The "history" trigger fires BEFORE UPDATE: when an existing
-- current row is updated (e.g. recompute), archive the OLD row to
-- score_history with triggered_by='data_change'.
-- The "audit" trigger fires AFTER INSERT or UPDATE and writes
-- to audit_logs via fn_write_audit (SECURITY DEFINER), which
-- keeps non-application callers from forging audit entries.
-- ============================================================
CREATE OR REPLACE FUNCTION trg_product_scores_history()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.is_current THEN
        INSERT INTO score_history (
            product_id, overall_score, quality_score, safety_score,
            nutrition_score, transparency_score, scoring_version,
            triggered_by, notes
        ) VALUES (
            OLD.product_id, OLD.overall_score, OLD.quality_score, OLD.safety_score,
            OLD.nutrition_score, OLD.transparency_score, OLD.scoring_version,
            'data_change', 'archive from product_scores update'
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_scores_history ON product_scores;
CREATE TRIGGER trg_product_scores_history
BEFORE UPDATE ON product_scores
FOR EACH ROW
EXECUTE FUNCTION trg_product_scores_history();

CREATE OR REPLACE FUNCTION trg_product_scores_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    PERFORM fn_write_audit(
        p_actor_id    => NULL,
        p_actor_type  => 'system',
        p_entity_type => 'product_scores',
        p_entity_id   => NEW.id,
        p_action      => CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
        p_before      => to_jsonb(OLD),
        p_after       => to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_scores_audit ON product_scores;
CREATE TRIGGER trg_product_scores_audit
AFTER INSERT OR UPDATE ON product_scores
FOR EACH ROW
EXECUTE FUNCTION trg_product_scores_audit();

-- ============================================================
-- ingredient_scores audit (single-writer; lightweight)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_ingredient_scores_audit()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    PERFORM fn_write_audit(
        p_actor_id    => NULL,
        p_actor_type  => 'system',
        p_entity_type => 'ingredient_scores',
        p_entity_id   => NEW.id,
        p_action      => CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
        p_before      => to_jsonb(OLD),
        p_after       => to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ingredient_scores_audit ON ingredient_scores;
CREATE TRIGGER trg_ingredient_scores_audit
AFTER INSERT OR UPDATE ON ingredient_scores
FOR EACH ROW
EXECUTE FUNCTION trg_ingredient_scores_audit();

-- ============================================================
-- Block direct writes to audit_logs from application role.
-- Application roles should use fn_write_audit (SECURITY DEFINER)
-- or be granted INSERT on audit_logs through a tightly-scoped role.
-- ============================================================
-- (No trigger attached here. Direct writes are blocked via RLS policies
-- in a Sprint-1.1 follow-up migration. Documented in database/README.md.)

-- ============================================================
-- Materialized view refresh helper (callable from cron / API)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_refresh_materialized_views()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    v_failures integer := 0;
BEGIN
    -- CONCURRENTLY requires unique indexes (already declared in views.sql).
    -- Each refresh is wrapped in its own savepoint so transient failures
    -- (e.g. one MV in concurrent refresh) don't abort the rest. Errors are
    -- logged but not silently swallowed — caller can check v_failures.
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_rated_products;
    EXCEPTION WHEN OTHERS THEN
        v_failures := v_failures + 1;
        RAISE WARNING 'mv_top_rated_products refresh failed: %', SQLERRM;
    END;

    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_rated_ingredients;
    EXCEPTION WHEN OTHERS THEN
        v_failures := v_failures + 1;
        RAISE WARNING 'mv_top_rated_ingredients refresh failed: %', SQLERRM;
    END;

    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_brands;
    EXCEPTION WHEN OTHERS THEN
        v_failures := v_failures + 1;
        RAISE WARNING 'mv_top_brands refresh failed: %', SQLERRM;
    END;

    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY mv_latest_recalls;
    EXCEPTION WHEN OTHERS THEN
        v_failures := v_failures + 1;
        RAISE WARNING 'mv_latest_recalls refresh failed: %', SQLERRM;
    END;

    IF v_failures > 0 THEN
        RAISE WARNING 'fn_refresh_materialized_views completed with % failure(s)', v_failures;
    END IF;
END;
$$;

-- ============================================================
-- Cycle-prevention triggers on self-referencing tables
-- ============================================================
DROP TRIGGER IF EXISTS trg_categories_cycle_check ON categories;
CREATE TRIGGER trg_categories_cycle_check
BEFORE INSERT OR UPDATE OF parent_id ON categories
FOR EACH ROW
EXECUTE FUNCTION fn_block_self_parent_cycle();

DROP TRIGGER IF EXISTS trg_ingredient_categories_cycle_check ON ingredient_categories;
CREATE TRIGGER trg_ingredient_categories_cycle_check
BEFORE INSERT OR UPDATE OF parent_id ON ingredient_categories
FOR EACH ROW
EXECUTE FUNCTION fn_block_self_parent_cycle();
