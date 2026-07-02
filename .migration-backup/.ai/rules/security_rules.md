# Security Rules

> _Placeholder — to be elaborated across sprints._

## Principles

1. **Least privilege** for every credential, role, and process.
2. **Defense in depth** — assume any single layer can fail.
3. **No secrets in code** — environment variables only.
4. **No secrets in logs** — redact aggressively.

## Application

- Input validation at every external boundary.
- Output encoding by framework defaults.
- Parameterized SQL — never string concatenation.
- Authn checks on every protected route.
- Authz checks on every ownership-scoped operation.
- CSRF protection on state-changing requests.

## Data

- PII minimization.
- Encryption at rest (DB) and in transit (TLS).
- Backups are encrypted and tested for restore.

## Supply Chain

- Dependencies pinned and audited.
- Renovate or equivalent updates dependency PRs.
- CI runs `npm audit` and dependency review.

## Operational

- Rate limiting at edge.
- WAF rules reviewed.
- Incident response runbook maintained.
- Secrets rotated periodically.

## Authentication

- Supabase Auth (email + OAuth providers).
- JWT verified server-side on every protected API call.
- Session cookies: `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` where appropriate).

## Forbidden

- Disabling security headers.
- Disabling RLS for convenience.
- Trusting client-supplied roles or claims.

---

_See also: `backend_rules.md`, `frontend_rules.md`._
