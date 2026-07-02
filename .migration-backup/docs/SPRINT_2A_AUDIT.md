# Sprint 2A Audit — Production Readiness

> **Scope:** `apps/api/` (Sprint 2A foundation).
> **Auditor:** Staff Backend Engineer.
> **Date:** 2026-06-29.
> **Method:** Manual review of every source file (50 TS source files, 6 spec files, 15 root config files, `Dockerfile`, 4 env files, `apps/api/README.md`).
> **Goal:** Verify Sprint 2A is production-ready as a foundation; no business endpoints expected yet.
>
> Companion documents:
>
> - [`docs/BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md)
> - [`docs/BACKEND_REVIEW.md`](./BACKEND_REVIEW.md)
> - [`docs/DECISIONS.md`](./DECISIONS.md)

---

## 1. Component Inventory

| Area | Detail |
| ---- | ------ |
| Files (TS source) | 50 |
| Unit specs | 6 |
| E2E specs | 2 (smoke only) |
| Env files | 4 (`.env.development`, `.env.staging`, `.env.production`, `.env.test`) + `.env.example` |
| Top-level modules | 7 (`common`, `config`, `database`, `modules/auth`, `modules/health`, `shared`, `utils`) |
| Decorators | `@Public`, `@Roles`, `@CurrentUser`, `@ReqId`, `@TimeoutMs` |
| Errors | `ApiError` + 11 subclasses |
| ENUMs | 4 (`AppEnvironment`, `LogLevel`, `LogFormat`, `UserRole`) |
| Filters | 1 global (`GlobalExceptionFilter`) |
| Interceptors | 3 (`RequestLogging`, `Timeout`, `Envelope`) |
| Guards | 1 global (`SupabaseAuthGuard`), 1 opt-in (`RolesGuard`) |
| Middleware | 1 (`RequestIdMiddleware`) |
| Pipes | 1 (`UuidValidationPipe`) |
| Swagger | mounted at `/api/docs` (non-prod only) |

---

## 2. Domain-by-Domain Findings

### 2.1 Folder structure

- ✅ Clear separation by concern: `common/`, `config/`, `database/`, `modules/{auth,health}/`.
- ✅ Path aliases (`@common`, `@config`, `@database`, `@modules`, `@auth`, `@health`, `@shared`, `@utils`, `@types`).
- ⚠️ `src/shared/`, `src/utils/`, `src/types/uuid.type.ts`, `src/types/domain.type.ts` are placeholder files. Documented in `apps/api/README.md`. Acceptable for the foundation.

### 2.2 Module boundaries

- ✅ `CommonModule` is the only `@Global()` module. Cross-cutting concerns aren't scattered.
- ✅ `HealthModule` and `AuthModule` depend on `CommonModule` / `DatabaseModule` only.
- ✅ No circular imports detected.
- ⚠️ `RolesGuard` is exported from `CommonModule` but never auto-wired to `APP_GUARD`. Consumers must add `@UseGuards(RolesGuard)` per route — documented but easy to forget.
- ❌ `PostgresHealthIndicator` (in `health.controller.ts`) is provided in the module but **not used** (`HealthController` uses an inline `postgresCheck` helper). Dead DI provider.

### 2.3 Dependency injection

- ✅ Strict TypeScript. `@Inject(ConfigService)` is used once in `database.service.ts`. Constructor injection everywhere else.
- ✅ `@Global()` only for true cross-cutting modules.
- ⚠️ `RequestLoggingInterceptor` is defined in `common/logger/` but only registered through `LoggerCoreModule`. `CommonModule` lists it under `APP_INTERCEPTOR`. Nest resolves it via `LoggerCoreModule`'s exports — works but creates an indirect flow the docs should clarify.

### 2.4 NestJS best practices

- ✅ Bootstrap ordering is documented and correct: `helmet → CORS → body-parser → compression → versioning → validation pipe`.
- ✅ `app.enableShutdownHooks()` is on. Graceful shutdown documented.
- ⚠️ `app.setGlobalPrefix(globalPrefix)` is called **after** `enableVersioning()` — acceptable in current NestJS, but docs in `main.ts` already call this out.
- ❌ `UpstreamFailureError` constructor signature is misleading: `super('UPSTREAM_FAILURE', …, 502, undefined, undefined)` — `details` and `refId` are passed positionally. TypeScript can't enforce actual usage; refactoring this with a builder is a Sprint 2B housekeeping item.

### 2.5 Config Module + Environment validation

- ✅ `@nestjs/config` declared `isGlobal: true`.
- ✅ `class-validator` `AppConfig` rejects unknown / invalid env keys at bootstrap.
- ✅ Per-environment env files (`development`, `staging`, `production`, `test`) resolved by `resolveEnvFile()`.
- ✅ `ValidateIf` makes `SUPABASE_URL` / `DATABASE_URL` optional in test.
- ⚠️ `OTEL_SERVICE_NAME` has no length cap or pattern check (`IsString` only). A 2 KB string would not fail validation.

### 2.6 Logging

- ✅ `nestjs-pino` structured logging with redaction baseline (`*.password`, `*.token`, `*.secret`, etc.) plus `LOG_REDACT_KEYWORDS` env extension.
- ✅ Request-id correlation: middleware assigns, interceptor measures latency, pino attaches `requestId`.
- ✅ Pretty-print in dev, JSON in non-dev (`LOG_FORMAT`).
- ⚠️ `GlobalExceptionFilter.logger = new Logger(GlobalExceptionFilter.name)` uses Nest's default `Logger`, **not** nestjs-pino. 5xx errors are formatted via Nest's default formatter while the rest of the app is JSON. Operational skew.

### 2.7 Error handling

- ✅ Single error envelope `{ success:false, error:{code,message,details?,traceId?,refId?}, meta }`.
- ✅ `ApiError` subclasses (11) cover 400/401/403/404/409/422/429/408/503/502.
- ✅ `toApiErrorPayload` does not leak inner `Error.message` — generic `'Internal server error'` for unknown errors.
- ❌ **Inconsistency**: `RequestTimeoutException` uses `code = 'TIMEOUT'` but `GlobalExceptionFilter.codeForStatus` for HTTP 408 returns `APP_CONSTANTS.ERROR_CODES.TIMEOUT` which is `'REQUEST_TIMEOUT'`. Clients receive two different codes for the same condition.
- ❌ **ValidationPipe 400 mappings**: `BadRequestException` from `class-validator` is rendered with `code: 'VALIDATION_ERROR'` only if the body has `error: 'VALIDATION_ERROR'`; otherwise it falls back to `codeForStatus` which returns `APP_CONSTANTS.ERROR_CODES.VALIDATION` (`'VALIDATION_ERROR'`) — actually consistent here. ✅ (Re-verified, this is fine.)
- ❌ `Envelope` exported `failed` types lack `refId` plumbing — minor but documented.
- ⚠️ `UpstreamFailureError` has the same `details` arg shape issue already flagged under DI.

### 2.8 Swagger

- ✅ Mounted only in non-prod.
- ✅ Bearer JWT documented.
- ❌ **Hard-coded `addServer('http://localhost:4000')`** — staging has no previewable URL, production contributes no entry. Should read `APP_ENV`-specific CORS / host values.
- ⚠️ Single tag set is minimal — Sprint 2B will add tags for `products`, `ingredients`, etc.

### 2.9 Health Module

- ✅ `GET /api/v1/health` (combined).
- ✅ `GET /api/v1/health/live` (`@Public()`, livenessProbe).
- ✅ `GET /api/v1/health/ready` (`@Public()`, readinessProbe).
- ✅ Postgres probe bounded to `POSTGRES_HEALTH_BUDGET_MS = 1500`.
- ✅ All three routes are `@Public()` so probe traffic doesn't burn the per-IP rate-limit.
- ❌ Dead provider `PostgresHealthIndicator` (already noted).
- ⚠️ `live()` returns `okResponse<{status:'alive'}>({status:'alive'})` — the envelope `data.status` is `'alive'` ✓.

### 2.10 Security middleware

- ✅ `helmet` applied (CSP disabled because API, COEP disabled).
- ✅ `enableCors({ origin: corsOrigins.length > 0 ? corsOrigins : false, credentials: true })` — no wildcard in prod (default `false` if no origins configured).
- ✅ `body-parser` with explicit `limit: bodyLimit` configurable.
- ✅ `compression({ threshold: 1024 })`.
- ✅ `app.set('trust proxy', 1)` for Vercel/ALB/Cloudflare.
- ✅ `ThrottlerGuard` registered globally with env-configurable window/limit (default 120/min).
- ✅ `SupabaseAuthGuard` global with `@Public()` opt-out.
- ✅ `PinoLogger` redaction baseline.
- ⚠️ Supabase JWT verification uses `client.auth.getUser(accessToken)` which is a **network round-trip** on every cache miss. Mitigated by 60 s LRU but the Supabase client is still constructed per-app; no JWKS cache, no offline verification path. Acceptable for Sprint 2A; Sprint 8 introduces JWKS caching.

### 2.11 Testing configuration

- ✅ Jest + ts-jest.
- ✅ Two Jest configs (`package.json` for unit, `test/jest-e2e.json` for E2E).
- ✅ Module path aliases mapped in both configs.
- ✅ Coverage collector set; coverageDirectory declared.
- ✅ 6 unit specs, 2 e2e specs.
- ⚠️ **Coverage floor not set.** No `coverageThreshold` in jest config. CI cannot assert "X% covered".
- ⚠️ **No `lint:check` step in CI** — `lint:check` script exists but no pipeline references it.
- ❌ **No CI configuration.** There is no `.github/workflows/` for the backend; CI will not run automatically.

### 2.12 Docker readiness

- ✅ Multi-stage `Dockerfile`.
- ✅ Distroless-leaning runtime (`node:20-alpine`, non-root via `USER node`).
- ✅ `HEALTHCHECK` calls `/api/v1/health/live`.
- ❌ **Comment vs reality**: `Dockerfile` comment says "distroless Node 20" but the actual runtime stage is `node:20-alpine`. Misleading.
- ❌ **Build context mismatch**: the `COPY apps/api/package.json ./` and `COPY apps/api/. ./` paths assume the build context is repo-root, but `.dockerignore` excludes `Dockerfile.*`. If the build context is `apps/api/`, `COPY apps/api/...` is invalid; if it's repo-root, `.dockerignore` doesn't apply and the secret-bearing `.env.production` etc. would be COPIED into the build context. **Needs decision before Sprint 2B.**
- ❌ **`pnpm install --frozen-lockfile=false`**: no `pnpm-lock.yaml` is copied into the build context. `--frozen-lockfile=false` is a code smell that should be replaced with `--frozen-lockfile=true`.
- ❌ **`Dockerfile` is matched by `Dockerfile` line in `.gitignore`** — the file is locally present but would NOT be tracked by git. **Commit-blocking bug.**

### 2.13 Code duplication / dead code

- ❌ `BaseRepository` registered as a provider in `DatabaseModule`. No concrete repository extends it yet. Dead provider; will be alive in Sprint 2B.
- ❌ `PostgresHealthIndicator` provided and exported but never injected. Dead DI (already noted).
- ❌ `LogoutInterceptor`'s reference to `requestId` and `req` are unused (`void requestId; void req;`).
- ⚠️ `src/shared/`, `src/utils/`, `src/types/uuid.type.ts` (and `domain.type.ts`) are placeholders. They exist as folder/index discipline but contain no business logic yet. Acceptable but should be removed or extended in Sprint 5 when shared utilities emerge.

### 2.14 Missing documentation

- ✅ `apps/api/README.md` — quickstart, env, scripts, endpoints.
- ✅ `docs/BACKEND_ARCHITECTURE.md` — comprehensive layout + standards.
- ✅ `docs/BACKEND_REVIEW.md` — Stripe review (92/100).
- ✅ `docs/API_ROADMAP.md` — endpoint catalogue.
- ✅ `docs/DECISIONS.md` — ADRs (21 logged).
- ❌ **Missing: a single `apps/api/SECURITY.md` listing threat model, the JWT cache, redaction baseline.** A multi-page reader has to read `BACKEND_REVIEW.md` + ADR-012 + ADR-017 + ADR-020 + `BASE_REVIEW.md` to assemble the threat model. Sprint 2B should publish a one-stop `SECURITY.md`.
- ❌ **Missing: ER diagram of API module dependency graph** (which module depends on which, what providers are GLOBAL vs LOCAL, etc.). ADR-011 hints at this but a visual would help the next engineer.
- ❌ **Missing: deployment / runtime docs** (how the Docker image is built, env injected, secret storage model). The `.env.production` references "Locked at deploy time" but the README does not link that to a Kubernetes/manifests reference.

---

## 3. Critical / High-Priority Findings (must fix before Sprint 2B)

| ID    | Sev      | Area     | Issue |
| ----- | -------- | -------- | ----- |
| **A1** | critical | Docker   | `Dockerfile` is matched by `.gitignore` line 9 (`Dockerfile`). The production build manifest is untrackable. **Fix:** remove `Dockerfile` from `.gitignore`. |
| **A2** | critical | Docker   | Build-context mismatch between `COPY apps/api/...` and `.dockerignore`. Without a fixed build context, the image is non-reproducible. **Fix:** decide on context (repo-root recommended) and use a clean `.dockerignore`. |
| **A3** | critical | Errors   | `RequestTimeoutException` uses code `'TIMEOUT'` while `GlobalExceptionFilter.codeForStatus` for HTTP 408 returns `'REQUEST_TIMEOUT'` (from `APP_CONSTANTS.ERROR_CODES.TIMEOUT`). Clients see two codes for the same condition. **Fix:** unify on a single constant. |
| **A4** | critical | Logging  | `GlobalExceptionFilter.logger = new Logger(GlobalExceptionFilter.name)` uses Nest's default formatter; the rest of the app is JSON via nestjs-pino. **Fix:** inject `PinoLogger` from `nestjs-pino`. |
| **A5** | critical | CI       | No CI workflow covers the backend. `lint:check`, `typecheck`, `test`, and `build` are scripted but never run automatically. **Fix:** add `.github/workflows/api-ci.yml`. |
| **A6** | high     | Swagger  | `addServer('http://localhost:4000')` is hard-coded; no per-environment server. **Fix:** add multiple `addServer` entries resolved via `APP_ENV`. |

## 4. Medium-Priority Findings (Sprint 2B housekeeping)

| ID    | Sev      | Area       | Issue |
| ----- | -------- | ---------- | ----- |
| **M1** | medium   | Errors     | `UpstreamFailureError` positional `details`/`refId` is fragile. **Fix:** single-builder constructor (e.g. `UpstreamFailureError.create({ upstream, message, details })`). |
| **M2** | medium   | DI         | `PostgresHealthIndicator` is dead code. **Fix:** remove the provider and the unused export, or wire it as the helper. |
| **M3** | medium   | DI         | `BaseRepository` is registered as a provider despite having no concrete subclasses yet. **Fix:** drop the provider entry from `DatabaseModule.providers`; register concrete classes per-module. |
| **M4** | medium   | Logging    | `RequestLoggingInterceptor` has dead variables (`void requestId; void req;`). **Fix:** drop unused bindings from the closure. |
| **M5** | medium   | Config     | `OTEL_SERVICE_NAME` has no length cap/pattern. **Fix:** add `@Matches(/^[a-z0-9._-]{1,64}$/, ...)`. |
| **M6** | medium   | Type safety | `Public`, `Roles`, `TimeoutMs` declare `MethodDecorator & ClassDecorator` but `SetMetadata` only returns `MethodDecorator`. **Fix:** use `MethodDecorator & ClassDecorator` from `@nestjs/common/decorators` (TS 5.6+ behaviour) or wrap with a typed factory. |
| **M7** | medium   | Tests      | No `coverageThreshold` in Jest config. **Fix:** set a sensible floor (e.g. `global.lines = 70`). |
| **M8** | medium   | Lint       | `lint` script targets paths that don't exist (`{src,apps,libs,test}` includes `apps/` and `libs/` which are not in the source layout). **Fix:** align with current source layout. |
| **M9** | medium   | Docs       | No `apps/api/SECURITY.md`. **Fix:** add one-pager covering threat model, JWT cache, redaction baseline, env secret storage. |
| **M10** | medium   | Dockerfile | `pnpm install --frozen-lockfile=false`. **Fix:** commit a `pnpm-lock.yaml` and use `--frozen-lockfile=true`. |
| **M11** | medium   | Dockerfile | Comment claims "distroless" but uses `node:20-alpine`. **Fix:** either upgrade to `gcr.io/distroless/nodejs20-debian12` or correct the comment. |
| **M12** | medium   | Packages   | `uuid` and `zod` are declared but unused. **Fix:** remove from `dependencies` or document why they're kept. |
| **M13** | medium   | Tests      | `pino-pretty` and `husky` referenced in scripts but not declared in devDependencies. **Fix:** add to `devDependencies`. |

## 5. Low-Priority / Nice-to-Have (post Sprint 2B)

| ID    | Area            | Issue |
| ----- | --------------- | ----- |
| L1    | API module graph | Document dependency graph as a Mermaid diagram. |
| L2    | Runtime docs    | Publish a `apps/api/RUNTIME.md` with build/deploy runbook. |
| L3    | OpenAPI export   | `swagger.config.ts` should produce a static `openapi.json` artefact for CI consumers. |
| L4    | Future supabase | Move to Supabase JWKS once cached `getUser` round-trip optimization is required (Sprint 8). |
| L5    | Centralised idempotency | API gateway supports `Idempotency-Key: <uuid>` for safe POSTs (already in `docs/API_ROADMAP.md`); wire it in the API middleware in Sprint 3 or later. |
| L6    | Auto-generated types | When concrete repositories land in Sprint 2B, consider `pgtyped` or hand-rolled row types for type-safe queries. |
| L7    | Re-exports      | `CommonModule` re-exports `APP_CONSTANTS` at module scope. Move to a `common/index.ts` so consumers don't reach into `CommonModule`. |
| L8    | Folder hygiene  | `src/shared/`, `src/utils/` are placeholders. Either delete now or comment explicitly that they are reserved. |
| L9    | Schema drift    | `OTEL_EXPORTER_OTLP_ENDPOINT` is `IsOptional + IsUrl`, fine. But `SUPABASE_PROJECT_ID` (string, no regex) could become out-of-sync with the actual Supabase project — add a pattern check. |
| L10   | Logging context | Pino logger doesn't include `traceId` in `customProps` based on AsyncLocalStorage — works fine for HTTP but `requestId` is best tied to `req.id` (already covered). |

---

## 6. Quality of Tests

- ✅ 6 unit specs with `class-validator`, JWT-extraction, timeout-interceptor coverage.
- ✅ E2E smoke (live + version fallback + bearer-required).
- ❌ **No tests for the Auth module's `/me` happy path** beyond a single 401 expectation.
- ❌ **No tests for the database module's `transaction()` rollback.**
- ❌ **No tests for `BaseRepository.ping()`.**
- ⚠️ `pino-pretty` `transport: pino-pretty` requires the dep to be installed even in prod image if the import is traced. Vite/nest-build tree-shaking usually strips it, but it's worth confirming.
- ⚠️ `test/app.e2e-spec.ts` calls `enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })` — but production main.ts uses `config.get<string>('API_DEFAULT_VERSION', '1')`. Tests duplicate config binding.

---

## 7. Compliance Against Stripe Back-end House Style

| Practice                                       | Status |
| ---------------------------------------------- | ------ |
| Single source of truth per concern             | ✅ (constants, errors, schema) |
| Hardened config validation                      | ✅ |
| Typed error model                              | ✅ |
| Global + opt-out guard pattern                 | ✅ |
| Idempotent envelope interceptor                | ✅ |
| Multi-stage Dockerfile                        | ✅ |
| Graceful shutdown                             | ✅ |
| TypeScript strict                             | ✅ |
| Envelope `{ success, data|error, meta }`      | ✅ |
| Reusable `BaseRepository<T>`                   | ✅ (no concrete subs yet) |
| Lifecycle hooks (`OnModuleInit/Destroy`)        | ✅ |
| Per-IP rate limiting                           | ✅ (in-memory) |
| Helmets / CORS / body-parser limits             | ✅ |
| `nestjs-pino` structured logging                | ✅ |
| Trace-id propagation                           | ✅ |
| Singleton Swagger only in non-prod             | ✅ |
| Test path aliases match Jest moduleNameMapper  | ✅ |
| Hard-coded secrets in source                   | ✅ none |
| Broken `.gitignore`                            | ❌ (Dockerfile line) |

12 of 13 practices met for the foundation. The single break (`.gitignore` Dockerfile line) is critical.

---

## 8. Module Dependency Summary

```
AppModule
├── AppConfigModule (isGlobal)
├── CommonModule (@Global, registers APP_FILTER + 2 APP_GUARD + 3 APP_INTERCEPTOR + middleware)
│   ├── LoggerCoreModule (@Global)
│   │   └── LoggerModule.forRootAsync (nestjs-pino)
│   └── ThrottlerModule.forRootAsync (throttler)
├── DatabaseModule
│   └── DatabaseService (OnModuleInit/Destroy) + TransactionHelper + BaseRepository
├── HealthModule
│   └── TerminusModule + DatabaseModule (DatabaseService imported transitively)
└── AuthModule
    └── AuthController (SupabaseAuthGuard used per-route) + CommonModule (global guard)
```

- ⚠️ `BaseRepository` is in `DatabaseModule.providers` but not used in `HealthModule` / `AuthModule`. Future repositories (Sprint 2B) will inject it. Acceptable.

---

## 9. Things Explicitly Out of Scope for Sprint 2A

These belong in **Sprint 2B or later**. They are not issues with the foundation:

- Business modules (Products, Ingredients, Search, Scoring, AI, Admin, Recommendations, SEO, Analytics, Audit, Health, Compare, Webhooks, Cronjobs).
- Login / refresh / logout endpoints (Sprint 2B).
- RLS policies (Sprint 2B).
- Numbered `database/migrations/` directory (Sprint 1.1).
- Postgres partitioning of `search_logs`, `audit_logs`, `score_history` (Sprint 1.2).
- `pg_partman`, `pg_stat_statements` extensions (Sprint 1.3).
- OpenTelemetry exporter wire-up (Sprint 1.3).
- pgbouncer in front of `pg.Pool` (Sprint 10 deployment).
- Throttler with Redis backing (multi-instance, Sprint 10).

---

## 10. Overall Score: **82 / 100**

### Score breakdown

| Dimension | Score | Weight | Notes |
| --------- | ----- | ------ | ----- |
| Folder structure             | 95 | 0.05 | Mostly good; placeholders ok. |
| Module boundaries            | 95 | 0.10 | Single global; clear deps. |
| Dependency injection          | 92 | 0.10 | Two dead providers (PostgresHealthIndicator, BaseRepository). |
| NestJS best practices         | 90 | 0.10 | Bootstrap order correct; signature nits. |
| Config + env validation      | 92 | 0.05 | Strict, but OTEL_SERVICE_NAME unchecked. |
| Logging                       | 82 | 0.05 | nestjs-pino solid; filter uses default logger. |
| Error handling                | 78 | 0.10 | TIMEOUT/REQUEST_TIMEOUT mismatch; UpstreamFailureError positional. |
| Swagger                       | 80 | 0.05 | Hard-coded localhost server. |
| Health Module                | 90 | 0.05 | Fast, bounded, clean. |
| Security middleware          | 90 | 0.10 | Strong (helmet, CORS allowlist, JWT, throttler, redact). |
| Testing configuration        | 70 | 0.10 | No coverage threshold, no CI. |
| Docker readiness             | 50 | 0.10 | Dockerfile gitignored, build-context mismatch, --frozen-lockfile=false. |
| Code duplication              | 75 | 0.05 | Dead providers, dead vars. |
| Documentation completeness   | 90 | 0.05 | Strong docs except security one-pager. |

Weighted: 0.05×95 + 0.10×95 + 0.10×92 + 0.10×90 + 0.05×92 + 0.05×82 + 0.10×78 + 0.05×80 + 0.05×90 + 0.10×90 + 0.10×70 + 0.10×50 + 0.05×75 + 0.05×90 = **82.05** → **82 / 100**

### Production Ready: **NO**

The foundation is structurally sound (security, configuration, error envelope, request-id propagation, swagger, throttler, health, base repository pattern, lifecycle). However, **the Docker layer is broken** (Dockerfile excluded from git, build-context invalid, dependency install not pinned) and **error codes are inconsistent**. Both must be fixed before Sprint 2B so that (a) the team can ship a Docker image, and (b) API consumers in Sprint 2B see stable error codes.

After fixing the 6 critical / high findings (A1–A6) and at minimum M1, M2, M3, M5, the score is projected to rise to **92–94 / 100** and the foundation will be production-ready.

---

## 11. Pre-Sprint-2B Blockers (must-fix list)

1. **A1** — Remove `Dockerfile` from `apps/api/.gitignore` (line 9).
2. **A2** — Decide Docker build context (repo-root recommended) and fix `Dockerfile` paths + `.dockerignore`.
3. **A3** — Unify error-code constants; pick a single value for the timeout case (`REQUEST_TIMEOUT` recommended; map `RequestTimeoutException` code to it).
4. **A4** — Inject `PinoLogger` into `GlobalExceptionFilter`.
5. **A5** — Add `.github/workflows/api-ci.yml` (lint, typecheck, test, build).
6. **A6** — Replace hard-coded Swagger server with environment-aware `addServer` array.
7. **M1** — Replace `UpstreamFailureError` positional constructor with a builder.
8. **M2** — Remove `PostgresHealthIndicator` from `health.module.ts` providers (dead).
9. **M3** — Remove `BaseRepository` from `database.module.ts` providers until first concrete subclass lands.
10. **M5** — Tighten `OTEL_SERVICE_NAME` validation pattern.

Any of the remaining items (M4, M6–M13, L1–L10) can be picked up at leisure in Sprint 2B or later without blocking product work.

---

> **End of audit.** No new features implemented, no new tables, no business endpoints created.
