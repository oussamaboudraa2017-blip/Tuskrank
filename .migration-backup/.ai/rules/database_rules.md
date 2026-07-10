# Database Rules

> _Placeholder — to be elaborated in Sprint 1._

## Schema Design

1. **Tables are plural, snake_case** (e.g., `products`, `product_ingredients`).
2. **Primary keys are `id uuid default gen_random_uuid()`** unless there's a strong reason otherwise.
3. **Foreign keys are explicit** with declared `ON DELETE` behavior.
4. **Timestamps**: every table has `created_at`, `updated_at`. Soft-delete with `deleted_at` where relevant.
5. **Money** uses integer cents + currency code; never floats.
6. **Enums** are Postgres `ENUM` types, not varchar with check constraint.

## Naming

- Columns: `snake_case`.
- Indexes: `idx_{table}_{columns}`.
- Unique constraints: `uq_{table}_{columns}`.
- Foreign keys: `fk_{table}_{ref_table}`.

## Migrations

- Append-only. Never modify a merged migration.
- One logical change per migration.
- Migrations are reversible when feasible.

## Row Level Security

- **All user-facing tables MUST have RLS enabled.**
- Policies are explicit (no `USING (true)` shortcuts on user data).
- Service role is used only server-side.

## Performance

- All FK columns are indexed.
- Covering indexes for hot read paths.
- No `SELECT *` in production queries.

## Forbidden

- Storing PII without encryption-at-rest justification.
- Triggers for business logic (use application code instead).
- Cross-schema joins for app domain data.

---

_See also: `../context/database.md`, `../prompts/Sprint_01_Database.md`._
