# Roadmap V2 — Priority-Based Development Plan

> **Last Updated:** 2026-06-29
> **Current Version:** 0.9.0 (Sprint 2G Complete)
> **Next Major Milestone:** MVP Launch

---

## Priority Legend

| Priority | Description | Timeline |
|----------|-------------|----------|
| **P0** | Must complete before MVP launch | Week 1-4 |
| **P1** | Should complete before launch | Week 2-6 |
| **P2** | Nice to have for launch | Week 4-8 |
| **P3** | Future improvements | Post-launch |

---

## P0: Critical Path to MVP Launch

### Phase 1: Backend Hardening (Week 1)

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 1 | Auth bypass hardening (`AUTH_BYPASS_ENABLED` env var) | 1h | Backend | ✅ Done |
| 2 | Express request timeout (30s/10s) | 1h | Backend | ✅ Done |
| 3 | RolesGuard as APP_GUARD | 1h | Backend | ✅ Done |
| 4 | Search: Use search_vector columns in queries | 2h | Backend | ✅ Done |
| 5 | Search: Add missing trigram indexes | 1h | DB | ✅ Done |
| 6 | Scoring: Add auth to score/bulk endpoints | 1h | Backend | ✅ Done |
| 7 | Scoring: Surface persistence failure warnings | 1h | Backend | ✅ Done |
| 8 | Scoring: Remove duplicate certification query | 30m | Backend | ✅ Done |
| 9 | Scoring: Handle URL parse errors | 30m | Backend | ✅ Done |
| 10 | Dockerfile: Fix frozen-lockfile and APP_PORT | 30m | DevOps | ✅ Done |
| 11 | Import: Wrap product saves in transaction | 3h | Backend | ☐ Pending |
| 12 | Import: Add FK lookup cache (N+1 fix) | 4h | Backend | ☐ Pending |
| 13 | Import: Add input validation DTO | 1h | Backend | ☐ Pending |
| 14 | Database: Remove redundant search_logs B-tree index | 30m | DB | ☐ Pending |
| 15 | Database: Wire MV refresh to scheduler | 2h | DB | ☐ Pending |

**Phase 1 Total: ~20h (12h done, 8h remaining)**

### Phase 2: Frontend Foundation (Week 2-3)

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 16 | Create root `package.json` + `pnpm-workspace.yaml` | 1h | Frontend | ☐ Pending |
| 17 | Scaffold `apps/web/` Next.js 15 app | 2h | Frontend | ☐ Pending |
| 18 | Create `packages/ui` with shadcn/ui components | 4h | Frontend | ☐ Pending |
| 19 | Create `packages/types` with shared types | 2h | Frontend | ☐ Pending |
| 20 | Create `packages/utils` with shared utilities | 2h | Frontend | ☐ Pending |
| 21 | Build API client (fetch wrapper + error handling) | 3h | Frontend | ☐ Pending |
| 22 | Build Homepage (hero, search bar, featured) | 4h | Frontend | ☐ Pending |
| 23 | Build Search Results page with filters | 6h | Frontend | ☐ Pending |
| 24 | Build Product Detail page | 6h | Frontend | ☐ Pending |
| 25 | Build Brand Detail page | 3h | Frontend | ☐ Pending |
| 26 | Build Ingredient Detail page | 3h | Frontend | ☐ Pending |
| 27 | Add loading states and error boundaries | 2h | Frontend | ☐ Pending |
| 28 | Responsive design (mobile-first) | 4h | Frontend | ☐ Pending |

**Phase 2 Total: ~42h**

### Phase 3: SEO & Accessibility (Week 3-4)

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 29 | `generateMetadata()` for all pages | 3h | Frontend | ☐ Pending |
| 30 | JSON-LD structured data (Product, Brand, FAQ) | 3h | Frontend | ☐ Pending |
| 31 | Sitemap generation | 2h | Frontend | ☐ Pending |
| 32 | Robots.txt | 30m | Frontend | ☐ Pending |
| 33 | Open Graph / Twitter cards | 2h | Frontend | ☐ Pending |
| 34 | Breadcrumb navigation | 2h | Frontend | ☐ Pending |
| 35 | WCAG 2.1 AA audit and fixes | 4h | Frontend | ☐ Pending |
| 36 | Keyboard navigation testing | 2h | Frontend | ☐ Pending |
| 37 | Screen reader testing | 2h | Frontend | ☐ Pending |

**Phase 3 Total: ~20h**

### Phase 4: Deployment & CI/CD (Week 4)

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 38 | Create `.dockerignore` | 30m | DevOps | ☐ Pending |
| 39 | Create API deployment workflow | 3h | DevOps | ☐ Pending |
| 40 | Create production Docker Compose | 2h | DevOps | ☐ Pending |
| 41 | Create `.env.production` template | 1h | DevOps | ☐ Pending |
| 42 | Add E2E test job to CI | 3h | DevOps | ☐ Pending |
| 43 | Add test coverage reporting | 1h | DevOps | ☐ Pending |
| 44 | Production deploy dry-run | 2h | DevOps | ☐ Pending |

**Phase 4 Total: ~12h**

### Phase 5: Integration Testing (Week 4-5)

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 45 | Frontend ↔ API integration testing | 4h | QA | ☐ Pending |
| 46 | Search end-to-end testing | 2h | QA | ☐ Pending |
| 47 | Import pipeline testing with real data | 3h | QA | ☐ Pending |
| 48 | Scoring pipeline testing | 2h | QA | ☐ Pending |
| 49 | Performance testing (load, stress) | 4h | QA | ☐ Pending |
| 50 | Security testing (auth, RBAC, injection) | 3h | QA | ☐ Pending |

**Phase 5 Total: ~18h**

---

## P1: Should Complete Before Launch

### Backend Improvements

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 51 | Import: Implement merge strategy | 3h | Backend | ☐ Pending |
| 52 | Import: Add batch inserts (unnest/VALUES) | 4h | Backend | ☐ Pending |
| 53 | Import: Add dry-run mode | 2h | Backend | ☐ Pending |
| 54 | Import: Add duplicate detection | 2h | Backend | ☐ Pending |
| 55 | Search: Wire RankingEngine into service | 3h | Backend | ☐ Pending |
| 56 | Search: Integrate synonyms into queries | 2h | Backend | ☐ Pending |
| 57 | Search: Add rate limiting to endpoints | 1h | Backend | ☐ Pending |
| 58 | Search: Add result snippets/highlights | 3h | Backend | ☐ Pending |
| 59 | Scoring: Make `scoreAll()` limit configurable | 1h | Backend | ☐ Pending |
| 60 | Scoring: Use error classes for proper handling | 2h | Backend | ☐ Pending |
| 61 | Database: Create `v_brand_detail` view | 2h | DB | ☐ Pending |
| 62 | Database: Create `v_search_result_detail` view | 2h | DB | ☐ Pending |
| 63 | Backend: Add `pnpm audit` to CI | 1h | DevOps | ☐ Pending |
| 64 | Backend: Log failed auth attempts | 1h | Backend | ☐ Pending |
| 65 | Backend: Validate request ID header | 30m | Backend | ☐ Pending |

**P1 Total: ~30h**

### Frontend Improvements

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 66 | Dark mode support | 3h | Frontend | ☐ Pending |
| 67 | About page | 2h | Frontend | ☐ Pending |
| 68 | FAQ page | 2h | Frontend | ☐ Pending |
| 69 | Footer with links | 2h | Frontend | ☐ Pending |
| 70 | Header with navigation | 2h | Frontend | ☐ Pending |

**P1 Frontend Total: ~11h**

---

## P2: Nice to Have for Launch

| # | Task | Effort | Owner | Status |
|---|------|--------|-------|--------|
| 71 | Search: Add faceted search | 6h | Backend | ☐ Pending |
| 72 | Search: Add "did you mean?" | 4h | Backend | ☐ Pending |
| 73 | Search: Add cursor-based pagination | 3h | Backend | ☐ Pending |
| 74 | Import: Add file upload endpoint | 3h | Backend | ☐ Pending |
| 75 | Import: Add progress streaming | 4h | Backend | ☐ Pending |
| 76 | Scoring: Add A/B testing for weights | 4h | Backend | ☐ Pending |
| 77 | Backend: Add request body content-type validation | 1h | Backend | ☐ Pending |
| 78 | Backend: Add Redis for shared rate limiting | 4h | DevOps | ☐ Pending |
| 79 | Monitoring: Add APM integration | 4h | DevOps | ☐ Pending |
| 80 | Monitoring: Add error tracking (Sentry) | 2h | DevOps | ☐ Pending |

**P2 Total: ~31h**

---

## P3: Future Improvements (Post-Launch)

### Backend

| # | Task | Effort | Description |
|---|------|--------|-------------|
| 81 | Role hierarchy model | 4h | Support super_admin inheriting admin |
| 82 | CSRF protection | 3h | Add CSRF tokens for cookie-based auth |
| 83 | Distributed tracing (OpenTelemetry) | 8h | Add trace context propagation |
| 84 | Request draining on SIGTERM | 2h | Add preStop hook, drain period |
| 85 | Table partitioning | 8h | Partition search_logs, audit_logs, score_history |
| 86 | Cache information_schema lookup | 2h | Use static lookup table for fn_ensure_slug |
| 87 | Scoring: ML-based scoring | 20h | Train model on product data |
| 88 | Scoring: User feedback loop | 8h | Add click-through tracking |
| 89 | Scoring: Country-specific scoring | 12h | Different weights per region |
| 90 | Search: Elasticsearch/Meilisearch swap | 16h | Use SearchProvider interface |

### Frontend

| # | Task | Effort | Description |
|---|------|--------|-------------|
| 91 | Admin dashboard (apps/admin/) | 20h | Build admin UI for import management |
| 92 | User accounts/profiles | 12h | Add user registration and profiles |
| 93 | Product comparison | 8h | Side-by-side product comparison |
| 94 | Product recommendations | 8h | "Similar products" and "healthier alternatives" |
| 95 | Notification system | 6h | Price drop / recall alerts |
| 96 | Multi-language support (i18n) | 12h | Support multiple locales |
| 97 | Progressive Web App (PWA) | 8h | Add service worker, manifest |
| 98 | Performance optimization (Lighthouse > 90) | 8h | Bundle analysis, code splitting |

### DevOps

| # | Task | Effort | Description |
|---|------|--------|-------------|
| 99 | Redis for rate limiting and caching | 4h | Add Redis service to compose |
| 100 | CDN for static assets | 2h | Configure Cloudflare or similar |
| 101 | Kubernetes manifests | 8h | Create Helm charts or k8s manifests |
| 102 | Blue-green deployment | 4h | Zero-downtime deployments |
| 103 | Canary deployments | 4h | Gradual rollout strategy |
| 104 | Database migration tooling | 4h | Add versioned migrations |

---

## Timeline Summary

```
Week 1:    Backend Hardening (P0 Phase 1) — 8h remaining
Week 2-3:  Frontend Foundation (P0 Phase 2) — 42h
Week 3-4:  SEO & Accessibility (P0 Phase 3) — 20h
Week 4:    Deployment & CI/CD (P0 Phase 4) — 12h
Week 4-5:  Integration Testing (P0 Phase 5) — 18h
Week 5-6:  P1 Improvements — 41h
Week 6-8:  P2 Nice-to-Haves — 31h
Post-Launch: P3 Future — 100h+
```

**Total P0: ~112h (2-3 weeks)**
**Total P0+P1: ~153h (3-4 weeks)**
**Total P0+P1+P2: ~184h (4-5 weeks)**

---

## Definition of Done — MVP Launch

- [ ] All P0 tasks completed
- [ ] All P0 checklist items passing
- [ ] Frontend deployed to Vercel
- [ ] API deployed to production
- [ ] Database migrated to production Supabase
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Security audit passed
- [ ] Performance benchmarks met (LCP < 2.5s, FID < 100ms, CLS < 0.1)

---

> **Decision Point:** After P0 Phase 5, evaluate whether to proceed with P1 or launch with current scope.
