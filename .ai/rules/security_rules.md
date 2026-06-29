# Security Rules

## Authentication & Authorization

- Use Supabase Auth for all authentication. Do not implement custom auth.
- Never expose the Supabase service role key to the client.
- The service role key is only used server-side (API routes, Server Actions, NestJS).
- Admin routes require a verified admin role claim in the JWT.
- Public pages require no authentication. Public API endpoints are rate-limited.

## API Security

- Validate and sanitize all inputs on the server, even if client validation exists.
- Use parameterized queries for all database operations. No raw string interpolation.
- Implement rate limiting on all API endpoints.
- Use CORS with explicit allowed origins. No `*` wildcard in production.
- Set security headers via Helmet or middleware:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (configured per route)
- Use HTTPS exclusively. No HTTP in production.

## Data Protection

- Encrypt data in transit (TLS 1.2+).
- Supabase handles encryption at rest.
- Never log sensitive data (tokens, passwords, PII).
- Minimize data collection. Only store what is necessary.

## Dependency Security

- Run `npm audit` regularly. Fix critical and high vulnerabilities before merging.
- Pin dependency versions. Use lockfiles (package-lock.json or pnpm-lock.yaml).
- Review new dependencies before adding them to the project.

## Secrets Management

- All secrets are stored in environment variables, never in code.
- `.env.example` documents required variables but contains no real values.
- `.env` files are in `.gitignore` and never committed.
- Production secrets are managed via Vercel environment variables and Supabase dashboard.

## AI/LLM Security

- Sanitize all user prompts before sending to LLM APIs.
- Validate LLM responses before rendering to prevent injection.
- Cache AI responses to reduce API exposure and cost.
- Implement content filtering on AI-generated output.
- Set timeouts on all LLM API calls.