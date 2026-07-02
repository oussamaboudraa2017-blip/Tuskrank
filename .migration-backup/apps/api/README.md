# Tuskrank API

NestJS / Supabase Postgres / Supabase Auth backend for the Tuskrank Pet Food Search & Intelligence Platform.

> **Sprint 2A — Foundation only.** No business modules (Products, Search, Scoring, AI, Admin) yet.
> For end-to-end architecture see [`docs/BACKEND_ARCHITECTURE.md`](../../docs/BACKEND_ARCHITECTURE.md).

---

## Quickstart

```bash
# From repo root or apps/api
cp .env.example .env.development
pnpm install
pnpm run start:dev
# Browse:
#   http://localhost:4000/api/v1/health/live
#   http://localhost:4000/api/docs   (Swagger, dev only)
```

## Scripts

| Command                  | Purpose                                  |
| ------------------------ | ---------------------------------------- |
| `pnpm start:dev`         | Nest in watch mode                       |
| `pnpm start`             | Production-mode start (no watch)         |
| `pnpm build`             | Compile to `dist/` (Nest CLI)            |
| `pnpm typecheck`         | `tsc --noEmit`                           |
| `pnpm lint` / `lint:check` | ESLint with autofix / strict            |
| `pnpm format` / `format:check` | Prettier write / dry-run            |
| `pnpm test`              | Unit + integration (Jest)                |
| `pnpm test:e2e`          | E2E smoke (`*.e2e-spec.ts`)              |
| `pnpm test:cov`          | Coverage report                          |

## Endpoints

| Method | Path                                 | Auth  | Notes |
| ------ | ------------------------------------ | ----- | ----- |
| GET    | `/api/v1/health`                     | none  | Full check (Terminus) |
| GET    | `/api/v1/health/live`                | none (`@Public()`) | Kubernetes livenessProbe |
| GET    | `/api/v1/health/ready`               | none (`@Public()`) | Kubernetes readinessProbe (Postgres probe) |
| GET    | `/api/v1/auth/me`                    | required | Returns the resolved Supabase user (Sprint 2A scaffold) |
| GET    | `/api/docs`                          | —     | Swagger UI (dev/staging only)  |

Versioning is URI-based (`/api/v1/...`). All other versions are 404.

## Environment files

Per-environment env files exist for development, staging, production, and test:

- `.env.development` — local dev (used by default).
- `.env.staging`     — staging.
- `.env.production`  — production.
- `.env.test`        — jest e2e.
- `.env.example`      — committed template.

Missing variables **fail bootstrap** — there is no silent fallback to bad config.

## Notes

- `SUPABASE_URL` and `DATABASE_URL` are **required** unless `NODE_ENV=test`.
- Local dev uses `http://localhost:3000` CORS origin by default.
- The `/auth/me` route exists only to validate Supabase wiring; login / refresh / logout arrive in Sprint 2B.
