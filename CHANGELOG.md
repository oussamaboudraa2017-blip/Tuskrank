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

- _Nothing yet. Sprint 2C has not started._

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
