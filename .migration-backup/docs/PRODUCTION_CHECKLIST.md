# Production Readiness Checklist

> **Last Updated:** 2026-06-29
> **Version:** 0.9.0 (Sprint 2G Complete)

---

## Pre-Launch Checklist

### Backend Security — MUST PASS

- [x] Auth bypass requires explicit `AUTH_BYPASS_ENABLED=true` env var (P1-1)
- [x] Express request timeout configured (30s request, 10s headers) (P1-2)
- [x] RolesGuard registered as APP_GUARD globally (P1-3)
- [ ] No `rejectUnauthorized: false` for Supabase SSL in production
- [ ] Swagger disabled or basic-auth protected in staging/production
- [ ] `pnpm audit` script added to CI pipeline
- [ ] Failed auth attempts logged with request context
- [ ] Request ID header validated (max 128 chars, alphanumeric)

### Backend Authentication — MUST PASS

- [ ] Supabase JWT secret validated at startup (not optional)
- [ ] Token refresh mechanism implemented
- [ ] Role hierarchy model implemented (super_admin > admin > user)
- [ ] CSRF protection enabled for cookie-based auth

### Backend Data Validation — MUST PASS

- [ ] Import controller has class-validator DTO on POST body
- [ ] File size limits enforced (max 10MB)
- [ ] Row count limits enforced (max 100k rows)
- [ ] `BulkScoreDto.weights` keys validated against `ScoringCategory` enum

### Backend Error Handling — MUST PASS

- [x] Scoring persistence failures surface warnings to client (P1-11)
- [ ] All scoring error classes thrown (not just logged)
- [ ] DB health check errors included in response (or logged)
- [ ] Global exception filter doesn't leak internal errors

### Backend Performance — MUST PASS

- [ ] Import: N+1 query pattern resolved (lookup cache for FK resolution)
- [ ] Import: Transaction wrapping on multi-statement product saves
- [x] Scoring: Duplicate certification query removed (P1-12)
- [x] Search: search_vector columns used in queries (P1-7)
- [ ] Import: Batch inserts for large datasets (unnest/VALUES)
- [ ] Search: Rate limiting on public endpoints

### Database — MUST PASS

- [x] Missing trigram indexes added (brands.name, search_keywords.normalized) (P1-8, P1-9)
- [ ] Redundant `idx_search_logs_took_at` B-tree index removed
- [ ] Materialized view refresh function wired to scheduler
- [ ] `v_brand_detail` view created
- [ ] `v_search_result_detail` view created
- [ ] Materialized views have indexes for CONCURRENTLY refresh
- [ ] `VACUUM (ANALYZE)` run after data load

### Search — MUST PASS

- [x] FTS queries use generated `search_vector` columns (P1-7)
- [x] Missing GIN trigram indexes added (P1-8, P1-9)
- [ ] RankingEngine wired into search service (or removed as dead code)
- [ ] Synonyms integrated into search query expansion
- [ ] Recency ranking uses actual `updated_at` timestamps
- [ ] No `ILIKE '%query%'` without index support
- [ ] Search result snippets/highlights implemented

### Scoring — MUST PASS

- [x] Score/bulk endpoints require `admin` role (P1-10)
- [x] Persistence failure warnings surfaced (P1-11)
- [x] Duplicate certification query removed (P1-12)
- [x] URL parse error handled gracefully (P1-13)
- [ ] `scoreAll()` limit configurable (not hardcoded 1000)
- [ ] All scoring error classes used for proper error handling

### Import — MUST PASS

- [ ] N+1 query pattern resolved with lookup cache
- [ ] Transaction wrapping on product saves
- [ ] In-memory job store replaced with DB persistence
- [ ] Merge strategy implemented
- [ ] File size/row count limits enforced
- [ ] Input validation DTO on import endpoint
- [ ] Dry-run mode implemented
- [ ] Duplicate import detection implemented

### Deployment — MUST PASS

- [x] Dockerfile uses `--frozen-lockfile` (P1-21)
- [x] Dockerfile sets `APP_PORT=4000` for healthcheck (P1-20)
- [ ] `.dockerignore` file created
- [ ] API deployment pipeline in CI/CD
- [ ] Production Docker Compose created
- [ ] `.env.production` template created
- [ ] Health check endpoint responds within 1s
- [ ] Graceful shutdown handles in-flight requests

### CI/CD — MUST PASS

- [ ] API deployment workflow (build → test → deploy)
- [ ] E2E test job in CI
- [ ] Test coverage reporting
- [ ] Dependency vulnerability scanning
- [ ] Lint + typecheck enforced on PRs

### Frontend — MUST PASS (Sprint 5)

- [ ] Next.js 15 app scaffolded
- [ ] Root `package.json` and `pnpm-workspace.yaml` created
- [ ] `packages/ui` with shadcn/ui components
- [ ] `packages/types` with shared TypeScript types
- [ ] `packages/utils` with shared utility functions
- [ ] Homepage with hero, search bar, featured content
- [ ] Search results page with filters
- [ ] Product detail page with score, ingredients, nutrition
- [ ] Brand detail page
- [ ] Ingredient detail page
- [ ] API client configured (fetch + error handling)
- [ ] Loading states and error boundaries
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support

### SEO — MUST PASS (Sprint 5)

- [ ] `generateMetadata()` for all pages
- [ ] JSON-LD structured data (Product, Brand, FAQ, BreadcrumbList)
- [ ] Sitemap generation
- [ ] Robots.txt
- [ ] Open Graph / Twitter card meta tags
- [ ] Canonical URLs
- [ ] Breadcrumb navigation

### Accessibility — MUST PASS (Sprint 5)

- [ ] WCAG 2.1 AA compliance
- [ ] Semantic HTML throughout
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] Color contrast 4.5:1 minimum
- [ ] Focus indicators visible
- [ ] ARIA labels on icon-only buttons

### Monitoring — RECOMMENDED

- [ ] Application Performance Monitoring (APM) configured
- [ ] Error tracking (Sentry or similar) configured
- [ ] Structured logging with correlation IDs
- [ ] Health check dashboard
- [ ] Database connection pool monitoring
- [ ] Rate limiting metrics

### Documentation — MUST PASS

- [x] `docs/MVP_AUDIT.md` created
- [x] `docs/PRODUCTION_CHECKLIST.md` created
- [x] `docs/ROADMAP_V2.md` created
- [ ] `docs/API.md` — endpoint documentation for frontend integration
- [ ] `docs/DEPLOYMENT.md` — step-by-step deployment guide
- [ ] `docs/ENVIRONMENT.md` — environment variable reference
- [ ] `README.md` updated with quick-start instructions

---

## Sign-Off

| Area | Owner | Status | Date |
|------|-------|--------|------|
| Backend Security | — | ☐ Pass | — |
| Backend Performance | — | ☐ Pass | — |
| Database | — | ☐ Pass | — |
| Search | — | ☐ Pass | — |
| Scoring | — | ☐ Pass | — |
| Import | — | ☐ Pass | — |
| Frontend | — | ☐ Pass | — |
| SEO | — | ☐ Pass | — |
| Accessibility | — | ☐ Pass | — |
| Deployment | — | ☐ Pass | — |
| CI/CD | — | ☐ Pass | — |
| Documentation | — | ☐ Pass | — |

**Launch Decision:** ☐ Approved | ☐ Blocked

**Notes:**
