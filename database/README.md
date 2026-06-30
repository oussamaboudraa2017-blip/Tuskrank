# Tuskrank Database

Pet Food Search & Intelligence Platform — PostgreSQL 16 / Supabase

---

## Overview

The Tuskrank database is a PostgreSQL 16 schema designed for a US-market pet food search and intelligence platform. It supports product search, ingredient analysis, nutritional comparison, AI-powered explanations, and quality scoring.

The schema follows **Third Normal Form (3NF)** with intentional denormalization only where justified by read performance requirements (search index, caching).

---

## Files

| File | Purpose | Execution Order |
|------|---------|----------------|
| `schema.sql` | Tables, enums, constraints, foreign keys | 1st |
| `functions.sql` | Stored functions (slug generation, scoring, search) | 2nd |
| `triggers.sql` | Auto-timestamp, auto-slug, search index refresh | 3rd |
| `indexes.sql` | Performance indexes (all CONCURRENTLY safe) | 4th |
| `views.sql` | Read-optimized views for common queries | 5th |
| `seed.sql` | Lookup data (no products or brands) | 6th |

---

## Table Relationships

```
                        ┌─────────────┐
                        │  pet_types  │
                        └──────┬──────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
   ┌─────────────┐    ┌──────────────┐      ┌──────────────┐
   │ life_stages │    │  categories  │      │   brands     │
   └─────────────┘    └──────┬───────┘      └──────┬───────┘
                             │                      │
                             └──────────┬───────────┘
                                        │
                                        ▼
                                ┌──────────────┐
                          ┌────▶│   products   │◀────┐
                          │     └──┬───┬───┬───┘      │
                          │        │   │   │           │
                   ┌──────┴──┐  ┌──┴┐ ┌┴─┐  ┌───────┴──────┐
                   │product_  │  │   │ │  │  │ nutrition_   │
                   │ingredients│  │   │ │  │  │ profiles     │
                   └────┬─────┘  │   │ │  │  └──────┬───────┘
                        │        │   │ │  │         │
                        ▼        │   │ │  │  ┌──────┴───────┐
                  ┌───────────┐  │   │ │  │  │  product_    │
                  │ingredients│  │   │ │  │  │  nutrients   │
                  └─────┬─────┘  │   │ │  │  └──────────────┘
                        │        │   │ │  │
              ┌─────────┼──────┐ │   │ │  │ ┌──────────────┐
              │         │      │ │   │ │  │ │  product_    │
              ▼         ▼      │ │   │ │  │ │  scores      │
        ┌──────────┐ ┌───────┐ │ │   │ │  │ └──────┬───────┘
        │ingredient│ │search_│ │ │   │ │  │        │
        │_scores   │ │keywords│ │ │   │ │  │ ┌──────┴───────┐
        └──────────┘ └───────┘ │ │   │ │  │ │score_history │
                               │ │   │ │  │ └──────────────┘
                        ┌──────┴┐ ┌┴──┐ │
                        │product│ │   │ │  ┌──────────────┐
                        │_tags  │ │   │ │  │  recalls     │
                        └───────┘ │   │ │  └──────────────┘
                        ┌──────┐  │   │ │
                        │product│  │   │ │  ┌──────────────┐
                        │_claims│  │   │ │  │certifications│
                        └──────┘  │   │ │  └──────────────┘
                                  │   │ │
                        ┌─────────┴┐ ┌┴──┴────┐
                        │product_   │ │product_ │
                        │alternatives│ │images  │
                        └───────────┘ └─────────┘
```

### Key Relationships

- **brands → products**: One brand has many products. `ON DELETE RESTRICT` (cannot delete a brand with products).
- **products → product_ingredients → ingredients**: Many-to-many with ordinal position and quantity.
- **products → nutrition_profiles → product_nutrients → nutrients**: One profile per product, many nutrient values per profile.
- **products → product_scores**: One-to-one (enforced by unique constraint). Scores are computed by `compute_product_score()`.
- **products → recalls**: Loose reference (a recall may reference a product or brand, not both).

---

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Tables | `snake_case` plural | `product_ingredients`, `life_stages` |
| Columns | `snake_case` | `created_at`, `brand_id` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()` |
| Foreign keys | `{singular_table}_id` | `brand_id`, `product_id` |
| Timestamps | `*_at` (timestamptz) | `created_at`, `updated_at`, `deleted_at` |
| Booleans | `is_*` prefix | `is_active`, `is_primary`, `is_verified` |
| Enums | `{name}_enum` | `safety_tier_enum`, `pet_type_enum` |
| Unique constraints | `uq_{table}_{detail}` | `uq_product_ingredient`, `uq_brands_slug` |
| Check constraints | `chk_{table}_{detail}` | `chk_products_price`, `chk_pn_min_max` |
| Functions | `snake_case()` | `compute_product_score()`, `generate_slug()` |
| Views | `v_{descriptive_name}` | `v_top_rated_products`, `v_product_detail` |
| Triggers | `trg_{table}_{purpose}` | `trg_products_updated_at`, `trg_brands_auto_slug` |

---

## Indexes

### Strategy

1. **Foreign key indexes**: Every foreign key column has an index.
2. **Partial indexes**: Use `WHERE deleted_at IS NULL` and `WHERE is_active = true` to reduce index size.
3. **Composite indexes**: For common filter combinations (e.g., `pet_type_id + food_form_id + category_id`).
4. **Trigram indexes** (`gin_trgm_ops`): For fuzzy search on `name` columns of products, ingredients, and brands.
5. **GIN indexes**: For full-text search on `search_keywords.search_vector`.
6. **All `CREATE INDEX CONCURRENTLY`**: Safe to run on production without locking tables.

### Index Count by Table

| Table | Indexes |
|-------|---------|
| `products` | 14 |
| `ingredients` | 7 |
| `brands` | 4 |
| `search_keywords` | 4 |
| `product_scores` | 4 |
| `recalls` | 6 |
| `popular_searches` | 4 |

---

## Performance Strategy

### Read-Heavy Workload

Tuskrank is a read-heavy platform (search, browse, compare). Write operations occur during data ingestion and scoring updates.

1. **Connection pooling**: Use Supabase's built-in PgBouncer (transaction mode). All queries should be compatible with connection pooling (no session-level state).
2. **Partial indexes**: Most queries filter on `is_active = true` and `deleted_at IS NULL`. Partial indexes exclude soft-deleted rows, keeping index size small.
3. **Full-text search**: PostgreSQL native `tsvector` with GIN indexes. Sufficient for initial launch. Plan to evaluate Meilisearch or Typesense if query latency exceeds 200ms at scale.
4. **Views for common queries**: Pre-built views (`v_top_rated_products`, `v_product_detail`, `v_product_comparison`) avoid complex ad-hoc joins in application code.
5. **Denormalized search index**: The `search_keywords` table provides a flat, indexable table for search. Triggers keep it in sync with source data.

### Scoring Performance

The `compute_product_score()` function reads from multiple tables. For batch recomputation:

1. Call `compute_all_product_scores()` during off-peak hours.
2. Single-product recomputation is triggered on demand via admin API.
3. Score history is archived via trigger, not computed on read.

### Caching

- Supabase Edge CDN for API responses.
- Application-level caching (Redis) for computed scores and AI analyses.
- `product_analyses` and `ingredient_analyses` tables cache LLM responses with TTL.

---

## Scaling Strategy

### Phase 1: Launch (0–50K products, <1K concurrent users)

- Single Supabase project with connection pooling.
- PostgreSQL full-text search.
- All queries served from primary database.
- No read replicas needed.

### Phase 2: Growth (50K–200K products, 1K–10K concurrent users)

- Add a read replica via Supabase.
- Route read-only queries to the replica.
- Implement Redis caching for hot queries (popular products, trending searches).
- Consider materialized views for top-rated products (refreshed every 5 minutes).
- Monitor `search_keywords` table size; consider partitioning by `entity_type`.

### Phase 3: Scale (200K+ products, 10K+ concurrent users)

- Evaluate dedicated search engine (Meilisearch, Typesense, or Elasticsearch) for sub-50ms search.
- Partition `audit_logs` by month (append-only table grows fast).
- Partition `score_history` by product_id hash.
- Implement connection pooling at application level (PgBouncer or Supavisor).
- Consider columnar storage for analytics queries (ClickHouse or TimescaleDB).

---

## Soft Delete Strategy

Tables that support soft delete have a `deleted_at TIMESTAMPTZ` column:

- **Core entities**: `brands`, `products`, `ingredients` — soft delete. Data is recoverable.
- **Profiles**: `nutrition_profiles` — soft delete.
- **All other tables**: Hard delete via `ON DELETE CASCADE` or `RESTRICT`.

When a soft-deleted entity is restored, set `deleted_at = NULL` and `is_active = true`.

---

## Migration Strategy

1. All schema changes go through numbered migration files in `database/migrations/`.
2. Migration filenames: `{timestamp}_{description}.sql`.
3. Every migration must be reversible (provide `up` and `down`).
4. Never modify existing migrations — only add new ones.
5. Test migrations on a fresh Supabase database before merging.
6. Use `supabase db push` for development, `supabase db diff` to generate migrations.

---

## Execution

```bash
# On a fresh Supabase database, execute in order:

psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/functions.sql
psql $DATABASE_URL -f database/triggers.sql
psql $DATABASE_URL -f database/indexes.sql
psql $DATABASE_URL -f database/views.sql
psql $DATABASE_URL -f database/seed.sql
```