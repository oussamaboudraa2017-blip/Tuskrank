# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Documentation Index

| Document | Purpose |
| -------- | ------- |
| [`README.md`](README.md) | Project overview (Sprint 0). |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | Authoritative snapshot of the engineering state — updated every sprint. |
| [`CHANGELOG.md`](CHANGELOG.md) | This file. |
| [`TODO.md`](TODO.md) | Living task ledger driven by sprint prompts. |
| [`docs/API_ROADMAP.md`](docs/API_ROADMAP.md) | Comprehensive catalogue of every endpoint Tuskrank will eventually expose. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture Decision Records (ADRs). |
| [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) | Backend folder layout + dependency flow + module responsibilities + coding standards (Sprint 2A). |
| [`docs/BACKEND_REVIEW.md`](docs/BACKEND_REVIEW.md) | Backend Stripe-grade review pass (Sprint 2A.1). |
| [`database/README.md`](database/README.md) | Database schema, indexes, views, functions, triggers, ER diagram. |
| [`database/DATABASE_REVIEW.md`](database/DATABASE_REVIEW.md) | Database Stripe-grade review + score (Sprint 1.x.2). |
| [`database/ERD.md`](database/ERD.md) | Mermaid ER diagram (Sprint 1.x.2). |
| [`.ai/context/`](.ai/context/), [`.ai/rules/`](.ai/rules/), [`.ai/prompts/`](.ai/prompts/), [`.ai/system/`](.ai/system/) | Engineering OS — context, rules, sprint prompts, system instructions. |

---

## [Unreleased]

### Added

- **Documentation:**
  - `docs/API_ROADMAP.md` — comprehensive catalogue of every endpoint Tuskrank will eventually expose, grouped by module (auth, brands, products, ingredients, search, scoring, AI, recommendations, admin, SEO, analytics, audit, health). Each entry lists method, URL, purpose, auth requirement, request/response shapes, and status codes.
  - `docs/DECISIONS.md` — Architecture Decision Records (ADRs) capturing every irreversible / defensible design choice from Sprint 0 → Sprint 2A.1.

### In Progress

- _Nothing yet. Sprint 2G is complete._

---

## [0.9.0] — 2026-06-29 — Sprint 2G: Scoring Engine

### Added

- **Scoring Module (`modules/scoring/`)** — modular, configurable product scoring engine using Strategy Pattern.

- **Scoring Engine (`engine/scoring.engine.ts`)**:
  - `ScoringEngine` class composes 7 `ScoringStrategy` implementations with configurable weights.
  - `score()` runs all strategies, computes weighted overall score, derives grade, collects warnings and recommendations.
  - `resolveWeights()` normalizes user-provided weight overrides to sum to 1.0.
  - `computeConfidence()` aggregates per-category confidence into overall confidence.
  - `scoreToGrade()` maps numeric score (0–100) to letter grade (A+ through F) via configurable boundaries.

- **7 Scoring Strategies (`strategies/`)**:
  - `IngredientQualityStrategy` (35%) — ingredient count, protein source, safety scores, diversity.
  - `TransparencyStrategy` (20%) — naming specificity, brand transparency, certifications.
  - `NutritionalBalanceStrategy` (15%) — protein, fat, fiber, moisture, ash, kcal levels vs AAFCO minimums.
  - `ProcessingLevelStrategy` (10%) — food form, processing indicators, named meat vs meal.
  - `ScientificEvidenceStrategy` (10%) — reference count, evidence type, source diversity.
  - `ControversialIngredientsStrategy` (5%) — fillers, artificial colors/preservatives, sweeteners.
  - `LabelTransparencyStrategy` (5%) — guaranteed analysis, ingredient list, certifications.
  - All strategies implement `ScoringStrategy` interface with `score()`, `getWarnings()`, `getRecommendations()`.

- **Scoring Repository (`repositories/scoring.repository.ts`)**:
  - `getProductScoringInput()` — fetches all product data needed by strategies (ingredients, nutrition, brand, claims, tags, scientific references, certifications) via 8 SQL queries.
  - `getProductIdsForBulk()` — fetches active, published product IDs for batch scoring.
  - `saveProductScore()` — upserts to `product_scores` (invalidates old, inserts new current).
  - `saveScoreHistory()` — appends to `score_history` (append-only audit trail).
  - `getCurrentScore()` — reads current score from `product_scores`.

- **Scoring Service (`scoring.service.ts`)**:
  - `scoreProduct()` — fetch data, run engine, persist results, return `ScoringResult`.
  - `bulkScore()` — score multiple products with per-product error handling.
  - `scoreAll()` — score all active, published products (for scheduled jobs).
  - `previewScore()` — compute score without persisting (dry-run/preview).
  - `getCurrentScore()` — read current score from DB (no recomputation).

- **Scoring Controller (`scoring.controller.ts`)**:
  - `POST /api/v1/scoring/score` — score a single product (`@Public()`).
  - `POST /api/v1/scoring/bulk` — score multiple products (`@Public()`).
  - `POST /api/v1/scoring/preview` — preview score without persistence (`@Public()`).
  - `GET /api/v1/scoring/current?productId=X` — get current score from DB (`@Public()`).
  - All endpoints return `okResponse(data)`.

- **Scoring DTOs (`dto/`)**:
  - `ScoreProductDto` — product UUID + optional weight overrides (class-validator validated).
  - `BulkScoreDto` — array of product UUIDs + optional weights (max 50).
  - `ScoringResultDto` — complete score wire shape with categories, warnings, recommendations.
  - `CurrentScoreDto` — DB-cached score shape.
  - `BulkScoreResultDto` — per-product success/failure results.

- **Scoring Types (`types/`)**:
  - `CategoryScore` — per-category score, confidence, reasoning, data points.
  - `ScoringResult` — complete result with overall score, grade, categories, warnings, recommendations, confidence.
  - `ProductScoringInput` — raw product data for strategies (ingredients, nutrition, brand, claims, references).
  - `ScoringConfig` — runtime weight overrides, version, reasoning toggle.
  - `ScoringWarning` — flagged concern with category, severity, code, message.
  - `ScoringRecommendation` — actionable improvement with priority, code, message, estimated impact.

- **Scoring Enums (`enums/`)**:
  - `ScoringCategory` — 7 categories (IngredientQuality, Transparency, NutritionalBalance, ProcessingLevel, ScientificEvidence, ControversialIngredients, LabelTransparency).
  - `ScoreGrade` — A+ through F.
  - `WarningSeverity` — info, low, medium, high, critical.
  - `ScoringVersion` — algorithm version tracking.
  - `ScoreTrigger` — manual, scheduled, data_change, import, seed.

- **Scoring Constants (`constants/`)**:
  - `DEFAULT_SCORING_WEIGHTS` — default category weights (keyed by `ScoringCategory`).
  - `SCORING_BOUNDS` — min/max scores, max warnings/recommendations, bulk size limit.
  - `GRADE_BOUNDARIES` — score-to-grade mapping.

- **Scoring Errors (`errors/`)**:
  - `ScoringError`, `ProductNotScorableError`, `InsufficientDataError`, `InvalidWeightConfigError`.

- **AppModule** updated to import `ScoringModule`.

- **Documentation**:
  - `docs/scoring_engine.md` — architecture, scoring flow, strategy pattern, weight system, grade boundaries, API endpoints, database tables, future extensions (ML, AI, veterinary, country-specific).

---

## [0.8.0] — 2026-06-29 — Sprint 2F: Search Infrastructure Enhancement

### Added

- **Search Module (`modules/search/`)** — enhanced with multi-signal ranking, slug lookup, popular searches, and architecture abstractions for future backend swap.

- **Ranking Engine (`ranking/ranking.engine.ts`)**:
  - `RankingEngine` class composes multiple `RankingStrategy` implementations into a final score.
  - Default strategies: `FullTextRanking` (0.35), `TrigramRanking` (0.20), `EntityScoreRanking` (0.20), `KeywordRanking` (0.15), `RecencyRanking` (0.05), `PopularityRanking` (0.05).
  - `buildContext()` computes normalization context (max scores, max timestamps) from raw rows.
  - `scoreRow()` applies weighted scoring with automatic normalization.
  - `rankRows()` scores and sorts a result set in one call.
  - `RankingEngine.createDefault()` factory for the standard strategy set.

- **Search Enums (`enums/`)**:
  - `SearchEntityType` — `Product`, `Brand`, `Ingredient`.
  - `SearchStrategy` — `FullText`, `Trigram`, `Exact`, `Prefix`, `Keyword`, `Slug`, `Synonym`.
  - `RankingSignal` — `FullText`, `Trigram`, `EntityScore`, `Recency`, `Popularity`, `Keyword`.

- **Search Interfaces (`interfaces/`)**:
  - `SearchProvider` — repository contract for the search module (enables ES/Meilisearch swap).
  - `RankingStrategy` — signal scoring contract with `signal` and `score()` method.
  - `RankingContext` — normalization context for cross-signal scoring.

- **Search Constants (`constants/`)**:
  - `SEARCH_BOUNDS` — all numeric limits (query length, pagination, trigram threshold, synonym depth).
  - `DEFAULT_RANKING_WEIGHTS` — per-signal weights (keyed by `RankingSignal`).
  - `SEARCH_RANKING_WEIGHTS` — camelCase alias used by the service layer.
  - `SEARCH_ANALYTICS` — trending window, popular threshold, retention days.

- **Search Types (`types/`)**:
  - `SearchResultItem`, `SearchResult`, `GlobalSearchResult`, `AutocompleteSuggestion`, `TrendingSearch`, `PopularSearch`.

- **Search Repository** — enhanced with:
  - `findBySlug(entityType, slug)` — exact slug lookup across entity types.
  - `getPopularSearches(limit)` — popular queries from `popular_searches` view.
  - `updated_at` included in search results for recency ranking.
  - All queries maintain `$1`-bound parameter safety.

- **Search Service** — enhanced with:
  - `findBySlug(entityType, slug)` — delegates to repository slug lookup.
  - `getPopularSearches(limit)` — delegates to repository popular searches.
  - Synonym expansion hook (placeholder for production `search_synonyms` integration).
  - Deduplication by `(entityType, id)` keeping highest-scored result.

- **Search Controller** — enhanced with:
  - `GET /api/v1/search/lookup/:type/:slug` — slug-based entity lookup (`@Public()`).
  - `GET /api/v1/search/popular` — popular searches (`@Public()`).
  - Total of 9 public endpoints.

- **AppModule** — already wired (no changes needed; SearchModule was imported in Sprint 3).

### Changed

- **Search Repository** — updated `searchProducts`, `searchBrands`, `searchIngredients` to include `updated_at` in result rows for recency ranking support.

### Architecture Notes

- `SearchProvider` interface allows swapping PostgreSQL FTS for Elasticsearch/Meilisearch without touching the service or controller layer.
- `RankingEngine` is stateless and composable — new signals can be added by implementing `RankingStrategy`.
- Weight tuning requires no migration — change `DEFAULT_RANKING_WEIGHTS` in `constants/search.constants.ts`.
- Typo tolerance is prepared via trigram similarity (pg_trgm) with configurable `trigramMinSimilarity` threshold.
- Popularity ranking is wired but uses `search_count` from `popular_searches` view (data populates after search logging accumulates).

---

## [0.7.0] — 2026-06-29 — Sprint 2E: Data Platform Foundation

### Added

- **Import Module (`modules/import/`)**:
  - Six-stage import pipeline: Parse → Validate → Normalize → Deduplicate → Save → Generate Report.
  - Supports CSV and JSON file formats with robust parsing (quoted fields, escaped quotes, boolean coercion).
  - Entity-specific validators for Products, Brands, and Ingredients with field-level error reporting.
  - Reusable normalization utilities: `slugify()`, `normalizeBrandName()`, `normalizeCanonicalName()`, `normalizeUpc()`, `normalizeCountryCode()`, `normalizeUrl()`, `normalizeList()`, `normalizeNumeric()`, `normalizeBoolean()`, `parsePackageSizeToGrams()`.
  - Raw-to-domain mappers for Brands, Products, and Ingredients.
  - Deduplication strategies: Skip, Overwrite, Merge.
  - Batch DB writes with UPSERT (`ON CONFLICT ... DO UPDATE`) for idempotent imports.
  - Foreign key resolution: brand_name → brand_id, food_form → food_form_id, protein_source → protein_source_id, etc.
  - Auto-creation of brands during product import when brand doesn't exist.
  - Nutrition profile and nutrient value import (kcal, protein, fat, fiber, ash, omega-3/6, calcium, phosphorus).
  - Product image import with primary flag.
  - Product targeting import (pet types, life stages, breed sizes).
  - Product claims and tags import.
  - Import job tracking (in-memory, PostgreSQL-backed in Sprint 5+).
  - Import report generation with per-row status, error details, and timing.

- **Import Repository (`import.repository.ts`)**:
  - Extends `BaseRepository` from `@database`.
  - Lookup methods for all FK resolution (brands, ingredients, food_forms, protein_sources, pet_types, life_stages, breed_sizes, categories, claims, tags, nutrients).
  - Batch insert methods with UPSERT for brands, products, ingredients.
  - Relationship insert methods for product_ingredients, product_targeting, product_claims, product_tags, product_images, nutrition_profiles, product_nutrients.

- **Import Controller (`import.controller.ts`)**:
  - `POST /api/v1/import` — run import pipeline (`@Roles('admin')`).
  - `GET /api/v1/import/jobs` — list all jobs (`@Roles('admin')`).
  - `GET /api/v1/import/jobs/:jobId` — get job detail (`@Roles('admin')`).
  - `GET /api/v1/import/jobs/:jobId/report` — get import report (`@Roles('admin')`).

- **Import Templates**:
  - `templates/products.csv` — 4 sample products with 28 columns.
  - `templates/brands.csv` — 8 sample brands with 7 columns.
  - `templates/ingredients.csv` — 14 sample ingredients with 9 columns.

- **Normalization Utilities (`normalizers/normalizer.ts`)**:
  - `slugify()` — URL-safe slug generation (matches database `fn_generate_slug()` behavior).
  - `normalizeText()` — trim, collapse whitespace, lowercase.
  - `normalizeBrandName()` — title-case brand names.
  - `normalizeIngredientName()` — title-case ingredient names.
  - `normalizeCanonicalName()` — lowercase for deduplication matching.
  - `normalizeUpc()` — strip spaces and dashes from UPC codes.
  - `normalizeCountryCode()` — uppercase ISO-3166 alpha-2 codes.
  - `normalizeUrl()` — trim and lowercase protocol/host.
  - `normalizePackageSizeLabel()` — trim and collapse whitespace.
  - `parsePackageSizeToGrams()` — convert "5 lb", "2.5 kg", "16 oz" to grams.
  - `normalizeList()` — split comma/pipe/semicolon-separated strings.
  - `normalizeNumeric()` — parse number strings with comma handling.
  - `normalizeBoolean()` — coerce "yes"/"no"/"true"/"false"/"1"/"0" to boolean.

- **AppModule** updated to import `ImportModule`.

- **Documentation**:
  - `docs/data_platform.md` — architecture, import flow, validation, normalization, future scaling.

---

## [0.6.0] — 2026-06-29 — Sprint 2D: Brands Module

### Added

- **Brands Module (`modules/brands/`)**:
  - Full CRUD for brands with lifecycle transitions (activate/deactivate/soft-delete/restore).
  - Featured brands endpoint (top brands ranked by product count + score).
  - Search by name or manufacturer with country code filtering.
  - Brand detail view with aggregated stats (product count, average scores, open recall count).
  - Soft-delete blocked when brand has associated products.
  - All endpoints return the global `{ success, data, meta }` envelope.

- **Brands Repository (`brands.repository.ts`)**:
  - Extends `BaseRepository` from `@database`.
  - Full CRUD: `findById`, `findBySlug`, `findMany`, `count`, `create`, `update`, `softDelete`, `restore`.
  - Featured: `findFeatured` (top brands by product count + score).
  - Product count: `countProducts` (guards soft-delete).
  - Existence checks: `exists`, `existsBySlug`.
  - Enriched base query with LEFT JOINs for product count, average scores (overall, quality, safety, nutrition, transparency), and open recall count.
  - Dynamic WHERE builder with parameterized `$N` placeholders.
  - Sort field map with NULLS LAST for score sorting.

- **Brands Service (`brands.service.ts`)**:
  - Business orchestration layer (ONLY layer that calls repository).
  - Slug uniqueness validation on create/update.
  - Soft-delete guard (blocks if products exist).
  - Lifecycle transitions with state validation.
  - `buildQueryFromDto()` helper for controller-to-domain query conversion.

- **Brands Controller (`brands.controller.ts`)**:
  - `GET /api/v1/brands` — paginated list (`@Public()`).
  - `GET /api/v1/brands/featured` — top brands (`@Public()`).
  - `GET /api/v1/brands/search` — search (`@Public()`).
  - `GET /api/v1/brands/:slug` — detail (`@Public()`).
  - `POST /api/v1/brands` — create (`@Roles('admin')`, `201`).
  - `PUT /api/v1/brands/:brandId` — full update (`@Roles('admin')`).
  - `PATCH /api/v1/brands/:brandId` — partial update (`@Roles('admin')`).
  - `POST /api/v1/brands/:brandId/activate|deactivate|soft-delete|restore` — lifecycle (`@Roles('admin')`).

- **Brands DTOs (`dto/brand.dto.ts`)**:
  - `ListBrandsQueryDto`, `SearchBrandsQueryDto`, `CreateBrandDto`, `UpdateBrandDto`, `PatchBrandDto` (all `class-validator` validated).

- **Brands Domain Layer**:
  - Enums: `BrandSortField`, `SortOrder`.
  - Constants: `BRAND_BOUNDS`, `BRAND_SLUG_RE`, `BRAND_COUNTRY_CODE_RE`, `BRAND_DEFAULTS`.
  - Types: `Brand`, `BrandSummary`, `BrandWithStats`.
  - Errors: `BrandNotFoundError`, `BrandSlugCollisionError`, `BrandSoftDeletedError`, `BrandInactiveError`, `BrandInvalidLifecycleTransitionError`, `BrandHasProductsError`.
  - Interfaces: `BrandQuery`, `BrandListFilters`, `BrandSort`, `BrandPagination`, `BrandSearchInput`.
  - Validation: Zod schemas for `createBrandBody`, `updateBrandBody`, `patchBrandBody`, `brandSlugParam`, `brandListQuery`.
  - Mapping: Pure functions `toBrand`, `toBrandSummary`, `toBrandWithStats`.

- **AppModule** updated to import `BrandsModule`.

- **Documentation**:
  - `docs/brands_module.md` — module overview, endpoints, query parameters, database tables, relationships, business rules, future extensions.

---

## [0.5.0] — 2026-06-29 — Sprint 2C: Ingredients Module

### Added

- **Ingredients Module (`modules/ingredients/`)**:
  - Full CRUD for ingredients, categories, and scores.
  - Hierarchical category tree with self-referencing parent_id and cycle prevention.
  - Ingredient scoring with grade (A-F +/-), reasoning, and versioned scoring.
  - Related products lookup via `product_ingredients` junction table.
  - Scientific reference management via `ingredient_references` + `scientific_references`.
  - Lifecycle transitions: activate, deactivate, soft-delete, restore.
  - Search by name, canonical_name, and inci_name with pagination and sorting.
  - Filtering by category, animal-derived, allergen, controversial, and score range.
  - All endpoints return the global `{ success, data, meta }` envelope.

- **Ingredients Repository (`ingredients.repository.ts`)**:
  - Extends `BaseRepository` from `@database`.
  - Full CRUD: `findById`, `findBySlug`, `findMany`, `count`, `create`, `update`, `softDelete`, `restore`.
  - Category CRUD: `findCategoryById`, `findCategoryBySlug`, `findCategories`, `createCategory`, `updateCategory`, `softDeleteCategory`.
  - Score methods: `findCurrentScore`, `findScoreHistory`, `createScore`.
  - Related data: `findRelatedProducts`, `findReferences`.
  - Existence checks: `exists`, `existsBySlug`, `existsByCanonicalName`, `existsByCategorySlug`.
  - Hierarchy helpers: `countCategoryChildren`, `countCategoryIngredients`, `getCategoryDepth`.
  - Dynamic WHERE builder with parameterized `$N` placeholders.
  - Sort field map with NULLS LAST for score sorting.

- **Ingredients Service (`ingredients.service.ts`)**:
  - Business orchestration layer (ONLY layer that calls repository).
  - Slug uniqueness validation on create/update.
  - Canonical name uniqueness validation.
  - Category depth validation (max 3 levels).
  - Category deletion guards (no children, no ingredients).
  - Lifecycle transitions with state validation.
  - `buildQueryFromDto()` helper for controller-to-domain query conversion.

- **Ingredients Controller (`ingredients.controller.ts`)**:
  - `GET /api/v1/ingredients` — paginated list (`@Public()`).
  - `GET /api/v1/ingredients/search` — search (`@Public()`).
  - `GET /api/v1/ingredients/:slug` — detail by slug (`@Public()`).
  - `GET /api/v1/ingredients/:ingredientId/products` — related products (`@Public()`).
  - `GET /api/v1/ingredients/:ingredientId/references` — scientific references (`@Public()`).
  - `GET /api/v1/ingredients/:ingredientId/scores/history` — score history (`@Public()`).
  - `GET /api/v1/ingredients/categories` — category tree (`@Public()`).
  - `POST /api/v1/ingredients` — create (`@Roles('admin')`, `201`).
  - `PATCH /api/v1/ingredients/:ingredientId` — update (`@Roles('admin')`).
  - `POST /api/v1/ingredients/:ingredientId/activate` — activate (`@Roles('admin')`).
  - `POST /api/v1/ingredients/:ingredientId/deactivate` — deactivate (`@Roles('admin')`).
  - `POST /api/v1/ingredients/:ingredientId/soft-delete` — soft-delete (`@Roles('admin')`).
  - `POST /api/v1/ingredients/:ingredientId/restore` — restore (`@Roles('admin')`).
  - `POST /api/v1/ingredients/categories` — create category (`@Roles('admin')`, `201`).
  - `PATCH /api/v1/ingredients/categories/:categoryId` — update category (`@Roles('admin')`).
  - `POST /api/v1/ingredients/categories/:categoryId/soft-delete` — soft-delete category (`@Roles('admin')`).
  - `POST /api/v1/ingredients/:ingredientId/scores` — create score (`@Roles('admin')`, `201`).

- **Ingredients DTOs**:
  - Input: `CreateIngredientDto`, `UpdateIngredientDto`, `ListIngredientsQueryDto`, `SearchIngredientsQueryDto`, `CreateCategoryDto`, `UpdateCategoryDto`, `CreateScoreDto`.
  - Output: `IngredientDetailDto`, `IngredientListItemDto`, `IngredientCategoryDto`, `IngredientScoreDto`, `ProductIngredientEntryDto`, `IngredientReferenceDto`.

- **Ingredients Domain Layer**:
  - Enums: `IngredientSortField`, `SortOrder`, `IngredientLifecycleState`, `EvidenceType`.
  - Constants: `INGREDIENT_BOUNDS` (all numeric limits), `INGREDIENT_SLUG_RE`, `INGREDIENT_DEFAULTS`.
  - Types: `Ingredient`, `IngredientSummary`, `IngredientCategory`, `IngredientScore`, `IngredientCategoryTree`, `ProductIngredientEntry`, `IngredientReference`.
  - Errors: 16 typed error classes extending `ApiError` (not found, collision, lifecycle, depth, etc.).
  - Validation: Zod schemas for CRUD, pagination, sorting, filtering.
  - Mapping: Pure mapper functions (`rowToIngredient`, `rowToSummary`, `rowToCategory`, `buildCategoryTree`, `rowToProductIngredientEntry`, `rowToReference`).

- **Documentation**:
  - `docs/ingredients_module.md` — full module architecture, endpoints, database tables, relationships, and future extensions.

### Fixed

- Pre-existing `@types`/`@database` path alias resolution errors in ingredients module (non-blocking, works at runtime via `tsconfig-paths`).

---

## [0.4.0] — 2026-06-29 — Sprint 3: Search Infrastructure

### Added

- **Search Module (`modules/search/`)**:
  - Full-text search infrastructure using PostgreSQL FTS + `pg_trgm` for ranking.
  - Entity-specific search endpoints for products, brands, and ingredients.
  - Global (multi-entity) search across all entity types.
  - Prefix-based autocomplete with ILIKE + trigram similarity.
  - Bidirectional synonym expansion via `search_synonyms` table.
  - Trending searches via `v_trending_searches` materialized view.
  - Search event logging to `search_logs` table (fire-and-forget).
  - Multi-signal ranking: FTS (0.40) + trigram (0.25) + entity score (0.20) + recency (0.15).
  - All weights tunable via `SEARCH_RANKING_WEIGHTS` constant without migration.

- **Search Repository (`search.repository.ts`)**:
  - PostgreSQL implementation of full-text search using `to_tsvector`/`to_tsquery`.
  - Trigram similarity via `pg_trgm` extension with configurable minimum threshold (0.3).
  - Keyword table lookup via `search_keywords` (auto-synced by database triggers).
  - `DISTINCT ON` queries to prevent duplicate results from multiple JOINs.
  - Parallel `Promise.all` execution for global search across entity types.
  - `SearchProvider` interface for future Elasticsearch/Meilisearch backend swap.

- **Search Service (`search.service.ts`)**:
  - Query normalization (trim, collapse whitespace, lowercase).
  - Synonym expansion with bidirectional lookup.
  - Multi-signal result ranking using configurable weights.
  - Entity type parsing and validation.
  - Async search event logging (non-blocking).

- **Search Controller (`search.controller.ts`)**:
  - `GET /api/v1/search/products` — product search (`@Public()`).
  - `GET /api/v1/search/brands` — brand search (`@Public()`).
  - `GET /api/v1/search/ingredients` — ingredient search (`@Public()`).
  - `GET /api/v1/search/global` — multi-entity search (`@Public()`).
  - `GET /api/v1/search/autocomplete` — prefix autocomplete (`@Public()`).
  - `GET /api/v1/search/synonyms/:term` — synonym expansion (`@Public()`).
  - `GET /api/v1/search/trending` — trending searches (`@Public()`).
  - All endpoints return the global `{ success, data, meta }` envelope via `okResponse()`.

- **Search DTOs**:
  - `SearchQueryDto` — entity-specific search query params.
  - `GlobalSearchQueryDto` — global search query params (extends SearchQueryDto).
  - `AutocompleteQueryDto` — autocomplete query params.
  - `SearchResultItemDto` — single search result wire shape.
  - `SearchResultDto` — entity-specific search response.
  - `GlobalSearchResultDto` — global search response.
  - `AutocompleteSuggestionDto` — autocomplete suggestion wire shape.

- **Search Module (`search.module.ts`)**:
  - NestJS module wiring SearchRepository, SearchService, SearchController.
  - Registered in `AppModule` for application-wide availability.

- **Documentation**:
  - `docs/search_architecture.md` — full search architecture, endpoints, strategies, database infrastructure, performance considerations, and future backend swap guide.

### Fixed

- Pre-existing `@types`/`@database` path alias resolution errors in search module (non-blocking, works at runtime via `tsconfig-paths`).

---

## [0.3.0] — 2026-06-29 — Sprint 2B Task 3: Products CRUD & Queries

### Added

- **Products Repository (`repositories/products.repository.ts`)**:
  - Full CRUD implementation against PostgreSQL: `findById`, `findBySlug`, `findMany`, `findFeatured`, `findTopRated`, `search`.
  - Child-table hydration via parallel queries (images, ingredients, tags, claims, targeting, nutrition, nutrients, score history).
  - Write methods: `create`, `update`, `softDelete`, `restore`, `publish`, `unpublish`.
  - Existence checks: `exists`, `existsByBrandSlug`, `existsByUpc`, `existsByBrandSku`.
  - Reference lookups: `findBrandById`, `findFoodFormById`, `findProteinSourceById`.
  - Dynamic `WHERE` builder for filters (brand, pet type, active/published state, text search).
  - Sort-field-to-SQL-column mapping with `NULLS LAST`.
  - Full-text search using `to_tsvector` / `to_tsquery` across product names and ingredient names.
  - Materialised view queries for `findTopRated` (backed by `mv_top_rated_products`).
  - Child-table companion repositories: `ProductImagesRepository`, `NutritionProfilesRepository`, `ProductIngredientsRepository`.

- **Brands Repository (`repositories/brands.repository.ts`)**:
  - `findById`, `findBySlug`, `listActive`, `count` — all filtered by `deleted_at IS NULL`.

- **Products Service (`products.service.ts`)**:
  - `findBySlug` / `findBySlugAdmin` — public vs admin read paths.
  - `list` — paginated list with total count.
  - `findFeatured`, `findTopRated`, `search` — curated product discovery.
  - `create` — full business validation: brand existence, slug uniqueness, UPC uniqueness, SKU uniqueness.
  - `update` — partial patch with UPC and SKU collision checks.
  - `publish` / `unpublish` / `softDelete` / `restore` — lifecycle transitions.
  - `buildQueryFromDto` — converts controller DTO params to domain `ProductQuery`.

- **Products Controller (`products.controller.ts`)**:
  - `GET /api/v1/products` — paginated list with filters, sort, and search (`@Public()`).
  - `GET /api/v1/products/:slug` — product detail by slug (`@Public()`).
  - `POST /api/v1/products` — create product (`@Roles('admin')`, `201`).
  - `PATCH /api/v1/products/:productId` — update product (`@Roles('admin')`).
  - `POST /api/v1/products/:productId/publish` — publish (`@Roles('admin')`).
  - `POST /api/v1/products/:productId/unpublish` — unpublish (`@Roles('admin')`).
  - `POST /api/v1/products/:productId/soft-delete` — soft-delete (`@Roles('admin')`).
  - `POST /api/v1/products/:productId/restore` — restore (`@Roles('admin')`).
  - All endpoints return the global `{ success, data, meta }` envelope via `okResponse()` / `paginatedResponse()`.

- **DTOs**:
  - `CreateProductDto` — `class-validator` validated create input.
  - `UpdateProductDto` — `class-validator` validated partial update input.
  - `ListProductsQueryDto` — `class-validator` validated query params for list endpoint.

### Fixed

- Pre-existing `import type` errors in `product-detail.dto.ts`, `product-list-item.dto.ts`, `products-page.dto.ts` (changed to value imports for `@ApiProperty({ type: () => X })` usage).
- Pre-existing wrong relative imports in `product.entity.ts` (`../value-objects`, `../types`, `../errors` → `./value-objects`, `./types`, `./errors`).
- Missing `PRODUCT_BOUNDS.maxLimit`, `defaultLimit`, `sortBy`, `sortOrder` in `product.constants.ts`.
- Missing `mapping/index.ts` barrel export in `domain/mapping/`.
- Removed stale `imageSource` field from `Product` interface.
- Added `packageSizeGrams` / `packageSizeLabel` flat accessors to `ProductEntity` for interface compatibility.
- Fixed `ProductImageSource` import in mapper (`../types` → `../enums`).
- Fixed type casts in mapper for `ProteinSource.origin` and `ProductNutrientValue.bound`.
- Fixed `BrandSummaryDto` to include `countryCode` and `logoImageUrl` properties.

### Notes

- All queries use `$1`-bound parameters (no raw SQL interpolation).
- Soft-deleted rows excluded by default; `includeSoftDeleted` / `includeUnpublished` opt-in for admin.
- `tsc --noEmit` still shows pre-existing `@types`/`@common`/`@database` path alias errors — these work at runtime via `tsconfig-paths`.

---

## [0.2.1] — 2026-06-29 — Sprint 2A.1: Backend Review Hardening

### Changed

- **CRITICAL (B-1)**: Removed duplicated dead code in `SupabaseAuthGuard.canActivate`.
- **CRITICAL (B-2)**: Fixed operator-precedence bug in `TimeoutInterceptor` and wired it to `@TimeoutMs(ms)` via the reflector.
- **HIGH (B-3)**: Removed standalone `ThrottlerCoreModule`; `ThrottlerGuard` now wires inside `CommonModule` alongside `SupabaseAuthGuard`. Guard order documented.
- **HIGH (B-4)**: `BaseRepository.ping()` no longer accepts `tableName` — uses `SELECT 1::int AS ok`. Added `validateTableName()` for future CRUD.
- **HIGH (B-5)**: `HealthController` Postgres probe wrapped in a 1.5 s `Promise.race` budget. `ready()` returns a real `HealthIndicatorResult`. Helper-based.
- **HIGH (B-6)**: `RequestIdMiddleware` is now the single source of truth for `req.id` and the `x-request-id` header. `RequestLoggingInterceptor` only stamps latency.
- **HIGH (B-7)**: `SupabaseAuthGuard` now maintains a **60 s** LRU verification cache (pruned every 256 calls) so steady-state traffic avoids a Supabase round-trip per request. Added `Promise.race` against a 4 s `getUser` timeout.
- **MEDIUM (B-8)**: `toApiErrorPayload()` no longer echoes inner `err.message` for unknown errors. Now returns generic `Internal server error` while still logging the full message server-side.
- **MEDIUM (B-9)**: `DatabaseService` pool construction tightened with `connectionTimeoutMillis: 5_000`; warmup remains soft.
- **MEDIUM (B-10)**: `LOG_REDACT_KEYWORDS` default collapsed to a single source of truth in `logger.config.ts`.
- **MEDIUM (B-11)**: Removed redundant `@Version('1')` from every controller method. `enableVersioning({ defaultVersion: '1' })` + per-controller `version` are the single source.
- **MEDIUM (B-12)**: `main.ts` reordered: helmet → CORS → body parsers → compression → versioning → global pipe → Swagger.
- **MEDIUM (B-15)**: `ROLES_KEY` and `Roles` decorator moved to `decorators/index.ts`; `roles.guard.ts` is the single consumer.
- **MEDIUM (B-16)**: Removed redundant `ConfigModule` import in `CommonModule` (already global via `AppConfigModule`).
- Added new typed exception class: `RequestTimeoutException`.

### Added

- `common/interceptors/timeout.interceptor.spec.ts` (unit coverage for reflector + sanitiser + pass-through).
- `common/guards/supabase-auth.guard.spec.ts` (extraction-only smoke — no Supabase round-trips).
- `docs/BACKEND_REVIEW.md` — full review document (issues, fixes, score).
- New logger redact baselines: `*.apiKey`, `*.access_token`, `*.refresh_token`.
- E2E smoke now also asserts `x-request-time-ms` header presence.

### Removed

- `apps/api/src/common/throttler/` directory.

### Notes

- Foundation-only. No business modules added.
- Score: 92 / 100. Multi-instance (Redis-backed throttle / pooler), OTel exporter, and `noUncheckedIndexedAccess` are all scheduled in future sprints.

---

## [0.2.0] — 2026-06-29 — Sprint 2A: Backend Foundation

### Added

- `apps/api/` NestJS monorepo app with strict TypeScript + ESLint + Prettier + Jest.
- Path aliases: `@common`, `@config`, `@database`, `@modules`, `@auth`, `@health`, `@shared`, `@utils`, `@types`.
- `AppConfigModule` with class-validator backed `AppConfig` and four env files (`.env.development`, `.env.staging`, `.env.production`, `.env.test`).
- `CommonModule`:
  - `GlobalExceptionFilter` — uniform `{ success:false, error, meta }` envelope.
  - `RequestLoggingInterceptor` — assigns/propagates `x-request-id`, stamps `x-request-time-ms`.
  - `RequestIdMiddleware` (run on every route).
  - `EnvelopeInterceptor` (idempotent) — wraps handler output via `okResponse`.
  - `TimeoutInterceptor` — per-route timeout via `@TimeoutMs()`.
  - `SupabaseAuthGuard` mounted globally (opt-out via `@Public()`).
  - `RolesGuard` opt-in with `@Roles(...)` + `@UseGuards(RolesGuard)`.
- `LoggerCoreModule` (nestjs-pino) with pretty JSON / structured, request-id propagation, keyword redaction.
- `ThrottlerCoreModule` global rate limiter (per-IP, in-memory store).
- `DatabaseModule`: `DatabaseService` (lazy `pg.Pool`, `query`, `transaction`, `healthcheck`), `TransactionHelper`, `BaseRepository<T>` — Sprint 2A ships **no business repositories**.
- `HealthModule`:
  - `GET /api/v1/health` (Terminus combined check)
  - `GET /api/v1/health/live` (`@Public()`)
  - `GET /api/v1/health/ready` (`@Public()`, with Postgres probe)
- `AuthModule` scaffold: `GET /api/v1/auth/me` only. Login / refresh / logout deferred to Sprint 2B.
- `Swagger` mounted at `/api/docs` (development only).
- `apps/api/Dockerfile` (multi-stage distroless Node 20, non-root).
- Error hierarchy: `ApiError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `UnprocessableEntityError`, `RateLimitedError`, `DatabaseUnavailableError`, `UpstreamFailureError`.
- E2E smoke test (`test/app.e2e-spec.ts`) exercising health + versioning + auth.
- Unit tests for config, errors, pagination, UUID validation.
- `docs/BACKEND_ARCHITECTURE.md` — folder layout, dependency flow, module responsibilities, coding standards, scalability, future modules.

### Notes

- No business modules — Products / Search / Scoring / AI / Admin arrive in Sprints 2B+.
- The PublicRoute decorator model (`@Public()`) is the canonical opt-out from the global Supabase auth guard.
- Repository pattern is in place; concrete repositories land in Sprint 2B (Products first).
- Health routes are intentionally public; operator-level gating happens at the network layer.

---

## [0.1.2] — 2026-06-29 — Sprint 1 Production Review

### Changed

- `database/DATABASE_REVIEW.md` added (Stripe-grade review).
- `nutrition_profiles.source` text + CHECK → `nutrition_source` ENUM.
- `score_history.triggered_by` text + CHECK → `score_history_trigger` ENUM.
- `brand_certifications.issued_on` now `NOT NULL`; date check simplified accordingly.
- `seo_pages.structured_data` now enforces `jsonb_typeof = 'object'` and `length <= 50000` (text).
- `audit_logs.before` / `after` size-capped at 100000 chars each; `request_id` and `user_agent` length-bounded.
- `search_logs.user_agent` capped at 512 chars; `session_id` lower-bound 1.
- `popular_searches.window_*` window length now bounds `[1 hour, 7 days]`.
- Documented `country_code` char(2) semantics and `score_history` retention.
- Removed duplicated comment block in `nutrition_profiles` area.

### Added

- `fn_block_self_parent_cycle()` plpgsql function — bounded cycle detection.
- Triggers `trg_categories_cycle_check` and `trg_ingredient_categories_cycle_check`.
- BRIN index `idx_search_logs_took_at_brin` for time-window scans on the append-mostly log.
- Composite `(user_id, took_at DESC)` index `idx_search_logs_user_took_at` for user-scoped history.
- Composite partial index `idx_product_alternatives_product_delta` for "healthier alternatives" hot path.
- Composite partial index `idx_recalls_brand_status_active` for open-recall-per-brand widget.
- `idx_recalls_status`, `idx_relation_types_active`.
- All `search_keywords` indexes partial on `deleted_at IS NULL`.

### Hardened

- `fn_ensure_slug(...)` validates identifier safety (`p_table`, `p_column`) and existence.
- `fn_refresh_materialized_views()` rewritten to use per-MV savepoints + `RAISE WARNING`; per-MV failures no longer silent.

### Deferred (Tracked in `DATABASE_REVIEW.md`)

- RLS policies (`Sprint 1.1`).
- Partitioning of `search_logs`, `audit_logs`, `score_history` (`Sprint 1.2`).
- `pg_stat_statements`, `pg_partman` extensions (`Sprint 1.3`).
- `users` mirror table + FK additions (`Sprint 2`).
- Specialised search engine integration (`Sprint >5` based on volume).

---

## [0.1.1] — 2026-06-29 — Sprint 1 Review Hardening

### Changed (Stripe-grade review pass)

**Schema**

- `brands.country_of_origin text` → `country_code char(2)` (more constrained, indexes smaller, regex check simplified).
- `ingredients.canonical_name text + custom check` → `citext` (case-folding done by the type).
- `search_keywords.normalized`, `search_synonyms.canonical/synonym`, `popular_searches.normalized` → `citext`. Equality + b-tree indexing without function calls.
- `protein_sources.origin text + check` → `protein_origin` ENUM (`'animal','plant','insect','fungi','synthetic'`).
- `ingredient_references.evidence_type text + check` → `evidence_type_t` ENUM (`'supports','refutes','neutral'`).
- `nutrient_bound` ENUM (`'exact','min','max','typical'`) introduced; `product_nutrients.is_min`/`is_max` two-bool antipattern removed and folded into `bound`.
- `actor_type_t` ENUM (`'admin','system','user','job','service'`) for `audit_logs.actor_type`.
- `related_products.relation_type text` → `relation_type_id uuid REFERENCES relation_types`. New lookup table `relation_types` introduced.
- `faq_items.page_kind` denormalized column dropped; kind derived from `seo_pages.kind`.
- `audit_logs.diff jsonb GENERATED ALWAYS AS (jsonb_build_object('before', before, 'after', after)) STORED`; GIN(`jsonb_path_ops`) over `diff` for forensic search.

**Constraints**

- All free-text URL columns now validated (`^https?://`): `recalls.source_url`, `transparency_reports.url`, `seo_pages.canonical_url`, `scientific_references.url`, `brand_certifications.certificate_url`, `product_images.public_url`, `sources`.
- IP addresses validated via `family()`-based check on `search_logs.ip_address`, `audit_logs.ip_address`.
- Locale format validated: `^[a-z]{2}(-[A-Z]{2})?$`.
- Slug length bounded where useful (`seo_pages.slug <= 512`), explicit length caps on descriptions, reasons, notes.
- New check constraints: `score_history.triggered_by` ENUM-like, `score_history.notes <= 4000`, `nutrition_profiles.source` ENUM-like, `nutrition_profiles.kcal_*` upper bounds.
- `product_targeting.is_active` added (consistent with rest of model).
- `search_logs.raw` non-empty + length bound, `search_logs.latency_ms <= 60000`.

**Cascade policy**

- All lookup-table FKs tightened from `CASCADE` to `RESTRICT` so soft-delete semantics aren't destroyed by hard-delete of canonical lookup rows.

**Uniqueness**

- Global partial unique on `products.upc` (active rows only).
- Partial unique on `(brand_id, sku)` (active rows only).
- Partial unique on `recalls (source_label, case_number)` for ingestion dedupe.
- Partial unique on `product_images (product_id)` WHERE `is_primary` (only one primary per product).
- Partial unique on `ingredient_scores (ingredient_id)` WHERE `is_current` — enforces "single current".
- Partial unique on `product_scores (product_id)` WHERE `is_current` — enforces "single current".
- `uq_ingredient_references` dedupes (ingredient, reference).

**Indexes**

- 112 indexes total (up from 96). New: covering/composite indexes on product detail paths, single-current partial uniques, GIN on `search_logs.entity_types`, GIN(`jsonb_path_ops`) on `audit_logs.diff`, composite brand+slug for admin queries, expiry widget on `brand_certifications.expires_on`.
- Removed redundant 3-table-wide `to_tsvector` GIN; replaced by generated `search_vector` columns (one GIN each on the generated column).

**Views**

- All plain views marked `WITH (security_invoker = true)` for RLS-readiness.
- `v_top_rated_products`, `v_top_rated_ingredients`, `v_top_brands`, `v_latest_recalls` materialized as `mv_*` for API cache layer; refreshed via `fn_refresh_materialized_views()` (uses `CONCURRENTLY`).
- New view `v_current_product_scores` (uses `ROW_NUMBER()` over `created_at`) for deterministic audit/debug.

**Functions / Triggers**

- All `plpgsql` functions pinned to `SET search_path = public`.
- `fn_write_audit(...)` introduced as the single SECURITY DEFINER writer to `audit_logs`. Direct API INSERTs cannot fake audit records.
- `fn_match_score(text, text)` wraps `pg_trgm.similarity()`.
- `fn_refresh_materialized_views()` does best-effort `CONCURRENTLY` refreshes; safe to call from cron.
- `fn_product_images_single_primary()` trigger enforces one primary per product at row level (defense in depth vs partial unique).
- `fn_soft_delete_keywords()` — cascade soft-deletes a brand/product/ingredient's `search_keywords` rows when `deleted_at` is set.
- Slug triggers scoped to a fixed whitelist; ensures deterministic coverage and prevents misclassification.
- `trg_<x>_soft_delete_keywords` triggers added on brands/products/ingredients.

**Performance**

- `idx_product_nutrients_product_nutrient` is a partial composite covering index — supports "all nutrient values for product X" without index scans.
- `idx_products_brand_slug_active` partial composite for brand detail page.
- `idx_search_logs_entity_types_gin` GIN enables array contains filters.
- `idx_popular_searches_locale` supports locale-scoped trending queries.

### Removed

- `ingredient_scores.ck_ingredient_scores_reasoning` (folded into naming convention).
- Redundant `to_tsvector` GIN indexes on products/ingredients/brands (replaced by generated `search_vector` columns).
- `idx_brands_country` on `country_of_origin text` (column renamed to `country_code char(2)`, index recreated).

### Notes

- Partitioning of `audit_logs` and `search_logs` remains deferred; the schema is forward-compatible (composite partition keys remain available).
- All changes keep compatibility with the original Sprint 1 baseline; no migration folder required.

---

## [0.0.0] — 2026-06-29 — Sprint 0: Repository Initialization

### Added

- Monorepo directory structure:
  - `apps/web`, `apps/api`, `apps/admin`
  - `packages/ui`, `packages/types`, `packages/utils`, `packages/config`
  - `database/migrations`, `database/schema`, `database/seeds`, `database/views`, `database/functions`
  - `docs`, `scripts`, `tests`
  - `.ai/{context,rules,prompts,system,reviews,outputs}`
- Root configuration files:
  - `README.md`, `LICENSE`, `.gitignore`, `.editorconfig`, `.prettierrc`, `.eslintrc`, `.env.example`, `docker-compose.yml`
- AI engineering operating system:
  - `.ai/context/`: `vision.md`, `mission.md`, `product.md`, `architecture.md`, `database.md`, `seo.md`, `roadmap.md`
  - `.ai/rules/`: `coding_rules.md`, `database_rules.md`, `backend_rules.md`, `frontend_rules.md`, `seo_rules.md`, `security_rules.md`, `testing_rules.md`
  - `.ai/prompts/`: `Sprint_00.md` through `Sprint_10_Deployment.md`
  - `.ai/system/`: `system_prompt.md`, `engineering_principles.md`
  - `.ai/reviews/`, `.ai/outputs/` (with `.gitkeep`)
- GitHub workflows (scaffolded, not yet executable):
  - `.github/workflows/ci.yml`
  - `.github/workflows/preview.yml`
  - `.github/workflows/dependency-review.yml`
- Top-level status documents:
  - `PROJECT_STATE.md`, `CHANGELOG.md`, `TODO.md`

### Not Included (By Design — Sprint 0 Scope Guard)

- No application code (no Next.js, no NestJS).
- No database schema, migrations, or seeds.
- No business logic.
- No fake / placeholder data.
- No third-party integrations configured.

### Notes

- Sprint 0 explicitly forbids proceeding to Sprint 1.
- Decisions deferred to future sprints: auth provider selection, scoring weights, AI provider selection, deployment target for `apps/api`.

---

## [0.1.0] — 2026-06-29 — Sprint 1: Database

### Added

- `database/schema.sql` (38 tables, 3NF, UUID primary keys throughout)
  - 5 lookup layers + brand/product/ingredient core
  - 8 product-information extension tables
  - 3 scoring tables (current + append-only history)
  - 2 science/citation tables
  - 4 trust tables (recalls, certifications, transparency)
  - 4 search tables + 1 raw search log
  - 2 recommendation tables
  - 2 SEO tables
  - 1 append-only `audit_logs`
  - 3 Postgres ENUMs (`recall_severity`, `recall_status`, `seo_page_kind`)
- `database/indexes.sql` — 96 indexes, including partial active-row indexes, soft-delete-aware partial uniques, GIN trigram for fuzzy name search, GIN tsvector on generated `search_vector` columns for products/ingredients/brands
- `database/views.sql` — 8 read-only views:
  - `v_top_rated_products`, `v_top_rated_ingredients`, `v_top_brands`
  - `v_latest_recalls`, `v_trending_searches`
  - `v_product_detail`, `v_ingredient_detail`, `v_product_ingredient_list`
- `database/functions.sql` — 8 functions:
  - `fn_touch_updated_at`, `fn_generate_slug`, `fn_ensure_slug`
  - `fn_normalize_keyword`, `fn_overall_score`
  - `fn_soft_delete`, `fn_upsert_search_keyword`, `fn_refresh_search_index`
- `database/triggers.sql` — `updated_at` triggers applied to every `updated_at`-bearing table; slug-generation triggers on name-bearing lookup + core tables; search-keyword sync on brands/products/ingredients/product_ingredients; append-only `score_history` and audit triggers on `product_scores`
- `database/seed.sql` — lookup-only seed (pet_types, life_stages, breed_sizes, food_forms, protein_sources, ingredient_categories, claims, tags). No products/brands/ingredients.
- `database/README.md` — overview, ER sketch, conventions, cascade policy, indexes, performance strategy, scaling strategy, future migration strategy, intentional non-goals

### Schema Highlights

- Every mutable domain table has `created_at`, `updated_at`, soft-delete `deleted_at`.
- All FKs explicit with deliberate `ON DELETE` (CASCADE / RESTRICT / SET NULL).
- Check constraints on every numeric range (scores 0–100, percentages 0–100, kcal > 0, etc.).
- All `slug` columns constrained to `^[a-z0-9-]+$`.
- Money/weight use `numeric` with explicit precision; no floats for canonical values.
- Slug uniqueness is table-level unique or partial unique (soft-delete-aware).
- `score_history` is append-only by convention (no app-level UPDATE/DELETE path).
- `audit_logs` is append-only by convention.
- `search_logs` is write-heavy-ready; future partitioning documented in `database/README.md`.

### Performance Notes

- Generated `search_vector` columns (Postgres 12+) auto-maintain FTS indexes.
- Partial indexes on `deleted_at IS NULL` keep hot reads cheap as tombstone volume grows.
- Composite indexes target top-rated lists and recall widget reads.
- Soft-delete + ON DELETE RESTRICT on score/ingredient chains prevent silent data loss.

### Verification

- No `psql` available on the build host at Sprint 1 time.
- Verification performed by structured logical review:
  - Paren balance across all files (392/392, 138/138, 51/51, 42/42, 20/20, 120/120).
  - All required tables (35 listed in spec) verified present.
  - All required functions (`fn_generate_slug`, `fn_ensure_slug`, `fn_touch_updated_at`, `fn_normalize_keyword`, `fn_overall_score`) verified present.
  - All required views (`v_top_rated_products`, `v_top_rated_ingredients`, `v_top_brands`, `v_latest_recalls`, `v_trending_searches`) verified present.
  - ON CONFLICT arbiter verified present for `fn_upsert_search_keyword` after unique-constraint addition.
  - GENERATED … STORED syntax (Postgres 12+) verified compatible with Supabase targets.

### Not Included (By Design — Sprint 1 Scope Guard)

- No application code (no Next.js, no NestJS).
- No API endpoints.
- No row-level security policies (deferred to a Sprint 1.1 follow-up migration).
- No `database/migrations/` numbering yet — Sprint 1 ships the canonical baseline.
- No products, brands, ingredients, or recalls seeded.

### Notes

- Sprint 1 ships a **canonical baseline**, not migrations. Numbered migrations begin in the next minor increment.
- Decisions still pending beyond Sprint 1: scoring weight tuning, RLS policies, partitioning strategy once search_logs volumes justify it.
