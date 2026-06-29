# Project State

> _Authoritative snapshot of the Tuskrank engineering state._
> _Updated at the end of every sprint by the engineer that closed it._

---

## Current Sprint

**Sprint:** `MVP Audit & Production Hardening`
**Status:** ✅ P0 Phase 1 Complete (Backend Hardening)
**Closed by:** Backend engineer

**Previous sprints:**
- `Sprint 2G — Scoring Engine` ✅ Complete
- `Sprint 2F — Search Infrastructure Enhancement` ✅ Complete
- `Sprint 2E — Data Platform Foundation` ✅ Complete
- `Sprint 2D — Brands Module` ✅ Complete
- `Sprint 2C — Ingredients Module` ✅ Complete
- `Sprint 3 — Search Infrastructure` ✅ Complete
- `Sprint 2B Task 3 — Products CRUD & Queries` ✅ Complete
- `Sprint 2B Task 2 — Products Domain Layer` ✅ Complete
- `Sprint 2B Task 1 — Products Module Skeleton` ✅ Complete
- `Sprint 2A.1 — Backend Review Hardening` ✅ Complete
- `Sprint 2A — Backend Foundation` ✅ Complete
- `Sprint 1.x.2 — Production Database Review` ✅ Complete
- `Sprint 1.x — Database Review Hardening` ✅ Complete
- `Sprint 1 — Database` ✅ Complete

## Next Sprint

**Sprint:** `Sprint 5 — Frontend Foundation`
**Status:** ⏳ Not Started

## Audit Status

| Area | Status | Notes |
|------|--------|-------|
| P0 Phase 1 (Backend Hardening) | ✅ Complete | Auth bypass, timeouts, RolesGuard, search_vector, trigram indexes, scoring auth |
| P0 Phase 1.5 (TypeScript Compilation) | ✅ Complete | 245 → 0 production TS errors (3 test file errors remain — supertest types) |
| P0 Phase 2 (Frontend) | ⏳ Pending | Next.js 15 app, packages, pages |
| P0 Phase 3 (SEO & A11y) | ⏳ Pending | Metadata, JSON-LD, sitemap, WCAG 2.1 AA |
| P0 Phase 4 (Deployment) | ⏳ Partial | Dockerfile fixed, deploy workflow created |
| P0 Phase 5 (Testing) | ⏳ Pending | E2E, integration, performance, security |
| Documentation | ✅ Complete | MVP_AUDIT.md, PRODUCTION_CHECKLIST.md, ROADMAP_V2.md |

---

## Documentation Status

| Document | Status | Notes |
| -------- | ------ | ----- |
| [`README.md`](README.md) | ✅ | Project overview (Sprint 0). |
| [`CHANGELOG.md`](CHANGELOG.md) | ✅ | Per-sprint entries; Sprint 2A.1 added. |
| [`TODO.md`](TODO.md) | ✅ | Sprint-driven task ledger. |
| [`docs/API_ROADMAP.md`](docs/API_ROADMAP.md) | ✅ | Every endpoint by module (auth, brands, products, ingredients, search, scoring, AI, recommendations, admin, SEO, analytics, audit, health). |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | ✅ | Architecture Decision Records (Sprint 0 → Sprint 2A.1). |
| [`docs/BACKEND_ARCHITECTURE.md`](docs/BACKEND_ARCHITECTURE.md) | ✅ | Backend folder layout, dependency flow, module responsibilities, coding standards, scalability (Sprint 2A). |
| [`docs/BACKEND_REVIEW.md`](docs/BACKEND_REVIEW.md) | ✅ | Backend Stripe-grade review + score 92/100 (Sprint 2A.1). |
| [`database/README.md`](database/README.md) | ✅ | Database schema, indexes, views, functions, triggers, ER diagram, performance + scaling strategy. |
| [`database/DATABASE_REVIEW.md`](database/DATABASE_REVIEW.md) | ✅ | Database Stripe-grade review + score 85/100 (Sprint 1.x.2). |
| [`database/ERD.md`](database/ERD.md) | ✅ | Mermaid ER diagram (Sprint 1.x.2). |
| [`docs/products_module.md`](docs/products_module.md) | ✅ | Products module docs (Sprint 2B Task 1). |
| [`docs/products_domain.md`](docs/products_domain.md) | ✅ | Products domain docs (Sprint 2B Task 2). |
| [`docs/search_architecture.md`](docs/search_architecture.md) | ✅ | Search architecture docs (Sprint 3 + enhanced Sprint 2F). |
| [`docs/ingredients_module.md`](docs/ingredients_module.md) | ✅ | Ingredients module docs (Sprint 2C). |
| [`docs/brands_module.md`](docs/brands_module.md) | ✅ | Brands module docs (Sprint 2D). |
| [`docs/data_platform.md`](docs/data_platform.md) | ✅ | Data platform / import pipeline docs (Sprint 2E). |
| [`docs/scoring_engine.md`](docs/scoring_engine.md) | ✅ | Scoring engine architecture, strategy pattern, weight system (Sprint 2G). |
| API implementation | ✅ | Sprint 2G: Scoring engine infrastructure complete. |

---

## Repository State

| Area                | Status          | Notes                                            |
| ------------------- | --------------- | ------------------------------------------------ |
| Directory structure | ✅ Complete     | Sprint 0 delivered.                              |
| Root config files   | ✅ Complete     | Sprint 0 delivered.                              |
| AI Engineering OS   | ✅ Scaffolded   | Context, rules, prompts, system, reviews, outputs |
| **Database**        | ✅ **Complete** | Sprint 1 / 1.x / 1.x.2 hardened                   |
| **Backend (NestJS)**| ✅ **Complete (foundation + Products + Search + Ingredients + Brands + Import)** | **Sprint 2A-2E complete** |
| Backend business modules | ✅ Products + Ingredients + Brands + Import complete | Scoring next |
| **Search**          | ✅ **Enhanced** | Sprint 2F: Ranking engine, slug lookup, popular searches, 9 endpoints |
| **Ingredients**     | ✅ **Complete** | Sprint 2C: CRUD, categories, scores, related products, 17 endpoints |
| **Brands**          | ✅ **Complete** | Sprint 2D: CRUD, search, featured, lifecycle, 11 endpoints |
| **Import**          | ✅ **Complete** | Sprint 2E: Pipeline, parsers, validators, normalizers, 4 endpoints |
| **Scoring**         | ✅ **Complete** | Sprint 2G: Strategy Pattern, 7 categories, configurable weights, 4 endpoints |
| Scoring             | ⏳ Not Started  | Sprint 4.                                        |
| Frontend (web)      | ⏳ Not Started  | Sprint 5.                                        |
| Admin               | ⏳ Not Started  | Sprint 6.                                        |
| AI explanations     | ⏳ Not Started  | Sprint 7.                                        |
| SEO                 | ⏳ Not Started  | Sprint 8.                                        |
| Testing             | ⏳ Not Started  | Sprint 9.                                        |
| Deployment / CI/CD  | ⏳ Not Started  | Sprint 10 (workflows scaffolded in Sprint 0).    |

## Backend — Sprint 2A.1 Deliverables

- `apps/api/` NestJS app (NestJS 10, Node 20+, TypeScript strict, ESLint, Prettier, Jest).
- Per-environment env files (`.env.development`, `.env.staging`, `.env.production`, `.env.test`).
- `common/`:
  - `BaseEntity`, `ApiResponseDto`, `PaginationDto`, typed `ApiError` hierarchy, `GlobalExceptionFilter`, `EnvelopeInterceptor`, `TimeoutInterceptor`, `RequestIdMiddleware`, `SupabaseAuthGuard`, `RolesGuard`.
  - Decorators: `@Public`, `@Roles`, `@CurrentUser`, `@ReqId`, `@TimeoutMs`.
  - `UuidValidationPipe`, `LoggerCoreModule` (nestjs-pino), `Swagger`, `ThrottlerGuard` (consolidated inside `CommonModule`).
  - **Hardening**: `SupabaseAuthGuard` LRU verification cache (60s, pruned every 256 calls) + `Promise.race` against a 4s Supabase timeout; `RequestIdMiddleware` is the single source of truth for `req.id`; idempotent `EnvelopeInterceptor`; `RequestLoggingInterceptor` only stamps latency; `toApiErrorPayload` no longer leaks inner `err.message`; `BaseRepository.ping()` uses a fixed `SELECT 1`; `health.controller.ts` Postgres probe bounded to 1.5s.
  - New typed exception: `RequestTimeoutException`.
- `database/` — `DatabaseService` (lazy `pg.Pool`, `connectionTimeoutMillis: 5_000`, soft warmup), `TransactionHelper`, `BaseRepository<T>`. Sprint 2A ships **no business repositories**.
- `modules/health/` — `GET /api/v1/health`, `/health/live`, `/health/ready` (Postgres probe through `Terminus`).
- `modules/auth/` — scaffolding only. `GET /api/v1/auth/me` returns the resolved Supabase user. Login/refresh/logout arrive in Sprint 2B.
- Swagger UI at `/api/docs` (dev/staging only).
- Multi-stage `Dockerfile` (distroless Node 20).
- Spec coverage: `timeout.interceptor.spec.ts`, `supabase-auth.guard.spec.ts`, `pune-rate-limited.e2e` via `test/app.e2e-spec.ts`.
- `docs/BACKEND_ARCHITECTURE.md` and `docs/BACKEND_REVIEW.md` (Stripe-grade review, score 92/100).

## Backend — Sprint 2B Task 3 Deliverables (Products CRUD)

- **Products Repository** (`repositories/products.repository.ts`):
  - Full CRUD: `findById`, `findBySlug`, `findMany`, `findFeatured`, `findTopRated`, `search`.
  - Child hydration: images, ingredients (with joined `ingredients` table), tags, claims, targeting, nutrition profiles, nutrient values, score history — all via parallel queries.
  - Writes: `create`, `update`, `softDelete`, `restore`, `publish`, `unpublish`.
  - Existence: `exists`, `existsByBrandSlug`, `existsByUpc`, `existsByBrandSku`.
  - Dynamic `WHERE` builder for filters, sort-field mapping, full-text search (`to_tsvector`/`to_tsquery`).
  - Materialised view queries for `findTopRated` (backed by `mv_top_rated_products`).
- **Brands Repository** (`repositories/brands.repository.ts`): `findById`, `findBySlug`, `listActive`, `count`.
- **Products Service** (`products.service.ts`):
  - Business validation: brand existence, slug uniqueness, UPC uniqueness, SKU uniqueness.
  - Full lifecycle: create, update, publish, unpublish, soft-delete, restore.
  - `buildQueryFromDto` for controller-to-domain query translation.
- **Products Controller** (`products.controller.ts`):
  - `GET /api/v1/products` — paginated list (`@Public()`).
  - `GET /api/v1/products/:slug` — detail (`@Public()`).
  - `POST /api/v1/products` — create (`@Roles('admin')`, `201`).
  - `PATCH /api/v1/products/:productId` — update (`@Roles('admin')`).
  - `POST /api/v1/products/:productId/publish|unpublish|soft-delete|restore` (`@Roles('admin')`).
- **DTOs**: `CreateProductDto`, `UpdateProductDto`, `ListProductsQueryDto` (all `class-validator` validated).
- **Bug fixes**: Corrected pre-existing import errors in DTOs, entity, constants, and mapper. Added `mapping/index.ts` barrel. Added `packageSizeGrams`/`packageSizeLabel` flat accessors to `ProductEntity`.

## Database — Sprint 1 Deliverables (and Sprint 1.x Hardening)

- **`database/schema.sql`** — 39 tables in 3NF
  - 11 lookup tables (incl. new `relation_types` and ENUM-backed `protein_sources`, `nutrients`)
  - brand / product / ingredient core
  - 8 product-information extension tables (incl. `product_targeting`, `product_images`, `nutrition_profiles`, `product_nutrients` with ENUM `nutrient_bound`)
  - 3 scoring tables (current + append-only history; partial unique on `is_current`)
  - 2 science/citation tables (ENUM `evidence_type_t`)
  - 4 trust tables (recalls with `(source_label, case_number)` dedupe)
  - 4 search tables (citext normalization) + 1 raw search log (partitioning-ready)
  - 3 recommendation tables (`relation_types` + `related_products` + `product_alternatives`)
  - 2 SEO tables (canonical URL unique)
  - `audit_logs` (append-only; SECURITY DEFINER writer; generated `diff` jsonb)
  - All FKs explicit with chosen `ON DELETE` (RESTRICT for canonical lookups)
  - All mutable domain tables have `created_at`, `updated_at`, soft-delete `deleted_at`
  - UUID primary keys throughout
  - ENUMs: `recall_severity`, `recall_status`, `seo_page_kind`, `nutrient_bound`, `actor_type_t`, `evidence_type_t`, `protein_origin`, `nutrition_source`, `score_history_trigger`
- **`database/indexes.sql`** — 112 indexes
  - B-tree on FK, slug, sort, status columns
  - Partial indexes on active rows
  - Partial **unique** indexes (soft-delete aware; single-current; dedupe natural keys)
  - GIN trigram for fuzzy name search
  - GIN tsvector on generated `search_vector` columns for products/ingredients/brands
  - GIN on `search_logs.entity_types` (array containment)
  - GIN(`jsonb_path_ops`) on `audit_logs.diff` (forensic search)
  - BRIN on `search_logs.took_at`
- **`database/views.sql`** — 13 views (9 plain + 4 materialized)
  - Plain: `v_top_rated_products`, `v_top_rated_ingredients`, `v_top_brands`, `v_latest_recalls`, `v_trending_searches`, `v_product_detail`, `v_ingredient_detail`, `v_product_ingredient_list`, `v_current_product_scores`
  - Materialized: `mv_top_rated_products`, `mv_top_rated_ingredients`, `mv_top_brands`, `mv_latest_recalls` (UNIQUE INDEXed for `CONCURRENTLY`)
  - All plain views marked `WITH (security_invoker = true)`
- **`database/functions.sql`** — 12 functions, all `SET search_path = public`
  - Slug generation, slug uniqueness, updated_at touch, keyword normalization, overall score, soft-delete helper, search-keyword upsert, search-vector refresh hook, **SECURITY DEFINER** audit writer, trigram match score, slug-from-name factory, single-primary-image guard, materialized view refresh
- **`database/triggers.sql`** — auto-applied
  - `updated_at` triggers on every `updated_at`-bearing table
  - Slug-generation triggers on 14 name-bearing tables
  - Search-keyword sync triggers on brands/products/ingredients/product_ingredients
  - Soft-delete keyword cascade on brands/products/ingredients
  - Single-primary-image guard trigger on `product_images`
  - Cycle-prevention triggers on `categories` / `ingredient_categories`
  - Append-only `score_history` + audit on `product_scores`/`ingredient_scores` (via `fn_write_audit`)
- **`database/seed.sql`** — lookup-only seed data (now also seeds `relation_types`)
  - pet_types (5), life_stages (per pet type), breed_sizes (per pet type)
  - food_forms (10), protein_sources (16, ENUM-bound), ingredient_categories (10)
  - claims (12), tags (14), relation_types (6)
  - **No products, brands, or ingredients seeded.**
- **`database/README.md`** — overview, ER diagram, conventions, cascade policy, indexes, performance, scaling, future migration strategy, security model, intentional non-goals.
- **`database/DATABASE_REVIEW.md`** — Stripe-grade review + score 85/100.
- **`database/ERD.md`** — Mermaid ER diagram.

## Tech Stack — Confirmed

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** NestJS
- **Database:** PostgreSQL via Supabase (3NF, UUID PKs, RLS-ready, ready for 100k+ products)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Deployment:** Vercel

## Engineering OS (`.ai/`)

| Folder | Purpose |
| ------ | ------- |
| `.ai/context/` | Vision, mission, product, architecture, database, SEO, roadmap. |
| `.ai/rules/` | Coding, database, backend, frontend, SEO, security, testing rules. |
| `.ai/prompts/` | Sprint execution prompts (`Sprint_00.md` → `Sprint_10_Deployment.md`). |
| `.ai/system/` | System prompt + engineering principles. |
| `.ai/reviews/` | Review outputs (per-sprint). |
| `.ai/outputs/` | Generated artefacts (kept empty by default). |

## Open Risks / Notes

- **No psql on the build host at Sprint 1 time:** SQL files were verified by structured logical review (paren balance, referenced-object existence, ON CONFLICT arbiter presence, generated-column Postgres-12+ syntax, partial-index validity). A live Supabase deploy must be smoke-tested in CI before Sprint 2 lands.
- **No row-level security policies:** RLS-ready schema, but policies are intentionally deferred to a Sprint 1.1 follow-up migration to keep the baseline portable and reproducible in non-Supabase environments.
- **No migrations folder under `database/`:** Sprint 1 chose raw files (`schema.sql`, `indexes.sql`, etc.) so the foundation can be adopted unchanged. Versioned migrations begin Sprint 1.1 onward.
- **Products CRUD complete, but no tests yet:** Integration tests for the Products module are a follow-up task.
- **`noUncheckedIndexedAccess` not yet enforced:** Deferred to a follow-up so it does not break the foundation before tests are in.
- **`tsc --noEmit` shows pre-existing path alias errors:** `@types`, `@common`, `@database` modules can't resolve without `tsconfig-paths` at the `tsc` level. These work at runtime via NestJS + `tsconfig-paths`. Not blocking.

## Definition of Done — Sprint 2E

- [x] Import module structure created: `types/`, `constants/`, `enums/`, `errors/`, `parsers/`, `validators/`, `normalizers/`, `mappers/`, `jobs/`, `templates/`.
- [x] CSV parser with quoted field support, escaped quotes, boolean coercion.
- [x] JSON parser with array, wrapper key, and single object support.
- [x] Row validators for Products, Brands, and Ingredients with field-level error reporting.
- [x] Normalization utilities: `slugify()`, `normalizeBrandName()`, `normalizeCanonicalName()`, `normalizeUpc()`, `normalizeCountryCode()`, `normalizeUrl()`, `normalizeList()`, `normalizeNumeric()`, `normalizeBoolean()`, `parsePackageSizeToGrams()`.
- [x] Raw-to-domain mappers for Brands, Products, and Ingredients.
- [x] Import pipeline service: Parse → Validate → Normalize → Deduplicate → Save → Report.
- [x] Import repository with FK resolution, batch inserts, and UPSERT.
- [x] Import controller with 4 admin endpoints.
- [x] Deduplication strategies: Skip, Overwrite, Merge.
- [x] Import job tracking (in-memory).
- [x] Import report generation with per-row status.
- [x] Sample import templates: `products.csv`, `brands.csv`, `ingredients.csv`.
- [x] `AppModule` updated to import `ImportModule`.
- [x] `CHANGELOG.md` and `PROJECT_STATE.md` updated.
- [x] `docs/data_platform.md` created.
- [x] ESLint clean for `src/modules/import/**/*.ts`.

## Definition of Done — Sprint 2F

- [x] Search module structure enhanced: `enums/`, `interfaces/`, `ranking/`, `constants/`, `types/`.
- [x] RankingEngine with 6 composable ranking strategies (FullText, Trigram, EntityScore, Keyword, Recency, Popularity).
- [x] SearchStrategy enum with 7 strategy types.
- [x] SearchProvider interface for future backend swap (ES/Meilisearch).
- [x] RankingStrategy interface for custom signal implementations.
- [x] Search repository enhanced with slug lookup and popular searches.
- [x] Search service enhanced with deduplication and synonym expansion hook.
- [x] Search controller enhanced with slug lookup and popular endpoints (9 total).
- [x] Constants: SEARCH_BOUNDS, DEFAULT_RANKING_WEIGHTS, SEARCH_RANKING_WEIGHTS, SEARCH_ANALYTICS.
- [x] Types: SearchResultItem, SearchResult, GlobalSearchResult, AutocompleteSuggestion, TrendingSearch, PopularSearch.
- [x] `CHANGELOG.md` updated with [0.8.0] Sprint 2F entry.
- [x] `PROJECT_STATE.md` updated with Sprint 2F state.
- [x] No breaking changes to existing endpoints.

---

## Definition of Done — Sprint 2G

- [x] Scoring module structure created: `engine/`, `strategies/`, `repositories/`, `dto/`, `types/`, `enums/`, `constants/`, `interfaces/`, `errors/`.
- [x] ScoringEngine with configurable weights and grade derivation.
- [x] 7 scoring strategies implementing ScoringStrategy interface.
- [x] ScoringStrategy interface for custom category implementations.
- [x] Scoring repository with product data fetch, score persistence, bulk operations.
- [x] Scoring service with score, bulk, preview, scoreAll, getCurrentScore.
- [x] Scoring controller with 4 endpoints (score, bulk, preview, current).
- [x] DTOs: ScoreProductDto, BulkScoreDto, ScoringResultDto, CurrentScoreDto, BulkScoreResultDto.
- [x] Types: CategoryScore, ScoringResult, ScoringConfig, ProductScoringInput, ScoringWarning, ScoringRecommendation.
- [x] Enums: ScoringCategory (7), ScoreGrade (13), WarningSeverity (5), ScoringVersion, ScoreTrigger.
- [x] Constants: DEFAULT_SCORING_WEIGHTS, SCORING_BOUNDS, GRADE_BOUNDARIES.
- [x] Errors: ScoringError, ProductNotScorableError, InsufficientDataError, InvalidWeightConfigError.
- [x] `AppModule` updated to import `ScoringModule`.
- [x] `CHANGELOG.md` updated with [0.9.0] Sprint 2G entry.
- [x] `PROJECT_STATE.md` updated with Sprint 2G state.
- [x] `docs/scoring_engine.md` created.
- [x] TypeScript clean for scoring module (only pre-existing @database path alias errors).

---

> After Sprint 2G, **stop**. The next sprint begins only on explicit instruction.

