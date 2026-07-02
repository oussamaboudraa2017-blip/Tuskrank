# Sprint 1 — Database

> _Placeholder sprint spec._

## Goals

- Author canonical schema in `database/schema/`.
- Author migrations in `database/migrations/`.
- Set up Supabase project + RLS policies.
- Add database views and helper functions.
- Seed minimal reference data (countries, life stages, species).

## Acceptance Criteria

- `docker-compose up` brings the local Postgres online.
- All migrations apply cleanly from zero.
- All user-facing tables have RLS enabled.
- Schema doc aligned with `../context/database.md`.

---

_See also: `../rules/database_rules.md`, `../context/database.md`._
