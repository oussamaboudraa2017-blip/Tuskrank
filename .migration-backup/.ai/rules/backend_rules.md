# Backend Rules

> _Placeholder — to be elaborated in Sprint 2._

## Framework

- NestJS with TypeScript (`strict`).
- Modular structure: feature-first, then layered (controller → service → repository).

## Layers

- **Controllers** — HTTP boundary only. Validate inputs via DTOs + class-validator.
- **Services** — Business logic. Pure where possible, but allowed to call repositories.
- **Repositories** — Data access. Use Supabase/Postgres clients, never raw SQL in services.
- **DTOs** — For all external input and output.

## API Conventions

- RESTful resource naming: plural nouns.
- Versioned: `/v1/...` (added in Sprint 2).
- JSON-only responses.
- Errors: `{ "error": { "code": "...", "message": "...", "details": {...} } }`.

## Auth

- Supabase JWT is the source of identity.
- Roles derived from JWT claim, not user table lookups when avoidable.
- Service role is **never** exposed to clients.

## Validation

- DTOs validated at the edge.
- No implicit coercion.
- All mutations are idempotent or guarded.

## Observability

- Structured logging (JSON).
- Per-request correlation IDs.
- Metrics: latency, error rate, throughput per endpoint.
- Health check endpoints: `/healthz`, `/readyz`.

## Performance

- Response time p95 budget: 200ms for reads, 500ms for writes (initial).
- N+1 queries are banned.
- Caching layered: CDN → app → DB.

## Forbidden

- Long-running synchronous work in request handlers (use queues later).
- Logging secrets.
- Returning raw stack traces to clients.

---

_See also: `coding_rules.md`, `database_rules.md`, `../prompts/Sprint_02_Backend.md`._
