# Architecture

## System Overview

Tuskrank uses a decoupled architecture with three application packages communicating through a shared API layer.

```
                    Vercel
                      |
            +---------+---------+
            |                   |
       apps/web/          apps/api/
    (Next.js 15)        (NestJS)
            |                   |
            +-------+---+-------+
                    |
              Supabase
           (PostgreSQL + Auth + Storage)
```

## Application Packages

### apps/web — Next.js 15 Frontend
- React Server Components for initial page loads.
- Client Components for interactive features (search, comparison, AI chat).
- App Router with route-based code splitting.
- Tailwind CSS + shadcn/ui for styling.
- Server Actions for lightweight mutations.
- Direct Supabase client for auth and public data reads.

### apps/api — NestJS Backend
- RESTful API for product, ingredient, and comparison data.
- AI/LLM integration layer (OpenAI or compatible).
- Webhook endpoints for data ingestion pipelines.
- Admin-only endpoints protected by service role key.
- Rate limiting and request validation.

### apps/admin — Next.js Admin Dashboard
- Internal tool for managing products, ingredients, and data quality.
- Protected by Supabase Auth (admin role).
- CRUD interfaces for product and ingredient data.
- Bulk import/export capabilities.

## Shared Packages

### packages/ui
- Shared React components (shadcn/ui base).
- Design tokens and theme configuration.
- Reusable layout primitives.

### packages/types
- Shared TypeScript type definitions.
- Database schema types (generated from Supabase).
- API request/response types.

### packages/utils
- Shared utility functions.
- Formatting helpers, validators, constants.

### packages/config
- Shared configuration (ESLint, TypeScript, Tailwind presets).
- Monorepo tooling configuration (Turborepo).

## Database

- PostgreSQL 16 hosted on Supabase.
- Schema managed via migration files in `database/migrations/`.
- Views for complex read queries in `database/views/`.
- Stored functions for scoring logic in `database/functions/`.
- Seed data for development in `database/seeds/`.

## Deployment

- **Web + Admin**: Vercel (Edge + Serverless).
- **API**: Vercel or standalone (future container deployment).
- **Database**: Supabase managed PostgreSQL.
- **CI/CD**: GitHub Actions (`.github/workflows/`).

## Data Flow

1. Product data is ingested (admin or pipeline) into PostgreSQL.
2. Scoring functions compute product scores via database functions.
3. Next.js web app reads public data directly from Supabase.
4. AI features (analysis, explanations) go through the NestJS API.
5. Search uses PostgreSQL full-text search (initially) with potential migration to a dedicated search engine.

## Scalability Considerations

- Read-heavy workload: Supabase connection pooling + Edge caching.
- AI calls: Async processing with queued jobs for bulk analysis.
- Search: Full-text search in PG initially; plan for Elasticsearch/Meilisearch if needed.
- CDN: Vercel Edge Network for static assets and cached API responses.
