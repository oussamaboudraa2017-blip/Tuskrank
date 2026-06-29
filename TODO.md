# TODO

> _Living task ledger._ Items are grouped by sprint and ordered top-to-bottom by priority within each sprint.
> _This file is the source of truth for what each sprint must deliver. Update as work completes._

---

## Sprint 0 — Repository Initialization

### Status

✅ **Complete** (2026-06-29)

### Done

- [x] Create complete directory structure.
- [x] Create root config files (README, LICENSE, .gitignore, .editorconfig, .prettierrc, .eslintrc, .env.example, docker-compose.yml).
- [x] Create `.ai/context/` placeholders.
- [x] Create `.ai/rules/` placeholders.
- [x] Create `.ai/prompts/` sprint placeholders (Sprint_00 → Sprint_10).
- [x] Create `.ai/system/` placeholders.
- [x] Create `.ai/reviews/` and `.ai/outputs/` with `.gitkeep`.
- [x] Create `.github/workflows/` (CI, Preview, Dependency Review).
- [x] Create `PROJECT_STATE.md`, `CHANGELOG.md`, `TODO.md`.

### Carried Forward

- None.

---

## Sprint 1 — Database

### Status

✅ **Complete** (2026-06-29)

### Done

- [x] Author canonical schema in `database/schema.sql` (39 tables, 3NF, UUID PKs).
- [x] Author `database/indexes.sql` (112 indexes including partial/unique/GIN/GIN-trigram/generated-vector).
- [x] Author `database/views.sql` (13 views including 4 materialized, security_invoker = true).
- [x] Author `database/functions.sql` (12 functions, all `SET search_path = public`).
- [x] Author `database/triggers.sql` (updated_at, slug, keyword sync, soft-delete cascade, single-primary guard, score history, audit).
- [x] Author `database/seed.sql` (lookup-only: pet_types, life_stages, breed_sizes, food_forms, protein_sources, ingredient_categories, claims, tags, relation_types).
- [x] Author `database/README.md` (overview, ER, naming, cascades, indexes, performance, scaling, migrations, security, non-goals).
- [x] Logical review of all SQL files (paren balance, table presence, function presence, view presence, ON CONFLICT arbiter verification).
- [x] **Sprint 1 Production Review (Sprint 1.x.2)** (2026-06-29):
  - [x] `nutrition_profiles.source` and `score_history.triggered_by` converted to ENUMs.
  - [x] Cycle-prevention triggers on `categories` and `ingredient_categories` (with bounded depth).
  - [x] BRIN on `search_logs.took_at` for time-window scans.
  - [x] Identifier-safety hardened in `fn_ensure_slug`.
  - [x] `fn_refresh_materialized_views` rewritten with per-MV savepoints + WARNING.
  - [x] Size & length caps added to free-text URL fields, `audit_logs.before/after`, `search_logs.user_agent/session_id`.
  - [x] Documented retention strategy for `score_history`, `audit_logs`, `search_logs`.
  - [x] `DATABASE_REVIEW.md` produced with explicit RLS, partitioning, and extension roadmap.
- [x] **Stripe-grade review hardening** (Sprint 1.x — 2026-06-29):
  - [x] `country_code char(2)` instead of free-form country code text.
  - [x] `citext` for all normalized search columns.
  - [x] ENUMs replace free-text + check constraints for `actor_type`, `evidence_type`, `protein_origin`, `nutrient_bound`.
  - [x] `relation_types` lookup table; removed free-text `related_products.relation_type`.
  - [x] Removed `faq_items.page_kind` denormalization.
  - [x] All FK lookups tightened to `RESTRICT` to preserve domain.
  - [x] Partial unique indexes added: `(brand_id, sku)`, `upc`, single-primary image, single-current scores, recalls source+case#.
  - [x] Materialized views for top-rated / latest-recalls with unique indexes for `CONCURRENTLY` refresh.
  - [x] `fn_write_audit` SECURITY DEFINER writer for `audit_logs`.
  - [x] `audit_logs.diff` generated `jsonb` + GIN(`jsonb_path_ops`) for forensic search.
  - [x] Soft-delete keyword cascade triggers.
  - [x] Single-primary-image guard trigger.
  - [x] URL/email/IP validators on free-text URL fields.
  - [x] Length caps on free-text descriptions, notes, reasons.
  - [x] Partitioning-ready timestamps on hot tables.

### Deferred (Tracked in `database/README.md`)

- [ ] Row-Level Security (RLS) policies (Sprint 1.1.1 follow-up).
- [ ] Live psql smoke-test against Supabase target.
- [ ] `database/migrations/` numbered versions (begin Sprint 1.1.1).
- [ ] Partitioning of `audit_logs` by `occurred_at`.
- [ ] Partitioning of `search_logs` by `took_at`.

### Carried Forward

- None.

---

## Sprint 2A — Backend Foundation

### Status

✅ **Complete** (2026-06-29)

### Done

- [x] Initialize NestJS app under `apps/api` (Sprint 2A scaffold).
- [x] Configure Supabase client and JWT auth guard (`SupabaseAuthGuard`).
- [x] Implement `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`.
- [x] Configure DTO validation (ValidationPipe), CORS, body-parser limits, rate limiting (ThrottlerModule).
- [x] Set up structured logging with correlation IDs (nestjs-pino + RequestIdMiddleware + RequestLoggingInterceptor).
- [x] Author `BaseRepository<T>` and `TransactionHelper` (no business repositories in Sprint 2A).
- [x] Author error envelope + global exception filter.
- [x] Author envelope interceptor + timeout interceptor + request-id middleware.
- [x] Author Swagger scaffolding (dev only).
- [x] Author multi-stage Dockerfile (distroless Node 20).
- [x] Author env files for development / staging / production / test.
- [x] Author `docs/BACKEND_ARCHITECTURE.md`.
- [x] Update `PROJECT_STATE.md`, `CHANGELOG.md`, `TODO.md`.

### Not in Scope (Sprint 2A)

- [ ] No business modules (Products, Search, Scoring, AI, Admin).
- [ ] No login / refresh / logout endpoints (Sprint 2B).
- [ ] No OpenTelemetry exporter wired to a backend.
- [ ] No Redis-backed rate limiting.

### Sprint 2B Carried Forward

- [ ] Products module — repository, service, controller.
- [ ] Login / refresh / logout on Auth module.
- [ ] First business repositories wired to `BaseRepository<T>`.
- [ ] First paginated list endpoint exercised end-to-end.

---

## Sprint 3 — Search

### Status

⏳ Not started.

### To Do

- [ ] Implement product full-text search.
- [ ] Implement ingredient full-text search + facets.
- [ ] Expose `/v1/search/products`, `/v1/search/ingredients`.
- [ ] Add search analytics logging.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 4 — Scoring

### Status

⏳ Not started.

### To Do

- [ ] Author ingredient quality grading model.
- [ ] Compute product scores deterministically.
- [ ] Generate "healthier alternative" candidates (same species + life stage).
- [ ] Surface contested ingredient flags.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 5 — Frontend (Public Web)

### Status

⏳ Not started.

### To Do

- [ ] Initialize Next.js 15 app under `apps/web`.
- [ ] Wire shadcn/ui + Tailwind + TypeScript strict.
- [ ] Build design system primitives in `packages/ui`.
- [ ] Build core pages: `/`, `/search`, `/products/[slug]`, `/ingredients/[slug]`.
- [ ] Server-side data fetching for SEO.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 6 — Admin Console

### Status

⏳ Not started.

### To Do

- [ ] Initialize admin Next.js app under `apps/admin`.
- [ ] Build CRUD for products, brands, ingredients.
- [ ] Manage scoring rules + ingredient flags.
- [ ] Audit log viewer for content changes.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 7 — AI

### Status

⏳ Not started.

### To Do

- [ ] Implement AI explanations for ingredient panels.
- [ ] Implement NL search understanding.
- [ ] Prompt registry + per-prompt rate limits + cost tracking.
- [ ] Persist AI outputs with provenance.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 8 — SEO

### Status

⏳ Not started.

### To Do

- [ ] Generate product, ingredient, comparison, editorial sitemaps.
- [ ] Add structured data for `Product`, `BreadcrumbList`, `Organization`.
- [ ] Enforce canonical URLs + meta templates.
- [ ] Implement `/compare/[a]-vs-[b]` programmatic pages.
- [ ] Enforce Core Web Vitals performance budget.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 9 — Testing

### Status

⏳ Not started.

### To Do

- [ ] Unit + integration + e2e test suites.
- [ ] CI coverage regression guard.
- [ ] Contract tests across web → api → db.
- [ ] Load test for top read endpoints.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Sprint 10 — Deployment

### Status

⏳ Not started.

### To Do

- [ ] Wire release pipeline in `.github/workflows/`.
- [ ] Configure Vercel projects for `apps/web` and `apps/admin`.
- [ ] Configure runtime for `apps/api`.
- [ ] Promote environments (dev → staging → prod).
- [ ] Configure managed secrets store.
- [ ] Observability: logs, metrics, traces + dashboards + alerts.
- [ ] Update `PROJECT_STATE.md` and `CHANGELOG.md`.

---

## Cross-Sprint / Standing Items

- [ ] Keep `.ai/context/` docs in sync with reality (every sprint should update them where applicable).
- [ ] No fake data ever enters any production path.
- [ ] No TODO left in the tree without a tracking ticket.
- [ ] Performance and security are non-negotiable.
