# Tuskrank — Architecture Decision Records (ADRs)

> **Status:** Active. Each irreversible or defensible engineering choice is logged here.
> **Format:** Lightweight ADR — Context, Decision, Consequences, Alternatives considered.
> **Index:** ADRs are numbered sequentially as `ADR-NNN`.
> **Last updated:** 2026-06-29.

---

## Index

| ADR  | Title                                                        | Date         | Sprint   |
| ---- | ------------------------------------------------------------ | ------------ | -------- |
| 000  | [Governance & Repo Layout ADR Index](#adr-000--governance--repo-layout) | 2026-06-29 | Sprint 0 |
| 001  | [Tech Stack: Next.js 15 / NestJS / Supabase / Vercel](#adr-001--tech-stack)                | 2026-06-29 | Sprint 0 |
| 002  | [Monorepo Layout (apps/, packages/, docs/, database/)](#adr-002--monorepo-layout)          | 2026-06-29 | Sprint 0 |
| 003  | [Engineering OS under `.ai/`](#adr-003--engineering-os)                                   | 2026-06-29 | Sprint 0 |
| 004  | [Database Normalisation (3NF) and ENUMs in Postgres](#adr-004--database-normalisation)      | 2026-06-29 | Sprint 1 |
| 005  | [UUID v4 Primary Keys Everywhere](#adr-005--uuid-primary-keys)                             | 2026-06-29 | Sprint 1 |
| 006  | [Soft Delete (`deleted_at`) over Hard Delete](#adr-006--soft-delete)                       | 2026-06-29 | Sprint 1 |
| 007  | [Audit Log via `SECURITY DEFINER fn_write_audit`](#adr-007--audit-log)                      | 2026-06-29 | Sprint 1 / 1.x |
| 008  | [Materialised Views for Hot Aggregates (with `CONCURRENTLY`)](#adr-008--materialised-views) | 2026-06-29 | Sprint 1.x |
| 009  | [Canonical SQL Files vs Numbered Migrations (deferred)](#adr-009--migrations-deferred)     | 2026-06-29 | Sprint 1 |
| 010  | [NestJS as the Backend Framework](#adr-010--nestjs-backend)                                | 2026-06-29 | Sprint 2A |
| 011  | [Unified `{ success, data|error, meta }` Response Envelope](#adr-011--response-envelope)   | 2026-06-29 | Sprint 2A |
| 012  | [Supabase JWT as the Single Auth Mechanism](#adr-012--supabase-auth)                       | 2026-06-29 | Sprint 2A |
| 013  | [Global `SupabaseAuthGuard` with `@Public()` opt-out](#adr-013--global-auth-guard)        | 2026-06-29 | Sprint 2A |
| 014  | [Single-Source Pagination, Errors, and Constants](#adr-014--single-source)                 | 2026-06-29 | Sprint 2A |
| 015  | [Repository Pattern via `BaseRepository<T>`](#adr-015--base-repository)                    | 2026-06-29 | Sprint 2A |
| 016  | [Connect directly to Supabase Postgres via `pg` + Supabase URL](#adr-016--pg-supabase)     | 2026-06-29 | Sprint 2A |
| 017  | [`nestjs-pino` for Structured Logging + Req-ID](#adr-017--nestjs-pino)                      | 2026-06-29 | Sprint 2A |
| 018  | [URI Versioning (`/api/v1/...`) over Header Versioning](#adr-018--uri-versioning)            | 2026-06-29 | Sprint 2A |
| 019  | [Swagger only in non-Production](#adr-019--swagger-non-production)                         | 2026-06-29 | Sprint 2A |
| 020  | [Throttler wired inside `CommonModule`](#adr-020--throttler-in-common)                     | 2026-06-29 | Sprint 2A.1 |

---

## ADR-000 — Governance & Repo Layout

**Status:** Active.

**Context.** A long-running, multi-module SaaS needs a single source of truth for engineering state.

**Decision.**

- `PROJECT_STATE.md` is the **authoritative engineering snapshot**, updated at the end of every sprint.
- `CHANGELOG.md` follows **Keep a Changelog** format, with a header block listing each release.
- `TODO.md` is driven by `.ai/prompts/Sprint_NN.md` files and closed during sprint execution.
- `docs/DECISIONS.md` (this file) is the **Architecture Decision Record** log.
- `docs/API_ROADMAP.md` is the **endpoint catalogue** that the implementation must match.
- `.ai/` is the engineering operating system: `context/`, `rules/`, `prompts/`, `system/`, `reviews/`, `outputs/`.

**Consequences.** Anyone joining mid-sprint can read all four files and rebuild full project context.

**Alternatives considered.** Wikis, Notion, Linear-only project metadata. **Rejected** — source-of-truth must live next to code and be reviewable in PRs.

---

## ADR-001 — Tech Stack

**Status:** Active. Supersedes any prior "what we use" document.

**Decision.** The stack is fixed:

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui.
- **Backend:** NestJS (with class-validator, class-transformer, nestjs-pino).
- **Database:** PostgreSQL on Supabase.
- **Auth:** Supabase Auth (JWT).
- **Storage:** Supabase Storage.
- **Deployment:** Vercel (frontend); backend runtime TBD (Sprint 10).
- **Package manager:** pnpm 9.x.

**Consequences.** No deviation without an ADR. Sprint prompts reinforce this.

**Alternatives considered.** Spring Boot, Django, FastAPI — none were selected. Decided in Sprint 0.

---

## ADR-002 — Monorepo Layout

**Status:** Active.

**Decision.**

```
/
├── .ai/
├── apps/
│   ├── api/         (NestJS — Sprint 2A)
│   ├── web/         (Next.js — Sprint 5)
│   └── admin/       (Next.js — Sprint 6)
├── packages/
│   ├── ui/  types/  utils/  config/   (declared; not implemented until Sprint 5+)
├── database/
│   ├── schema.sql  indexes.sql  views.sql  functions.sql  triggers.sql  seed.sql
│   ├── README.md  DATABASE_REVIEW.md  ERD.md
├── docs/
│   ├── API_ROADMAP.md  DECISIONS.md  BACKEND_ARCHITECTURE.md  BACKEND_REVIEW.md
├── tests/   scripts/   github/
```

**Consequences.** Single repo, single CI, single dependency tree. Each app and package can have its own stack constraints.

**Alternatives considered.** Poly-repos. **Rejected** — too many lifecycle seams for a small team.

---

## ADR-003 — Engineering OS (`./.ai`)

**Status:** Active.

**Decision.** A self-contained engineering operating system lives under `.ai/` and is committed:

- `context/` — vision, mission, product, architecture, database, SEO, roadmap.
- `rules/` — coding, database, backend, frontend, SEO, security, testing.
- `prompts/` — sprint execution prompts (`Sprint_00.md` to `Sprint_10_Deployment.md`).
- `system/` — system prompt + engineering principles.
- `reviews/` — Stripe-grade review outputs (per sprint).
- `outputs/` — generated artefacts (kept empty by default).

**Consequences.** Every sprint is initiated from a `.ai/prompts/Sprint_NN.md` file. Each sprint ends with a review in `.ai/reviews/`.

**Alternatives considered.** A separate wiki / Linear project template. **Rejected** — prompt-driven execution makes the work reproducible.

---

## ADR-004 — Database Normalisation (3NF) and ENUMs in Postgres

**Status:** Active.

**Decision.**

- Schema is **3NF**: domain entities are atomic, lookup data lives in dedicated tables.
- **Closed value sets** are Postgres `ENUM` types, not `text + CHECK` columns. Closed sets include `recall_severity`, `recall_status`, `seo_page_kind`, `nutrient_bound`, `actor_type_t`, `evidence_type_t`, `protein_origin`, `nutrition_source`, `score_history_trigger`.
- **Polymorphic FKs** (`entity_type` + `entity_id`) deliberately kept off-enum in `search_keywords` / `seo_pages` — these are deliberately "unconstrained" reference IDs awaiting an open-ended entity universe.
- Denormalisations are documented and bounded (see ADR-007 for `audit_logs.diff`).

**Consequences.** Schema is portable to any Postgres 14+. ENUM values become a one-way door — adding a value to an ENUM is `ALTER TYPE ADD VALUE` and is non-reversible within the same major release.

**Alternatives considered.** Status columns as `text + CHECK`. **Rejected** — ENUMs prevent typo-insertion errors and improve planner stats.

---

## ADR-005 — UUID Primary Keys

**Status:** Active.

**Decision.** Every primary key is `uuid PRIMARY KEY DEFAULT gen_random_uuid()`. UUID v4 only (Postgres 13+ `gen_random_uuid()`).

**Consequences.** Public IDs are non-enumerable; foreign keys are stable; replicas/online migrations are safe; we trade a small index size for the safety.

**Alternatives considered.** Auto-increment `bigint` (denial); ULID/UUIDv7 considered for Sprint 17+ time-ordering migration but deferred (`uuid_ossp`/`uuidv7` Postgres 17+ extension is a future-sprint concern).

---

## ADR-006 — Soft Delete (`deleted_at`)

**Status:** Active.

**Decision.** Domain entities use a nullable `deleted_at timestamptz`. Hard delete is reserved for admin-only cleanup and GDPR-erase flows.

**Consequences.** Partial indexes are filtered to `WHERE deleted_at IS NULL`. FKs cascade **only** between rows the user explicitly deletes; soft-delete is application-driven.

**Alternatives considered.** Hard-delete with versioned audit history. **Rejected** — partial indexes + soft delete give consumers a consistent view without storing row versions.

---

## ADR-007 — Audit Log via `SECURITY DEFINER fn_write_audit`

**Status:** Active.

**Decision.** `audit_logs` is **append-only**; inserts go through `fn_write_audit(...)` which is `SECURITY DEFINER` so application roles never get raw INSERT on `audit_logs`. Every event carries:

- `occurred_at timestamptz`
- `actor_id` (uuid, nullable — system events have no actor)
- `actor_type actor_type_t` (`admin`, `system`, `user`, `job`, `service`)
- `entity_type`, `entity_id` (polymorphic reference)
- `action text`
- `before jsonb`, `after jsonb`, and a **generated** `diff jsonb` column
- `request_id text`, `ip_address inet`, `user_agent text`

**Consequences.** Application code paths cannot bypass the audit; the single-entry function ensures consistent code/`action` semantics. Future partitioning of `audit_logs` by `occurred_at` is forward-compatible (column exists).

**Alternatives considered.** (a) Granting `INSERT` directly to `audit_logs`; (b) row-versioning on each entity. **Rejected** — both lose the global cross-entity audit property.

---

## ADR-008 — Materialised Views for Hot Aggregates

**Status:** Active.

**Decision.** `mv_top_rated_products`, `mv_top_rated_ingredients`, `mv_top_brands`, `mv_latest_recalls` are materialised views refreshed via `REFRESH MATERIALIZED VIEW CONCURRENTLY` and gated behind `fn_refresh_materialized_views()`.

**Consequences.** Plain views (`v_top_rated_*`) remain live for hot-path endpoints that need fresh data; the MVs back cached responses and admin dashboards.

**Alternatives considered.** A side-cache (Redis) for top-rated lists. **Rejected** — Postgres materialised views are operationally simpler; cache invalidation is one query.

---

## ADR-009 — Canonical SQL Files vs Numbered Migrations (Deferred)

**Status:** Active for Sprint 1; **deferred re-evaluation** at Sprint 1.1.

**Decision.** Sprint 1 ships `database/{schema,indexes,views,functions,triggers,seed}.sql` — canonical baseline files. Numbered `database/migrations/NNNN.sql` files are introduced once an RLS policy change or a non-trivial additive change is required (Sprint 1.1+).

**Consequences.** The baseline is reproducible and portable to any Postgres 14+ instance. Future migrations are append-only and reversible within one minor release.

**Alternatives considered.** Numbered migrations from day one. **Rejected** for the baseline so the schema can be adopted unchanged.

---

## ADR-010 — NestJS as the Backend Framework

**Status:** Active. Sprint 2A.

**Decision.** NestJS 10 on Node 20+, with strict TypeScript. Strict TypeScript is non-negotiable.

**Consequences.** Bound providers (`@Inject`), strict types, predictable module composition. Code must compile against `tsconfig.json`'s `strict: true`, `noImplicitAny`, `strictNullChecks`.

**Alternatives considered.** Express-only, Fastify, Hono. **Rejected** — Nest's DI + module structure fits a 39-table schema and many cross-cutting concerns with the lowest overhead.

---

## ADR-011 — Unified `{ success, data|error, meta }` Envelope

**Status:** Active.

**Decision.** Every API response (success or failure) follows:

```jsonc
// Success
{ "success": true, "data": ..., "meta": { "timestamp": "ISO", "traceId": "..." } }
// Error
{ "success": false, "error": { "code": "...", "message": "...", "traceId": "..." }, "meta": { ... } }
```

Pagination meta augments this block with `page`, `limit`, `total`, `totalPages`, `hasPrev`, `hasNext`, `links`.

**Consequences.** UI can render any response with a single envelope decoder. `EnvelopeInterceptor` is idempotent: a handler that has already returned an envelope is a pass-through.

**Alternatives considered.** RFC 7807 problem+json. **Rejected** — the Stripe-style envelope is faster to grep and parse in JS clients; the codebase commits to it.

---

## ADR-012 — Supabase JWT as the Single Auth Mechanism

**Status:** Active.

**Decision.** The backend verifies **Supabase JWTs** (RS256) using `supabase-js`'s `auth.getUser(jwt)`. No custom login/signup controllers are written in Sprint 2A — they arrive as part of the Auth module in Sprint 2B, all backed by Supabase Auth.

**Consequences.** Roles are read from `app_metadata.role` first, then `user_metadata.role`, then default to `authenticated`. RLS policies in Postgres are the **enforcement** layer.

**Alternatives considered.** Self-issued HS256 JWTs (custom auth). **Rejected** — Supabase Auth ships password reset, OAuth, magic-link, MFA, and rate limiting for free.

---

## ADR-013 — Global `SupabaseAuthGuard` with `@Public()` Opt-out

**Status:** Active.

**Decision.** A single `SupabaseAuthGuard` is mounted globally via `APP_GUARD`. Routes opt-out via `@Public()`. Roles are checked **per-route** via `@Roles(Admin) @UseGuards(RolesGuard)` — opt-in.

**Consequences.** Every route is authenticated by default. Public endpoints are explicit and visible (decorator). RBAC failures throw typed `ApiError` → uniform error envelope.

**Alternatives considered.** Per-controller guards via `@UseGuards(...)`. **Rejected** — easy to forget; the global default with explicit `@Public()` opt-out is safer.

---

## ADR-014 — Single-Source Pagination, Errors, and Constants

**Status:** Active.

**Decision.**

- `APP_CONSTANTS` in `common/constants/app.constants.ts` is the **only** source of: pagination defaults, error codes, header names.
- `ApiError` hierarchy in `common/errors/api-error.ts` is the only way to throw a public error.
- `GlobalExceptionFilter` is the only place that maps a status code to a public error code.

**Consequences.** Renaming an error code is a one-file change. Adding a new public error is `ApiError` subclass + `APP_CONSTANTS` entry.

**Alternatives considered.** Magic strings. **Rejected** — they quietly fork.

---

## ADR-015 — Repository Pattern via `BaseRepository<T>`

**Status:** Active.

**Decision.** Every domain repository extends `BaseRepository<T>` which:

- Holds a reference to `DatabaseService`.
- Exposes `query<R>(sql, values)`, `transaction<T>(fn)`, `insertReturning<R>(sql, values)`.
- Has a `validateTableName(name)` helper but **never template-interpolates** a `tableName` into a SQL string. (`ping()` is fixed `SELECT 1::int`.)

**Consequences.** Concrete repositories in Sprint 2B+ project explicit columns, use `$1`-style parameters, and never `SELECT *`.

**Alternatives considered.** TypeORM / Prisma / Drizzle. **Rejected** for Sprint 2 — explicit SQL is auditable end-to-end with `EXPLAIN`. A future ADR may swap in a thin query builder if the column count grows uncomfortable.

---

## ADR-016 — Direct `pg` Driver + Supabase URL

**Status:** Active.

**Decision.** The backend connects directly to Supabase Postgres using the `pg` driver. Local dev uses docker-compose on `5432`; production uses the Supabase pooler on `6543` in transaction mode.

**Consequences.** No ORM, no migrations machinery, and no surprise SQL generation. We lose compile-time typed query results; we keep query-level reviewability.

**Alternatives considered.** Prisma Drizzle. **Rejected** — both generate SQL we do not see, and several of our hot-path queries (materialised-view refresh, BRIN-aware joins) need explicit SQL.

---

## ADR-017 — `nestjs-pino` + `x-request-id`

**Status:** Active.

**Decision.** All logging uses `nestjs-pino`. Headers: `x-request-id`, `x-correlation-id`, `x-request-time-ms`. `RequestIdMiddleware` is the **single source of truth** for `req.id`; `RequestLoggingInterceptor` only stamps `x-request-time-ms`.

**Consequences.** Every log line carries a correlation id; every response carries `x-request-id`; clients can correlate.

**Alternatives considered.** Winston, Bunyan. **Rejected** — pino is faster and natively supported by Nest via `nestjs-pino`.

---

## ADR-018 — URI Versioning (`/api/v1/...`)

**Status:** Active.

**Decision.** All routes prefixed with `/api/v1/`. Default version is `1`. URI versioning, not header versioning.

**Consequences.** Easy to inspect via `curl` and simple browser preview; CDN cacheability by URL prefix; enables per-version endpoint analytics.

**Alternatives considered.** Header versioning (`Accept: application/vnd.tuskrank.v2+json`). **Rejected** — URI is simpler and more debuggable for a US consumer audience that values plaintext URLs.

---

## ADR-019 — Swagger only in Non-Production

**Status:** Active.

**Decision.** Swagger UI mounts at `/api/docs` only when `NODE_ENV !== 'production'`.

**Consequences.** Production has no public schema surface; staging devs inspect schemas against staging data; CI greps the schema during contract tests.

**Alternatives considered.** OAuth-protected Swagger in production. **Rejected** — adds attack surface; users on production read schemas via docs staging.

---

## ADR-020 — Throttler wired inside `CommonModule`

**Status:** Active. Post-Sprint-2A.1 hardening (was previously in a separate `@Global` module).

**Decision.** `ThrottlerModule` + `ThrottlerGuard` are configured inside `CommonModule`. Both `SupabaseAuthGuard` and `ThrottlerGuard` are registered to `APP_GUARD`. **Auth runs first; throttle runs after.** This means unauthenticated traffic is rejected before being counted against the per-IP quota.

**Consequences.** The two APP_GUARD providers compose. Anon traffic can't burn a tenant's burst budget.

**Alternatives considered.** Reverse order (throttle first). **Rejected** — would protect against unauthenticated spam at the cost of letting anon traffic affect the IP quota.

---

## Pending Decisions

The following ADRs are tracked but **not yet decided**:

- **Multi-region / pgbouncer** — for when horizontal autoscaling requires conn-pool multiplexing. (Sprint 10.)
- **`noUncheckedIndexedAccess` enforcement** — schedule once test coverage is broad enough.
- **Specialised search engine** — Meilisearch / OpenSearch swap-in if pg FTS becomes a bottleneck.
- **Stripe-style idempotency keys** at the API gateway — revisit when endpoints start accepting money.
- **Webhooks delivery semantics** — at-least-once vs at-most-once, retries, signing.

---

> **End of ADRs.**
> Append-only: never edit a past ADR. Add a new one if a decision is reversed or refined.
