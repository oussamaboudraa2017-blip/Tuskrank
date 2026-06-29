# MVP Audit Report

> **Audit Date:** 2026-06-29
> **Auditor:** Engineering Team
> **Version:** 0.9.0 (Sprint 2G Complete)

---

## Executive Summary

| Subsystem | Status | Risk | Score |
|-----------|--------|------|-------|
| Backend (NestJS) | 85% production-ready | MEDIUM | 88/100 |
| Database (PostgreSQL) | 95% production-ready | LOW | 93/100 |
| Frontend (Next.js) | 0% — does not exist | CRITICAL | 0/100 |
| Search | 70% production-ready | HIGH | 72/100 |
| Scoring | 80% production-ready | MEDIUM | 82/100 |
| Import Pipeline | 50% production-ready | HIGH | 55/100 |
| Security | 80% production-ready | MEDIUM | 80/100 |
| Deployment | 40% production-ready | HIGH | 45/100 |
| SEO | 0% — no frontend | CRITICAL | 0/100 |
| Accessibility | 0% — no frontend | CRITICAL | 0/100 |

**Overall MVP Readiness: ~55%** — Backend is solid but frontend doesn't exist, and several critical backend issues must be fixed before launch.

---

## 1. Backend (NestJS) — 85% Production-Ready

### 1.1 Security

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Dev bypass grants Admin role with no token | CRITICAL | **FIXED** | `supabase-auth.guard.ts:46` |
| No Express-level request timeout | CRITICAL | **FIXED** | `main.ts:97` |
| RolesGuard not registered globally | HIGH | **FIXED** | `common.module.ts:72` |
| Swagger enabled in staging | MEDIUM | Open | `swagger.ts` |
| No `pnpm audit` script | MEDIUM | Open | `package.json` |
| In-memory rate limiting not shared across instances | MEDIUM | Open | `common.module.ts` |
| No logging of auth failures | LOW | Open | `supabase-auth.guard.ts` |
| Request ID header not validated | LOW | Open | `request-id.middleware.ts` |

### 1.2 Authentication & Authorization

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Auth bypass relies solely on NODE_ENV | CRITICAL | **FIXED** | `supabase-auth.guard.ts:46` |
| No token refresh mechanism | MEDIUM | Deferred | Sprint 5 |
| No role hierarchy model | LOW | Deferred | Future |
| No CSRF protection for cookie-based auth | LOW | Deferred | Future |

### 1.3 Data Validation

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Import controller lacks input validation DTO | MEDIUM | Open | `import.controller.ts` |
| `BulkScoreDto.weights` accepts arbitrary keys/values | LOW | Open | `dto/bulk-score.dto.ts` |
| No file size/row count limits enforced on import | MEDIUM | Open | `import.service.ts` |

### 1.4 Error Handling

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Scoring persistence failures silently swallowed | HIGH | **FIXED** | `scoring.service.ts:206` |
| Scoring error classes defined but never thrown | LOW | Open | `errors/index.ts` |
| DB health check error discarded entirely | LOW | Open | `health.controller.ts` |

### 1.5 Performance

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Import N+1 query pattern (15-25 queries per row) | CRITICAL | Open | `import.service.ts:353` |
| Import no transaction wrapping on saves | CRITICAL | Open | `import.service.ts:287` |
| Scoring duplicate certification query | MEDIUM | **FIXED** | `scoring.repository.ts:96` |
| Import: No batch inserts | MEDIUM | Open | `import.service.ts` |

---

## 2. Database (PostgreSQL) — 95% Production-Ready

### 2.1 Schema Quality: A-

- 39 tables in 3NF
- UUID primary keys throughout
- Comprehensive CHECK constraints
- ENUM types for closed value sets
- Soft-delete pattern (`deleted_at`) consistent
- Generated `search_vector` columns (products, ingredients, brands)

### 2.2 Indexing

| Category | Count | Status |
|----------|-------|--------|
| B-tree on FKs/slugs | ~60 | Good |
| Partial indexes (active rows) | ~30 | Good |
| Partial uniques (soft-delete-aware) | ~15 | Good |
| GIN trigram (fuzzy search) | 3 | Good |
| GIN tsvector (FTS) | 3 | Good |
| BRIN (time-series) | 1 | Good |
| **Missing FK indexes** | 0 | Good |
| **Redundant indexes** | 1 | Open |

**Redundant index found:**
- `idx_search_logs_took_at` (B-tree) duplicates `idx_search_logs_took_at_brin` (BRIN) on same column

### 2.3 Missing Views

| View | Purpose | Impact |
|------|---------|--------|
| `v_brand_detail` | Brand page aggregation | MEDIUM — causes N+1 |
| `v_search_result_detail` | Search result enrichment | MEDIUM — causes N+1 |

### 2.4 Materialized Views

| Issue | Severity | Status |
|-------|----------|--------|
| Refresh function exists but is never called | HIGH | Open |
| No indexes on materialized views | MEDIUM | Open |

---

## 3. Search — 70% Production-Ready

### 3.1 Critical Issues

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Generated `search_vector` columns exist but aren't used by queries | HIGH | **FIXED** | `search.repository.ts` |
| Missing GIN trigram index on `brands.name` | HIGH | **FIXED** | `indexes.sql` |
| Missing GIN trigram index on `search_keywords.normalized` | HIGH | **FIXED** | `indexes.sql` |
| `ILIKE '%query%'` on brands/ingredients causes full table scans | MEDIUM | Open | `search.repository.ts:199,299` |

### 3.2 RankingEngine

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| RankingEngine instantiated but never used (dead code) | MEDIUM | Open | `search.service.ts` |
| Recency ranking hardcoded to 0.5 | MEDIUM | Open | `ranking/recency.strategy.ts` |
| Synonyms not integrated into search queries | MEDIUM | Open | `search.service.ts` |

### 3.3 Missing Features

| Feature | Priority | Status |
|---------|----------|--------|
| No rate limiting on search endpoints | MEDIUM | Open |
| No result snippet/highlight generation | LOW | Open |
| No faceted search | LOW | Future |
| No "did you mean?" spell correction | LOW | Future |
| No cursor-based pagination | LOW | Future |

---

## 4. Scoring — 80% Production-Ready

### 4.1 Critical Issues

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| All endpoints `@Public()` with no auth or rate limiting | HIGH | **FIXED** | `scoring.controller.ts` |
| Persistence failures silently swallowed | HIGH | **FIXED** | `scoring.service.ts:206` |
| Duplicate certification query adds latency | MEDIUM | **FIXED** | `scoring.repository.ts:96` |
| `new URL(r.url).hostname` throws on malformed URLs | MEDIUM | **FIXED** | `scientific-evidence.strategy.ts:52` |

### 4.2 Strategy Bugs

| Strategy | Issue | Severity | Location |
|----------|-------|----------|----------|
| NutritionalBalance | Uses `ashPercent` for dry matter calc but `ashPercent` is not in scoring input | MEDIUM | `nutritional-balance.strategy.ts` |
| IngredientQuality | Hardcoded protein source scores | LOW | `ingredient-quality.strategy.ts` |
| LabelTransparency | Always returns same confidence | LOW | `label-transparency.strategy.ts` |

### 4.3 Missing Features

| Feature | Priority | Status |
|---------|----------|--------|
| Configurable grade boundaries from DB | LOW | Future |
| A/B testing for weight configurations | LOW | Future |
| ML-based scoring | LOW | Future |
| `scoreAll()` hardcodes limit to 1000 | MEDIUM | Open |

---

## 5. Import Pipeline — 50% Production-Ready

### 5.1 Critical Issues

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| N+1 query pattern in product saves | CRITICAL | Open | `import.service.ts:353-481` |
| No transaction wrapping on multi-statement saves | CRITICAL | Open | `import.service.ts:287` |
| In-memory job store lost on restart | HIGH | Open | `import.service.ts:37` |
| File size/row count limits defined but not enforced | MEDIUM | Open | `import.service.ts` |
| No input validation DTO on POST body | MEDIUM | Open | `import.controller.ts:56` |

### 5.2 Pipeline Issues

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| Merge strategy not implemented (stub only) | MEDIUM | Open | `import.service.ts:242` |
| Wrong rowIndex tracking in save results | MEDIUM | Open | `import.service.ts:296` |
| Validation warnings computed but discarded | LOW | Open | `import.service.ts:214` |
| No dry-run mode | MEDIUM | Open | `import.service.ts` |
| No duplicate import detection | MEDIUM | Open | `import.service.ts` |

### 5.3 Missing Features

| Feature | Priority | Status |
|---------|----------|--------|
| File upload endpoint (multipart/form-data) | MEDIUM | Future |
| Progress streaming for long imports | LOW | Future |
| Undo/rollback capability | LOW | Future |
| Scheduled import runners | LOW | Future |

---

## 6. Deployment — 40% Production-Ready

### 6.1 Docker

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| `HEALTHCHECK` uses unset `APP_PORT` env var | HIGH | **FIXED** | `Dockerfile:44` |
| `--frozen-lockfile=false` allows non-reproducible builds | HIGH | **FIXED** | `Dockerfile:23` |
| No `.dockerignore` file | MEDIUM | Open | Root |
| No production Docker Compose | MEDIUM | Open | Root |

### 6.2 CI/CD

| Issue | Severity | Status | Location |
|-------|----------|--------|----------|
| No API deployment pipeline | HIGH | Open | `.github/workflows/` |
| No e2e test job in CI | MEDIUM | Open | `ci.yml` |
| No test coverage reporting | LOW | Open | `ci.yml` |

### 6.3 Production Config

| Issue | Severity | Status |
|-------|----------|--------|
| No `.env.production` template | MEDIUM | Open |
| No Redis for shared rate limiting | MEDIUM | Future |
| No CDN for static assets | LOW | Future |
| No Kubernetes manifests | LOW | Future |

---

## 7. Frontend — 0% (Not Started)

### 7.1 Current State

- `apps/web/` is completely empty
- No Next.js app, no package.json, no config files
- Root `.eslintrc` and `.prettierrc` pre-configured for Next.js/React/Tailwind

### 7.2 Required for MVP

| Page | Priority | Description |
|------|----------|-------------|
| Homepage | P0 | Hero, search bar, featured products/brands |
| Search Results | P0 | Product/brand/ingredient search with filters |
| Product Detail | P0 | Full product info, score, ingredients, nutrition |
| Brand Detail | P1 | Brand info, products, scores |
| Ingredient Detail | P1 | Ingredient info, safety, references |
| About | P2 | Static content |
| FAQ | P2 | Static content |

### 7.3 Required Infrastructure

| Item | Priority | Description |
|------|----------|-------------|
| Root `package.json` | P0 | Workspace definition |
| `pnpm-workspace.yaml` | P0 | Monorepo workspace config |
| `packages/ui` | P0 | Shared UI components (shadcn/ui) |
| `packages/types` | P0 | Shared TypeScript types |
| `packages/utils` | P0 | Shared utility functions |
| `packages/config` | P1 | Shared configuration |

---

## 8. SEO — 0% (No Frontend)

### 8.1 Backend SEO Infrastructure (Complete)

- `seo_pages` table with structured data support
- `faq_items` table for FAQ schema
- Generated `search_vector` columns for FTS
- Slug-based URLs for all entities

### 8.2 Frontend SEO Requirements (Not Started)

| Requirement | Priority | Status |
|-------------|----------|--------|
| Next.js App Router with metadata API | P0 | Not started |
| Dynamic `generateMetadata()` per page | P0 | Not started |
| JSON-LD structured data (Product, Brand, FAQ) | P0 | Not started |
| Sitemap generation | P0 | Not started |
| Robots.txt | P0 | Not started |
| Open Graph / Twitter cards | P1 | Not started |
| Canonical URLs | P1 | Not started |
| Breadcrumbs | P1 | Not started |

---

## 9. Accessibility — 0% (No Frontend)

### 9.1 Requirements (Not Started)

| Requirement | Priority | Status |
|-------------|----------|--------|
| WCAG 2.1 AA compliance | P0 | Not started |
| Semantic HTML | P0 | Not started |
| Keyboard navigation | P0 | Not started |
| Screen reader support | P0 | Not started |
| Color contrast (4.5:1 minimum) | P0 | Not started |
| Focus indicators | P0 | Not started |
| ARIA labels | P1 | Not started |

---

## 10. Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Frontend not built before launch | HIGH | CRITICAL | Sprint 5 must be executed |
| Auth bypass in production | LOW | CRITICAL | **FIXED** — requires `AUTH_BYPASS_ENABLED=true` |
| Import data corruption (no transactions) | MEDIUM | HIGH | Wrap saves in transaction |
| Search performance degradation | MEDIUM | HIGH | Add missing trigram indexes, use search_vector |
| Scoring persistence silent failures | MEDIUM | MEDIUM | **FIXED** — warnings now surfaced |
| Database MV refresh not scheduled | MEDIUM | MEDIUM | Wire to pg_cron or external scheduler |
| Non-reproducible Docker builds | LOW | HIGH | **FIXED** — frozen-lockfile enforced |

---

## Appendix A: File Inventory

### Backend Modules (Complete)

| Module | Files | Endpoints | Sprint |
|--------|-------|-----------|--------|
| Auth | 3 | 1 | 2A |
| Health | 3 | 3 | 2A |
| Products | 12 | 8 | 2B |
| Search | 17 | 9 | 3+2F |
| Ingredients | 36 | 17 | 2C |
| Brands | 24 | 11 | 2D |
| Import | 26 | 4 | 2E |
| Scoring | 18 | 4 | 2G |
| **Total** | **139** | **57** | — |

### Database Objects

| Object Type | Count |
|-------------|-------|
| Tables | 39 |
| Indexes | 112+ |
| Views | 13 |
| Functions | 12 |
| Triggers | ~30 |
| ENUMs | 9 |

---

> **Next Action:** Execute Priority 1 fixes, then build frontend (Sprint 5).
