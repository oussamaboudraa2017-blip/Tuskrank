# Tuskrank — Backend Architecture (Sprint 2A)

> Scope: **Backend foundation only.** No business logic, no Products/Search/Scoring/AI.
>
> This document explains the structure that every future module will plug into, the dependency flow, coding standards, and the planned scalability trajectory.

---

## 1. High-Level Overview

Tuskrank's backend is a **monorepo-hosted NestJS application** that lives in `apps/api`. It is intentionally opinionated toward:

- **Single global AuthGuard** (Supabase JWT) — opt-out via `@Public()`.
- **Single repository pattern** (`BaseRepository<T>`) — every module's data access goes through it.
- **Single error envelope** (`{ success, error, meta }`) returned by every endpoint.
- **Single response envelope** (`{ success, data, meta }`) for non-paginated payloads.
- **Single request-id propagator** (header + log field + child error payloads).

All cross-cutting concerns are implemented once in the `common/` module and reused.

---

## 2. Folder Structure

```
apps/api/
├── src/
│   ├── main.ts                            # Bootstrap (Helmet, CORS, bodyparser, versioning, Swagger, etc.)
│   ├── app.module.ts                      # Top-level composition
│   │
│   ├── config/                            # @ConfigModule — env loading, validation
│   │   ├── app.config.ts                  #   AppConfig class (class-validator)
│   │   ├── config.module.ts               #   isGlobal @nestjs/config
│   │   └── config.module.spec.ts
│   │
│   ├── common/                            # Cross-cutting concerns (@Global)
│   │   ├── common.module.ts               #   wires exception filter, interceptors, guards, middleware
│   │   │
│   │   ├── constants/                     #   APP_CONSTANTS (pagination, error codes, header names)
│   │   ├── enums/                         #   AppEnvironment, LogLevel, LogFormat, UserRole
│   │   ├── entities/                      #   BaseEntity / TimestampedEntity
│   │   ├── errors/                        #   ApiError hierarchy + toApiErrorPayload
│   │   ├── dto/                           #   ApiResponseDto, PaginationDto, helpers
│   │   ├── filters/                       #   GlobalExceptionFilter
│   │   ├── guards/                        #   SupabaseAuthGuard, RolesGuard
│   │   ├── decorators/                    #   @Public, @Roles, @CurrentUser, @ReqId, @TimeoutMs
│   │   ├── interceptors/                  #   EnvelopeInterceptor, TimeoutInterceptor
│   │   ├── logger/                        #   nestjs-pino configuration + module + interceptor
│   │   ├── middleware/                    #   RequestIdMiddleware
│   │   ├── pipes/                         #   UuidValidationPipe
│   │   ├── swagger/                       #   Swagger mount helper
│   │   └── throttler/                     #   @Global rate limiter (memory store)
│   │
│   ├── database/                          # Supabase Postgres pool, Tx helper, repo base
│   │   ├── database.module.ts             #   DatabaseModule (@Global)
│   │   ├── database.service.ts            #   Pool, query(), transaction(), healthcheck()
│   │   ├── transaction.helper.ts
│   │   └── base.repository.ts             #   BaseRepository<T> — canonical building block
│   │
│   ├── modules/                           # Feature modules
│   │   ├── auth/                          #   Supabase JWT verification scaffolding
│   │   │   ├── auth.controller.ts         #   GET /api/v1/auth/me (scaffold; login in Sprint 2B)
│   │   │   ├── auth.module.ts
│   │   │   └── dto/me.dto.ts
│   │   │
│   │   └── health/                        #   Liveness + readiness
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   │
│   ├── shared/                            # Cross-application helpers (reserved, empty in Sprint 2A)
│   ├── utils/                             # Pure utilities (reserved, empty in Sprint 2A)
│   └── types/                             # Branded primitive types (Uuid, Iso8601, HttpUrl, Json)
│
├── test/                                  # E2E / smoke tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── config files
│   ├── package.json                       # NestJS deps, pnpm @ 9.15.0, jest
│   ├── tsconfig.json                      # strict TS, paths aliases (@common, @config, …)
│   ├── tsconfig.build.json                # Excludes test/spec
│   ├── nest-cli.json                      # deletes dist on build
│   ├── .eslintrc.json                     # TS-ESLint + Prettier
│   ├── .prettierrc.json
│   ├── .gitignore
│   ├── .dockerignore
│   ├── Dockerfile                         # Multi-stage distroless Node 20
│   │
│   └── env files
│       ├── .env.example                   # documented template, committed
│       ├── .env.development               # local dev (not committed)
│       ├── .env.staging                   # staging
│       └── .env.production                 # production
│
└── README.md                              # quickstart (added in a later pass)
```

---

## 3. Dependency Flow

```
                  ┌─────────────────────────────────┐
                  │           clients              │
                  │  (web admin Vercel + curl)     │
                  └────────────────┬────────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │  Helmet + CORS          │
                       │  BodyParser limits      │
                       │  Compression            │
                       │  RequestIdMiddleware    │
                       │  nestjs-pino logger     │
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │  Routing / Versioning  │
                       │  /api/v1/...           │
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │  SupabaseAuthGuard     │
                       │  ThrottlerGuard        │
                       │  ValidationPipe        │
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │  TimeoutInterceptor    │
                       │  EnvelopeInterceptor   │
                       │  RequestLoggingInter.  │
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │  Module                │
                       │  AuthModule / Health   │
                       │  (Products/Search/…    │
                       │  land in Sprint 2B+)  │
                       └───────────┬────────────┘
                                   │
                       ┌───────────▼────────────┐
                       │  Service / Repository  │
                       │  DatabaseService       │
                       │  BaseRepository<T>     │
                       └───────────┬────────────┘
                                   │
                                   │ pg (pool)
                                   ▼
                            Supabase Postgres
                          (Tuskrank 39 tables —
                              Sprint 1.x)
```

`common/` is `@Global()`. Each module imports `CommonModule` for cross-cutting providers.

---

## 4. Module Responsibilities

### 4.1 `AppModule`

Composes the entire application. The only place that imports every other module.

### 4.2 `AppConfigModule`

- Loads `.env.{development,staging,production,test}` based on `NODE_ENV`.
- Validates env vars through `class-validator` (`AppConfig` class). Bad config **fails bootstrap** — never silently proceeds.
- Exposes the validated `ConfigService`.

### 4.3 `CommonModule`

- Global exception filter (`GlobalExceptionFilter`) → uniform `{ success:false, error:{...} }`.
- Request ID middleware (`RequestIdMiddleware`) → assigns and propagates `req.id` and the `x-request-id` header.
- Request logging interceptor (`RequestLoggingInterceptor`) → measures response time and stamps headers.
- Envelope interceptor (`EnvelopeInterceptor`) → optional default wrap of controller output (most modules do this explicitly in their controllers).
- Timeout interceptor (`TimeoutInterceptor`) → per-route timeout via `@TimeoutMs()`.
- Supabase auth guard (`SupabaseAuthGuard`) → mounted as the global APP_GUARD, opt-out with `@Public()`.
- Roles guard (`RolesGuard`) → opt-in per-route, requires `@Roles(...)`.

### 4.4 `LoggerCoreModule`

- `nestjs-pino` integration.
- Pretty-printed logs in dev, JSON logs in staging/production.
- Redaction by keyword from `LOG_REDACT_KEYWORDS`.

### 4.5 `ThrottlerCoreModule`

- Global rate-limit (per-IP).
- Default: 120 requests per 60s, configurable via env.

### 4.6 `DatabaseModule`

- Owns the `pg.Pool` lifecycle.
- Single transactional boundary (`transaction(fn)`).
- Single health probe (`healthcheck()`).
- Exposes `BaseRepository<T>` — every future repository inherits from it.
- **Sprint 2A intentionally ships NO concrete repositories.**

### 4.7 `AuthModule`

- `GET /api/v1/auth/me` — returns the resolved Supabase user.
- Login / refresh / logout endpoints land in **Sprint 2B**.

### 4.8 `HealthModule`

- `GET /api/v1/health` (combined).
- `GET /api/v1/health/live` (liveness, kube `livenessProbe`).
- `GET /api/v1/health/ready` (readiness, kube `readinessProbe`, includes Postgres probe).

---

## 5. Coding Standards

### 5.1 TypeScript

- `strict: true`, `noImplicitAny`, `strictNullChecks`, `useUnknownInCatchVariables`.
- No `any` unless annotated (`@typescript-eslint/no-explicit-any: warn`).
- No commented-out code.
- Path aliases: `@common/*`, `@config/*`, `@database/*`, `@modules/*`, `@auth/*`, `@health/*`, `@shared/*`, `@utils/*`, `@types/*`.

### 5.2 NestJS conventions

- Modules export `*Module` classes only; services and controllers are private.
- Providers are declared in `providers:`; modules use `exports:` to opt-in.
- All HTTP errors via `ApiError` subclasses (not raw `throw new Error(...)`).
- DTOs at the controller boundary use `class-validator` decorators; payloads leave the controller shaped by `okResponse(...)` or `paginatedResponse(...)`.
- Routes default to authenticated; opt-out with `@Public()`.
- Role gates opt-in via `@Roles(...)` + `@UseGuards(RolesGuard)` (RolesGuard is exported but not global).

### 5.3 Postgres

- Always `$1`-parameterised queries.
- Always wrap multi-statement mutations in `transaction()`.
- Always use `numeric`/`citext` types from schema definitions.
- Repositories never `SELECT *`; they project explicitly.

### 5.4 Logging

- `PinoLogger` from `nestjs-pino`. Never `console.log` in services.
- Always include `requestId` (auto-injected by `LoggerCoreModule`).
- Sensitive headers (`Authorization`, `Cookie`, `password`, `token`, `secret`) are redacted.

### 5.5 Error responses

Every public error response has this shape:

```jsonc
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "widget not found",
    "details": { /* optional */ },
    "traceId": "4f8d3c4c-…"
  },
  "meta": { "timestamp": "ISO-8601", "traceId": "…" }
}
```

### 5.6 Successful responses

```jsonc
{
  "success": true,
  "data": { /* payload */ },
  "meta": { "timestamp": "ISO-8601", "traceId": "…" }
}
```

Paginated responses additionally carry `data[]` and a `meta.page / meta.total / meta.hasPrev / meta.hasNext` block.

### 5.7 Branch / PR conventions

- Conventional commits (`feat(api): …`, `fix(api): …`).
- PRs require a Sprint pointer (e.g. `Sprint 2B: products module`).
- `pnpm lint && pnpm typecheck && pnpm test` must pass.

---

## 6. Scalability Strategy

| Dimension              | Current capability                                   | Forward plan |
| ---------------------- | ----------------------------------------------------- | --- |
| Database connections   | `pg.Pool` (min 2 / max 10 dev)                       | Move to Supabase Pooler + pgbouncer in front. |
| Rate limiting          | In-memory                                             | Swap in `ThrottlerStorageRedisService` for multi-instance fairness. |
| Logging                | nestjs-pino → stdout                                  | Wire OpenTelemetry exporter; forward to Datadog / CloudWatch. |
| Auth                   | Supabase JWT verification                             | Provision Supabase Auth Hooks; mint custom claims. |
| Caching                | (none in Sprint 2A)                                   | Add `@nestjs/cache-manager` with Redis, namespace by tenant. |
| Queues                 | (none)                                                | BullMQ for AI/scoring workloads. |
| Multi-region           | Single deploy                                         | Edge NestJS via Vercel / Fly.io regions; logical replication for `audit_logs`. |

---

## 7. Future Modules

| Module             | Sprint  | Note |
| ------------------ | ------- | ---- |
| Products           | 2B      | Brands, products, product_ingredients read endpoints. |
| Search             | 3       | `/v1/search/products`, `/v1/search/ingredients`. |
| Scoring            | 4       | Read + admin endpoints; writes go through `score_history`. |
| Frontend (apps/web)| 5       | Read-only public API; no CSRF (JWT). |
| Admin             | 6       | Auth-gated internal endpoints. |
| AI                 | 7       | Proxy to OpenAI / Anthropic + prompt registry. |
| SEO               | 8       | Sitemap / robots / JSON-LD endpoints. |
| Testing           | 9       | E2E suite, load test, contract tests. |
| Deployment        | 10      | CI/CD wiring, env promotion, runtime config. |

---

## 8. Routing & Versioning

- URI versioning (`/api/v1/...`).
- Default version set via `API_DEFAULT_VERSION` (defaults to `1`).
- All controllers stamped with `{ path, version: '1' }`.
- `GET /api/v2/health/live` returns 404 because `v2` is not yet enabled.
- Versioning is opt-in: a future controller can declare its own version.

---

## 9. Security Stance

- ✅ JWT verification via Supabase JWKS-aware client.
- ✅ `@Public()` decorator to opt-out of auth (used by `/health/live`, `/health/ready`, future login endpoints).
- ✅ `@Roles()` + `RolesGuard` for RBAC (opt-in).
- ✅ `helmet` headers (HSTS, X-Content-Type-Options, …).
- ✅ CORS allow-list via `CORS_ORIGINS`.
- ✅ Body size cap via `REQUEST_BODY_LIMIT`.
- ✅ Global rate limiting.
- ✅ Per-request redacted logging.
- ✅ Custom error envelope (no stack-trace leakage in prod).
- ✅ Trust-proxy enabled for Vercel/Fastly.
- ⚠️ RLS (Supabase) wired **client-side** in Postgres; this backend trusts policies but does not bypass them via `service_role` unless explicitly toggled. Audit: future modules must call **`getUser()` first** and never reach into `service_role` for user-driven reads.

---

## 10. Observability

Sprint 2A ships a thin layer:

- `nestjs-pino` for structured logging.
- `request-id` propagated from inbound `x-request-id` header into logs and error envelopes.
- `/api/v1/health/live` and `/api/v1/health/ready` for k8s probes.

OTel / traces / metrics arrive in a later sprint (`OTEL_ENABLED` env is wired but not yet producing spans).

---

## 11. Test Strategy

- Unit / integration tests: `pnpm test` (Jest, `*.spec.ts`).
- E2E / smoke: `pnpm test:e2e` (`*.e2e-spec.ts`, isolated).
- Future sprints add: contract tests between web ↔ API, load tests.

---

## 12. Local Quickstart (planned; updated when `pnpm install` lands)

```bash
# from apps/api
cp .env.example .env.development
docker compose up -d postgres          # from repo root
pnpm install
pnpm start:dev                         # http://localhost:4000

# Health
curl -s http://localhost:4000/api/v1/health/live   | jq
curl -s http://localhost:4000/api/v1/health/ready  | jq

# Docs (dev only)
open http://localhost:4000/api/docs
```

---

## 13. What's NOT in Sprint 2A

Per the sprint scope:

- No business modules (Products, Search, Scoring, AI, Admin).
- No login / refresh / logout endpoints (`AuthModule` scaffold only).
- No OpenTelemetry exporter.
- No Redis-backed rate limiting.
- No queues.
- No caching layer.
- No business repositories.

Each of these has a designated Sprint on the roadmap.
