-- ============================================================
-- Tuskrank — Production Database Functions
-- ------------------------------------------------------------
-- All plpgsql functions are pinned to `public` via SET search_path = public
-- for predictable behavior under RLS.
-- ============================================================

SET client_min_messages = WARNING;

SET search_path = public;

-- ============================================================
-- updated_at touch helper
-- ============================================================
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- ============================================================
-- Slug generation (pure, deterministic)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generate_slug(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
    SELECT trim(both '-' FROM regexp_replace(lower(coalesce(input_text, '')),
        '[^a-z0-9]+', '-', 'g'));
$$;

-- ============================================================
-- Unique slug in a target table/column
-- ------------------------------------------------------------
-- Note: p_table and p_column are SQL identifiers used inside
-- dynamic SQL. We accept only the safe subset [a-z0-9_] to
-- prevent identifier-injection. Callers must pass values from a
-- trusted whitelist (trigger factory in this codebase).
-- ============================================================
CREATE OR REPLACE FUNCTION fn_ensure_slug(
    p_table text,
    p_column text,
    p_base text,
    p_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_slug text;
    v_candidate text;
    v_n integer := 0;
    v_taken boolean;
    v_sql text;
BEGIN
    -- Identifier safety: only allow simple snake_case names
    IF p_table !~ '^[a-z][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'fn_ensure_slug: invalid table name %', p_table
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF p_column !~ '^[a-z][a-z0-9_]*$' THEN
        RAISE EXCEPTION 'fn_ensure_slug: invalid column name %', p_column
            USING ERRCODE = 'invalid_parameter_value';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
    ) THEN
        RAISE EXCEPTION 'fn_ensure_slug: %.% does not exist', p_table, p_column
            USING ERRCODE = 'undefined_column';
    END IF;

    v_slug := fn_generate_slug(p_base);
    IF v_slug IS NULL OR v_slug = '' THEN
        v_slug := 'item';
    END IF;

    v_candidate := v_slug;
    LOOP
        v_sql := format(
            'SELECT EXISTS (
                SELECT 1 FROM %I WHERE %I = $1 AND ($2::uuid IS NULL OR id <> $2)
            )',
            p_table, p_column
        );
        EXECUTE v_sql USING v_candidate, p_id INTO v_taken;
        EXIT WHEN NOT v_taken;
        v_n := v_n + 1;
        v_candidate := v_slug || '-' || v_n;
        EXIT WHEN v_n > 999;
    END LOOP;
    RETURN v_candidate;
END;
$$;

-- ============================================================
-- Search keyword normalization (pure)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_normalize_keyword(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
    SELECT trim(both ' ' FROM regexp_replace(lower(coalesce(input_text, '')),
        '\s+', ' ', 'g'));
$$;

-- ============================================================
-- Overall weighted product score (deterministic)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_overall_score(
    p_quality        numeric,
    p_safety         numeric,
    p_nutrition      numeric,
    p_transparency   numeric,
    p_w_quality      numeric DEFAULT 0.30,
    p_w_safety       numeric DEFAULT 0.30,
    p_w_nutrition    numeric DEFAULT 0.25,
    p_w_transparency numeric DEFAULT 0.15
)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
    v_total_weight numeric := p_w_quality + p_w_safety + p_w_nutrition + p_w_transparency;
    v_q numeric := greatest(0, least(100, coalesce(p_quality,     0)));
    v_s numeric := greatest(0, least(100, coalesce(p_safety,      0)));
    v_n numeric := greatest(0, least(100, coalesce(p_nutrition,   0)));
    v_t numeric := greatest(0, least(100, coalesce(p_transparency, 0)));
    v_score numeric;
BEGIN
    IF v_total_weight <= 0 THEN
        RETURN 0;
    END IF;
    v_score := (v_q * p_w_quality
              + v_s * p_w_safety
              + v_n * p_w_nutrition
              + v_t * p_w_transparency) / v_total_weight;
    RETURN round(v_score, 2);
END;
$$;

-- ============================================================
-- Soft delete helper
-- ============================================================
CREATE OR REPLACE FUNCTION fn_soft_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.deleted_at IS NULL THEN
        NEW.deleted_at := now();
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

-- ============================================================
-- Upsert a search keyword row
-- ============================================================
CREATE OR REPLACE FUNCTION fn_upsert_search_keyword(
    p_entity_type text,
    p_entity_id   uuid,
    p_raw         text,
    p_locale      text DEFAULT 'en-US'
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_normalized citext := fn_normalize_keyword(p_raw);
    v_id uuid;
BEGIN
    INSERT INTO search_keywords (normalized, raw, entity_type, entity_id, locale)
    VALUES (v_normalized, p_raw, p_entity_type, p_entity_id, p_locale)
    ON CONFLICT ON CONSTRAINT uq_search_keywords_unique DO UPDATE
       SET raw         = excluded.raw,
           updated_at  = now(),
           deleted_at  = NULL
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- ============================================================
-- Refresh search vectors (op-stable hook)
-- ------------------------------------------------------------
-- GENERATED ... STORED columns auto-maintain on row write.
-- This function is kept as a no-op documented entry point so
-- operators have a consistent name for emergency rebuilds.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_refresh_search_index(p_entity text DEFAULT 'all')
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- Intentional no-op.
    RETURN;
END;
$$;

-- ============================================================
-- Audit write helper
-- ------------------------------------------------------------
-- Single helper used by application code and triggers. Inserts into
-- audit_logs. Accepts a jsonb DIFF already prepared by caller.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_write_audit(
    p_actor_id     uuid,
    p_actor_type   text,
    p_entity_type  text,
    p_entity_id    uuid,
    p_action       text,
    p_before       jsonb DEFAULT NULL,
    p_after        jsonb DEFAULT NULL,
    p_request_id   text DEFAULT NULL,
    p_ip_address   inet DEFAULT NULL,
    p_user_agent   text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id           uuid      := gen_random_uuid();
    v_actor_type   actor_type_t;
BEGIN
    -- Strict: an unknown actor string is a programmer error.
    IF p_actor_type IS NOT NULL THEN
        v_actor_type := p_actor_type::actor_type_t;
    END IF;
    INSERT INTO audit_logs (
        id, occurred_at, actor_id, actor_type,
        entity_type, entity_id, action,
        before, after,
        request_id, ip_address, user_agent
    ) VALUES (
        v_id, now(), p_actor_id, v_actor_type,
        p_entity_type, p_entity_id, p_action,
        p_before, p_after,
        p_request_id, p_ip_address, p_user_agent
    );
    RETURN v_id;
END;
$$;

-- SECURITY DEFINER is safe here because the function has a hardcoded
-- search_path and inserts only into audit_logs. Application callers
-- therefore do not need INSERT privileges on audit_logs directly,
-- which prevents raw-API writes from faking audit entries.

-- ============================================================
-- Search & ranking helpers (used by API; not triggers)
-- ------------------------------------------------------------
-- These are kept simple / SQL-immutable where possible to benefit
-- from Postgres planner caching.
-- ============================================================

-- Trigram match score for a name against a query.
-- Returns the pg_trgm `similarity()` clamped to [0, 1].
CREATE OR REPLACE FUNCTION fn_match_score(name text, query text)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = public
AS $$
    SELECT similarity(coalesce(name, ''), coalesce(query, ''));
$$;

-- =================================================================
-- Slug-from-name trigger factory
-- =================================================================
-- The trigger reads NEW.name and computes a unique slug within
-- the current table. The factory is a single function with
-- GENERIC visibility into NEW.name and NEW.id.
CREATE OR REPLACE FUNCTION fn_slug_from_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := fn_ensure_slug(TG_TABLE_NAME, 'slug', NEW.name, NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

-- =================================================================
-- Soft-delete keyword cleanup
-- =================================================================
-- When an entity is soft-deleted, mark its search keywords deleted.
CREATE OR REPLACE FUNCTION fn_soft_delete_keywords()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.deleted_at IS NOT NULL
       AND (OLD.deleted_at IS NULL OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    THEN
        UPDATE search_keywords
           SET deleted_at = now(),
               updated_at = now()
         WHERE entity_id = NEW.id
           AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$;

-- =================================================================
-- Cycle prevention for self-referencing tables
-- =================================================================
-- Rejects inserts/updates that would create a cycle via parent_id
-- in tables where parent_id references the same table.
-- Trigger callers must pass the parent column name explicitly.
-- Walk the parent chain using a bounded loop with depth limit.
CREATE OR REPLACE FUNCTION fn_block_self_parent_cycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_current uuid := NEW.parent_id;
    v_depth   integer := 0;
    v_max     constant integer := 16;
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Direct cycle (parent = self) is blocked by ck_<table>_no_self_parent
    -- but check anyway for defence in depth.
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'cycle: row cannot be its own parent'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Walk upward bounded by depth.
    WHILE v_current IS NOT NULL LOOP
        v_depth := v_depth + 1;
        IF v_depth > v_max THEN
            RAISE EXCEPTION 'cycle: depth exceeds % (possible cycle in %)', v_max, TG_TABLE_NAME
                USING ERRCODE = 'check_violation';
        END IF;

        EXECUTE format(
            'SELECT parent_id FROM %I WHERE id = $1', TG_TABLE_NAME
        ) USING v_current INTO v_current;

        IF v_current = NEW.id THEN
            RAISE EXCEPTION 'cycle detected in % (parent chain returns to self)', TG_TABLE_NAME
                USING ERRCODE = 'check_violation';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;
