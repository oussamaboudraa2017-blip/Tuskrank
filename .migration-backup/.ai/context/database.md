# Database

> _Placeholder — to be elaborated in Sprint 1 (Sprint_01_Database)._

## Overview

Tuskrank uses **PostgreSQL** as its primary data store, accessed through **Supabase**. The database hosts structured product, brand, and ingredient data, plus user, comparison, and search data.

## Design Principles

1. **Single source of truth** — `database/schema/` is canonical.
2. **Migrations are append-only** — never edit old migrations.
3. **Seed and schema are decoupled** — schema is structural, seeds are data.
4. **Indexes are explicit** — created in migrations, reviewed in PRs.
5. **No business logic in the DB** — except atomic SQL operations where justified.

## Expected Top-Level Domains

- `products`, `brands`, `ingredients`, `product_ingredients`
- `nutritional_analyses`, `ingredient_scores`, `quality_grades`
- `users`, `profiles`, `saved_products`, `comparisons`
- `search_logs`, `ai_explanations`, `feedback`
- `audit_logs`, `admin_users`

## Folder Conventions

- `database/migrations/` — ordered SQL migration files
- `database/schema/` — canonical schema (single file or partitioned)
- `database/seeds/` — base seed scripts (no fake production data)
- `database/views/` — read-only views that simplify queries
- `database/functions/` — stored procedures / RPC functions

## Supabase-Specific

- Row Level Security (RLS) is **mandatory** for all user-facing tables.
- Service role key is **never** exposed to the browser.
- Storage buckets are defined alongside schema in `database/schema/`.

---

_See also: `architecture.md`, `../rules/database_rules.md`, `../prompts/Sprint_01_Database.md`._
