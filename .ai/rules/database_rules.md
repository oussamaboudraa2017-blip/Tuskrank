# Database Rules

## Schema Design

- Every table must have: `id` (UUID, primary key), `created_at` (timestamptz), `updated_at` (timestamptz).
- Use UUIDs for all primary keys. No auto-incrementing integers.
- Use `timestamptz` for all timestamps. No `timestamp` without timezone.
- Every public-facing entity must have a `slug` column (unique, not null).
- Use soft deletes (`deleted_at` timestamptz, nullable) on all core entities.
- All text columns must have an explicit maximum length unless genuinely unbounded.

## Migrations

- All schema changes must be made through migration files in `database/migrations/`.
- Migration filenames: `{timestamp}_{description}.sql`.
- Every migration must provide both `up` and `down` transitions.
- Never modify an existing migration file after it has been applied.
- Test migrations against a fresh database before merging.

## Indexing

- Add indexes for all foreign key columns.
- Add indexes for all columns used in `WHERE` clauses of frequent queries.
- Add indexes for all columns used in `ORDER BY` clauses.
- Use composite indexes when multiple columns are queried together.
- Use `CONCURRENTLY` when creating indexes on production tables.

## Query Rules

- Never use `SELECT *` in application code. Always specify columns.
- Use parameterized queries. Never interpolate user input into SQL strings.
- Prefer `JOIN` over subqueries when possible for readability.
- Use CTEs for complex queries to improve readability.
- Limit result sets with `LIMIT` on all list queries.
- Use `EXPLAIN ANALYZE` on any query that may be performance-sensitive.

## Data Integrity

- Add `CHECK` constraints for data validation at the database level.
- Use `NOT NULL` constraints explicitly — do not rely on defaults to imply non-nullability.
- Add `UNIQUE` constraints where business logic requires uniqueness.
- Use foreign key constraints with `ON DELETE` behavior specified explicitly.