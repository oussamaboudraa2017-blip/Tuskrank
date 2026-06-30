# Database

## Database Strategy

Tuskrank uses PostgreSQL 16 hosted on Supabase as its sole data store. The database is designed for read-heavy workloads with periodic bulk writes during data ingestion.

## Core Tables (Planned)

### Products
- `products` — Master product table (name, brand, category, slug, metadata).
- `product_ingredients` — Join table linking products to ingredients with quantity/context.
- `product_nutrition` — Guaranteed analysis data (protein, fat, fiber, moisture, etc.).
- `product_variants` — Size/weight variants with pricing.

### Ingredients
- `ingredients` — Ingredient master data (name, category, description, safety tier).
- `ingredient_synonyms` — Alternative names and spelling variants for search.

### Scoring
- `product_scores` — Computed quality scores (overall, nutrition, ingredient quality, safety).
- `scoring_criteria` — Definition of scoring weights and thresholds.

### AI Analysis
- `product_analyses` — Cached AI-generated analysis text per product.
- `ingredient_analyses` — Cached AI-generated explanation text per ingredient.

### Metadata
- `brands` — Brand master data.
- `categories` — Product categories and hierarchy.
- ` recalls` — Product recall history.

## Database Principles

1. **Schema-first**: All schema changes go through versioned migration files.
2. **Read-optimized**: Denormalized where justified for query performance.
3. **Computed in DB**: Scoring logic lives in PostgreSQL functions, not application code.
4. **Soft deletes**: No hard deletes on core entities; use `deleted_at` columns.
5. **Slugs for SEO**: Every public-facing entity has a unique slug.
6. **Timestamps**: All tables include `created_at` and `updated_at`.

## Migration Strategy

- Migrations are stored in `database/migrations/` with timestamp prefixes.
- Applied via Supabase CLI or a custom migration runner.
- Never edit existing migrations — only add new ones.
- Each migration must be reversible (provide `up` and `down`).

## Views & Functions

- Complex read queries are encapsulated in `database/views/`.
- Scoring and ranking logic is implemented in `database/functions/` as PostgreSQL functions.
- This keeps computation close to the data and avoids round-trips.

## Seeding

- Development seed data lives in `database/seeds/`.
- Seeds are for local development only — never run against production.
- Production data is loaded through the admin API or ingestion pipelines.
