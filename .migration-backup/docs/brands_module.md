# Brands Module

> Sprint 2D — CRUD, search, featured, lifecycle transitions.

## Overview

The Brands module provides full lifecycle management for pet food brands. It supports brand CRUD, search, featured/top brands ranking, and lifecycle transitions (activate/deactivate/soft-delete/restore). Brands aggregate product counts, average scores, and recall data from related tables.

## Module structure

```
src/modules/brands/
├── entities/
│   └── brand.entity.ts               # Brand entity interfaces
├── dto/
│   └── brand.dto.ts                  # Input DTOs (create, update, patch, list, search)
├── domain/
│   ├── enums/
│   │   └── brand.enums.ts            # BrandSortField, SortOrder
│   ├── constants/
│   │   └── brand.constants.ts        # BRAND_BOUNDS, BRAND_SLUG_RE, BRAND_DEFAULTS
│   ├── types/
│   │   └── brand.type.ts             # Brand, BrandSummary, BrandWithStats
│   ├── errors/
│   │   └── brand.errors.ts           # Typed error classes (6 error types)
│   ├── interfaces/
│   │   └── brand-query.interface.ts   # BrandQuery, BrandSearchInput
│   ├── mapping/
│   │   └── brand.mapping.ts          # Pure mapper functions (db→domain)
│   └── validation/
│       └── brand.validation.ts       # Zod validation schemas
├── brands.repository.ts              # PostgreSQL queries (extends BaseRepository)
├── brands.service.ts                 # Business orchestration
├── brands.controller.ts              # REST endpoints
├── brands.module.ts                  # NestJS module wiring
└── index.ts                          # Public exports
```

## Endpoints

### Public (opt-out from `SupabaseAuthGuard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/brands` | List brands (paginated, filterable, sortable) |
| GET | `/api/v1/brands/featured` | Get top brands ranked by product count and score |
| GET | `/api/v1/brands/search?q=...` | Search brands by name or manufacturer |
| GET | `/api/v1/brands/:slug` | Get brand detail by slug |

### Admin (`@Roles('admin')`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/brands` | Create brand |
| PUT | `/api/v1/brands/:brandId` | Full update brand |
| PATCH | `/api/v1/brands/:brandId` | Partial update brand |
| POST | `/api/v1/brands/:brandId/activate` | Activate |
| POST | `/api/v1/brands/:brandId/deactivate` | Deactivate |
| POST | `/api/v1/brands/:brandId/soft-delete` | Soft-delete (blocked if products exist) |
| POST | `/api/v1/brands/:brandId/restore` | Restore |

## Query parameters

### List (GET /api/v1/brands)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search by name/manufacturer |
| `countryCode` | string | — | Filter by ISO-3166 alpha-2 code |
| `isActive` | boolean | — | Filter by active flag |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Result limit (1-100) |
| `sortBy` | string | name | Sort field: created_at, name, product_count, avg_score |
| `sortOrder` | string | asc | Sort direction: asc, desc |

### Search (GET /api/v1/brands/search)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search query (min 2 chars) |
| `countryCode` | string | — | Filter by country code |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Result limit (1-100) |

### Featured (GET /api/v1/brands/featured)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 10 | Number of featured brands to return |

## Database table

### `brands`
- `id` (uuid, PK), `name` (text, 1-200), `slug` (text, unique, `^[a-z0-9-]+$$`), `manufacturer` (text, nullable), `country_code` (char(2), ISO-3166, nullable), `website_url` (text, nullable), `description` (text, nullable), `logo_image_url` (text, nullable), `is_active` (boolean, default true), `created_at`, `updated_at`, `deleted_at`
- Indexes: GIN trigram on name, GIN tsvector on search_vector
- Trigger: auto-sync `search_vector` on name/manufacturer change

## Relationships

```
brands
   │ 1:N (ON DELETE RESTRICT)
   ▼
products ──────┐
               │ N:1 (ON DELETE RESTRICT)
               ▼
          brand_certifications
               │
               ▼
          transparency_reports

brands ◄─────── recalls (FK brand_id)
```

## Business rules

1. **Slug uniqueness**: Slugs are auto-generated from name if not provided; uniqueness enforced at service level
2. **Soft-delete guard**: Cannot soft-delete a brand with associated products (`BrandHasProductsError`)
3. **Lifecycle transitions**: Active → Deactivated → Activated; soft-deleted brands can be restored
4. **Stats aggregation**: Product count, average scores (overall, quality, safety, nutrition, transparency), and open recall count are computed via LEFT JOINs in the base query

## Future extensions

### Brand Transparency Score
The `transparency_reports` table supports structured transparency data. Future: add aggregated brand-level transparency scoring based on disclosure completeness.

### Recall History
The `recalls` table already tracks recall events per brand. Future: add recall frequency analysis, severity trending, and brand risk scoring.

### Manufacturing Countries
The `country_code` field provides primary country. Future: add `brand_countries` junction table for multi-country manufacturing operations.

### Parent Company
Future: add `parent_company` field or `parent_companies` table for corporate ownership hierarchies.

### Certifications
The `brand_certifications` table already supports certification data. Future: add certification verification workflows, expiry tracking, and certification-based filtering.

### Product Count & Average Score
Currently computed via JOINs. Future: materialize as `mv_brand_stats` for performance at scale.
