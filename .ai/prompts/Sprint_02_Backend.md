# Sprint 2 — Backend

> _Placeholder sprint spec._

## Goals

- Initialize NestJS app under `apps/api`.
- Set up Supabase client and auth guards.
- Implement health endpoints (`/healthz`, `/readyz`).
- Configure DTO validation, CORS, rate limiting.
- Establish logging conventions and correlation IDs.

## Acceptance Criteria

- `pnpm --filter api dev` runs locally.
- `/healthz` returns 200; `/readyz` checks DB.
- Auth guard rejects missing/invalid JWTs.
- Log output is structured JSON.

---

_See also: `../rules/backend_rules.md`, `../rules/security_rules.md`._
