# Tuskrank Database

Production PostgreSQL database for the Tuskrank Pet Food Search & Intelligence platform. Designed for Supabase compatibility, hard-targeted at **100k+ products and millions of searches**.

This file supersedes earlier drafts. The schema has been hardened after a Stripe-grade review pass; the table count, constraints, indexes, and views reflect the post-review shape.

## Files

| File          | Purpose                                                           |
| ------------- | ----------------------------------------------------------------- |
| `schema.sql`  | Tables, enums, check constraints                                  |
| `indexes.sql` | B-tree, partial, unique, GIN trigram, generated FTS vectors       |
| `views.sql`   | Read-only and materialized views                                   |
| `functions.sql` | Slug, scoring, keyword normalization, audit helpers; pinned search_path |
| `triggers.sql`   | updated_at, slug, keyword sync, score history, audit, MV refresh |
| `seed.sql`    | Lookup-only seed (no products/brands/ingredients)                  |
| `README.md`   | This document                                                     |

## Load Order

```sql
\i database/schema.sql
\i database/indexes.sql
\i database/views.sql
\i database/functions.sql
\i database/triggers.sql
\i database/seed.sql
```

## Database Overview

The schema is in **Third Normal Form (3NF)** with selective denormalization only where needed for retrieval speed.

- **Primary keys** are `uuid` (`gen_random_uuid()`).
- **Foreign keys** are explicit. `ON DELETE` is chosen per relationship (`RESTRICT` for canonical lookup rows that should never silently disappear; `CASCADE` for owned child rows; `SET NULL` for optional back-references).
- **Audit columns** on every mutable domain table: `created_at`, `updated_at`, `deleted_at` (soft-delete).
- **Check constraints** are pervasive — sizes, ranges, lengths, regex patterns.
- **Forward-compatible** with RLS (column shapes avoid leaky defaults) and with partitioning (timestamps are natural partition keys).

### High-level ER overview

```
                            brands ────────────┐
                                               │
                                           products
                                               │
    ┌──────────────────────────────────────────┼─────────────────────────────────────┐
    │                                          │                                     │
 product_images                       product_targeting ──┬─ pet_types                  product_alternatives
                            (pet_type required;            ├─ life_stages                related_products
                             life / breed / category         ├─ breed_sizes                 │
                             optional, with bounds)          └─ categories                  └─ relation_types
 product_ingredients ─────────► ingredients ─► ingredient_categories
                                     │
                                     ├─► ingredient_scores ─ (single current row unique)
                                     ├─► ingredient_references ─► scientific_references
                                     └─► search_keywords (via triggers)
 products ──► products.nutrition_profiles (effective_to IS NULL uniqueness)
                ──► product_nutrients (bound: exact/min/max/typical)
                ──► product_claims, product_tags
                ──► product_scores (single current row unique) ─► score_history (append-only)
                ──► seo_pages ─► faq_items

 brands ─┬─► brand_certifications ─► certifications
         ├─► transparency_reports
         └─► recalls (brand- or product-scoped; source + case# dedupe)

 search_logs (raw) / popular_searches (rolling windows)
 search_keywords / search_synonyms (both citext)

 audit_logs (append-only via fn_write_audit; SECURITY DEFINER)
```

## Table Inventory (39 tables)

### Core
- `brands`, `products`, `ingredients`, `ingredient_categories`, `product_ingredients`

### Product information
- `product_images`, `product_targeting`, `nutrition_profiles`, `nutrients`, `product_nutrients`
- `categories`, `life_stages`, `pet_types`, `breed_sizes`, `protein_sources`, `food_forms`
- `claims`, `product_claims`, `tags`, `product_tags`

### Scoring
- `ingredient_scores` (current + history)
- `product_scores` (current, single-current partial unique)
- `score_history` (append-only)

### Science
- `scientific_references`, `ingredient_references`

### Trust
- `recalls`, `certifications`, `brand_certifications`, `transparency_reports`

### Search
- `search_keywords` (citext), `search_synonyms` (citext), `popular_searches` (citext), `search_logs`

### Recommendations
- `product_alternatives`, `related_products`, `relation_types`

### SEO
- `seo_pages`, `faq_items`

### System
- `audit_logs` (append-only)

## Naming Conventions

| Object     | Convention                              | Example                        |
| ---------- | --------------------------------------- | ------------------------------ |
| Tables     | plural snake_case                       | `product_ingredients`          |
| Columns    | snake_case                              | `primary_protein_source_id`    |
| PKs        | `id uuid`                               | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| ENUMs      | singular lower_snake                    | `recall_severity`              |
| Checks     | `ck_<table>_<rule>`                     | `ck_recalls_dates`             |
| Uniques    | `uq_<table>_<col[s]>`                   | `uq_brands_slug`               |
| Indexes    | `idx_<table>_<col[s]>`                  | `idx_products_brand`           |
| Partial UQ | `uq_<table>_<natural>` + `WHERE`        | `uq_pn_product_nutrient_no_profile` |

## Cascade Policy

| Relationship                                       | `ON DELETE` |
| -------------------------------------------------- | ----------- |
| Child row holds the only copy of data              | `CASCADE`   |
| Child row carries independent meaning (e.g. score) | `RESTRICT`  |
| Child has optional back-reference                  | `SET NULL`  |
| Cross-reference / join table                       | `CASCADE`   |
| Lookup row referenced widely                       | `RESTRICT`  |

`pet_types`, `life_stages`, `breed_sizes`, `protein_sources`, `food_forms`, `nutrients`, `claims`, `tags`, `certifications`, `relation_types` are all **RESTRICT** because data loss on these would silently corrupt search and detail views.

## Index Strategy

**~95 indexes** across:

- B-tree on FKs, slug columns, sort keys
- Partial indexes on `deleted_at IS NULL`
- Partial **unique** indexes for soft-delete-aware uniqueness
- Partial **single-current** indexes for `is_current = true` (one row per parent)
- GIN trigram on display names (fuzzy match + autocorrect)
- GIN `tsvector` on generated `search_vector` columns (full-text search)
- GIN on `search_logs.entity_types` (array containment)
- GIN `jsonb_path_ops` on `audit_logs.diff` (forensic search)
- Composite covering indexes for hot read paths (product detail, top-rated lists)

## Performance Strategy

1. **Hot reads pre-aggregated** — `mv_top_rated_products`, `mv_top_rated_ingredients`, `mv_top_brands`, `mv_latest_recalls` are materialized and refreshed via `fn_refresh_materialized_views()`.
2. **Generated `search_vector` columns** keep FTS indexes consistent without trigger overhead.
3. **Partial indexes on `deleted_at IS NULL`** keep hot reads cheap as tombstone volume grows.
4. **Single-current partial uniques** prevent index bloat on scoring tables.
5. **Composite covering indexes** target top-rated, comparison, and recall widget reads.
6. **Score history** is append-only with no application UPDATE path — partitioned by month in a subsequent Sprint.
7. **`search_logs`** will be partitioned by `took_at` once it crosses ~5M rows.
8. **`audit_logs.diff`** generated from `before`/`after` with `jsonb_path_ops` GIN — fast forensic queries.

## Scaling Strategy

| Volume tier        | Action                                                              |
| ------------------ | ------------------------------------------------------------------- |
| 0 → 100k products  | Baseline as written.                                                 |
| 100k → 1M products | Monthly partitioning of `search_logs` and `audit_logs`. `pg_stat_statements` observability. |
| 1M → 10M products  | Read replicas. Switch materialized views to fast refresh (publication-based). |
| 10M+ products      | Consider moving FTS to a dedicated engine if pg FTS becomes a bottleneck. |

Future migrations remain **backward compatible for one minor release**.

## Functions

- `fn_touch_updated_at()` — `BEFORE UPDATE` row trigger helper
- `fn_generate_slug(text)` — pure slugifier (immutable)
- `fn_ensure_slug(text, text, text, uuid)` — unique-slug within a table
- `fn_normalize_keyword(text)` — case/whitespace fold for search
- `fn_overall_score(...)` — deterministic weighted overall score
- `fn_soft_delete()` — sets `deleted_at` if NULL
- `fn_soft_delete_keywords()` — cascade-soft-delete a brand/product/ingredient's search keys
- `fn_upsert_search_keyword(...)` — idempotent keyword upsert (uses citext `uq_search_keywords_unique`)
- `fn_refresh_search_index(text)` — manual ops hook (no-op; GENERATED columns auto-maintain)
- `fn_write_audit(...)` — **SECURITY DEFINER** single-entry audit writer
- `fn_match_score(text, text)` — pg_trgm similarity
- `fn_slug_from_name()` — trigger factory for name → slug
- `fn_product_images_single_primary()` — enforces one primary image per product
- `fn_refresh_materialized_views()` — batch refresh of all MVs

All plpgsql functions are pinned to `SET search_path = public` for predictable RLS-evaluated behaviour.

## Triggers

- `updated_at` triggers generated for **every table that has an `updated_at` column**.
- Slug triggers on 14 name-bearing tables (configurable list in `triggers.sql`).
- Search-keyword sync triggers on brands/products/ingredients/product_ingredients.
- Soft-delete keyword cascade triggers on brands/products/ingredients.
- Single-primary-image guard trigger on `product_images`.
- Score history BEFORE-UPDATE trigger on `product_scores` archives the OLD row.
- Score audit triggers (`product_scores`, `ingredient_scores`) write to `audit_logs` via `fn_write_audit`.
- No direct insert-from-trigger to `audit_logs`; writes always go through the SECURITY DEFINER wrapper.

## Views

| View / Materialized               | Type           | Notes                                 |
| --------------------------------- | -------------- | ------------------------------------- |
| `v_top_rated_products`            | plain          | live top products                     |
| `v_top_rated_ingredients`         | plain          | live top ingredients                  |
| `v_top_brands`                    | plain          | live top brands                       |
| `v_latest_recalls`                | plain          | live recall stream                    |
| `v_trending_searches`             | plain          | rolling aggregates                    |
| `v_product_detail`                | plain          | joined detail page read               |
| `v_ingredient_detail`             | plain          | joined ingredient detail read         |
| `v_product_ingredient_list`       | plain          | ordered ingredient panel              |
| `v_current_product_scores`        | plain          | window-function current view (audit)  |
| `mv_top_rated_products`           | materialized   | refreshed via `fn_refresh_materialized_views` |
| `mv_top_rated_ingredients`        | materialized   | unique-indexed for CONCURRENT refresh |
| `mv_top_brands`                   | materialized   | brand-level aggregates                |
| `mv_latest_recalls`               | materialized   | last 365 days                         |

All plain views use `WITH (security_invoker = true)` so RLS (when wired in a Sprint-1.1 follow-up) is evaluated against the calling role.

## Security

- `citext` for normalized text ⇒ case-insensitive equality without indexes drifting.
- `CHAR(2)` for `country_code` (Postgres validates length automatically).
- All free-text URLs validated via regex at insert/update (`^https?://`).
- Audit logs are append-only via `fn_write_audit()`; direct INSERT/UPDATE/DELETE on `audit_logs` from API roles is not granted.
- `pg_trgm`, `pgcrypto`, and `citext` extensions are first-class.
- All `pgcrypto` UUIDs use `gen_random_uuid()`; not sequence-based.

## Seed Data

`seed.sql` inserts **only lookup data**, all idempotent (`ON CONFLICT … DO NOTHING` or `WHERE NOT EXISTS`):

- `pet_types` (5), `life_stages` (per pet type), `breed_sizes` (per pet type)
- `food_forms` (10), `protein_sources` (16, typed via `protein_origin`)
- `ingredient_categories` (10)
- `claims` (12), `tags` (14)
- `relation_types` (6, supports symmetric & directed edges)

**No products, brands, or ingredients seeded.**

## Future Migration Strategy

1. **Append-only.** Migrations are never edited once merged.
2. **Forward + back.** Every migration has an equivalent `down` SQL.
3. **One logical change per migration.** No mixing schema and data migrations.
4. **Long deprecations first.** Rename → create new + dual-write → drop old in a later release.
5. **Data migrations** live in `database/migrations/data/`.
6. **CI target:** canonical baseline = `schema + indexes + views + functions + triggers + seed`. Round-trip in CI before merge.

## What This Database Does NOT Contain

- No application business logic
- No fake / demo products, brands, or ingredients
- No row-level security policies yet — schema is RLS-ready. Wiring lives in a Sprint-1.1 follow-up migration to keep this baseline deployment-portable.
- No numberings migrations folder yet (`database/migrations/`): this baseline IS the canonical schema. Versioned migrations begin in the next minor.
- No API endpoints
- No front-end
