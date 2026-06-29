# Architecture

> _Placeholder — to be elaborated in Sprint 1 + Sprint 2._

## High-Level Diagram

```
            ┌─────────────────────────────────────────────────┐
            │                   USERS                          │
            └──────────────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │       Vercel Edge           │
                    │   apps/web (Next.js 15)     │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼─────────────────────┐
              │                    │                     │
   ┌──────────▼──────────┐  ┌──────▼───────┐  ┌──────────▼─────────┐
   │  apps/api (NestJS)  │  │   Supabase   │  │   AI providers     │
   │   Search, Scoring,  │  │  Auth + DB   │  │ (OpenAI, Anthropic)│
   │   Compare, AI proxy │  │  + Storage   │  └────────────────────┘
   └──────────┬──────────┘  └──────┬───────┘
              │                    │
              └────────────────────┘
                       │
            ┌──────────▼──────────┐
            │   PostgreSQL (RDS/  │
            │      Supabase)      │
            │  pgvector + full-text│
            └─────────────────────┘
```

## Monorepo Apps

- `apps/web` — Public Next.js application (consumer product)
- `apps/api` — NestJS backend API (search, scoring, comparison, AI)
- `apps/admin` — Internal admin console (Next.js)

## Shared Packages

- `packages/ui` — shadcn/ui-based design system
- `packages/types` — Cross-app TypeScript types
- `packages/utils` — Cross-app pure utility functions
- `packages/config` — Shared config (tsconfig, eslint, tailwind, prettier)

## Infrastructure

- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Hosting:** Vercel
- **Backend runtime:** NestJS on container platform (added in Sprint 10)
- **Search:** PostgreSQL FTS + pgvector (initial); may evolve to dedicated engine

## Cross-Cutting Concerns

- Observability (logs, metrics, traces)
- Rate limiting
- Caching (HTTP + query)
- Security headers and CSP
- SEO rendering (SSR + metadata)
- A/B infrastructure (future)

---

_See also: `database.md`, `../../docs/`._
