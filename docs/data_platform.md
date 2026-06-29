# Data Platform Foundation

> Sprint 2E — Import pipeline, normalization, validation, report generation.

## Overview

The Data Platform module provides the infrastructure for importing thousands of pet food products safely into Tuskrank. It implements a six-stage pipeline:

```
Import → Validate → Normalize → Deduplicate → Save → Generate Report
```

This sprint does NOT add public APIs beyond the admin import endpoints. It prepares the system for bulk data ingestion from CSV, JSON, and future API sources.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Import Module                              │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Parsers  │→ │Validator │→ │Normalizer│→ │  Mapper  │       │
│  │ CSV/JSON │  │  Rules   │  │ Utilities│  │ Raw→Domain│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                Import Service (Pipeline)                 │  │
│  │  Parse → Validate → Normalize → Deduplicate → Save      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Import Repository (DB writes)               │  │
│  │  Batch inserts, ON CONFLICT upserts, FK resolution       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Import Controller (REST)                     │  │
│  │  POST /import, GET /import/jobs, GET /import/jobs/:id    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Module structure

```
src/modules/import/
├── index.ts                    # Public exports
├── import.module.ts            # NestJS module wiring
├── import.controller.ts        # REST endpoints (admin only)
├── import.service.ts           # Pipeline orchestrator
├── import.repository.ts        # DB writes (batch inserts, upserts, FK lookups)
├── types/
│   ├── index.ts
│   └── import.types.ts         # RawImportRow, NormalizedRow, ImportJob, ImportReport
├── constants/
│   ├── index.ts
│   └── import.constants.ts     # IMPORT_BOUNDS, CSV_HEADERS, defaults
├── enums/
│   ├── index.ts
│   └── import.enums.ts         # ImportFormat, ImportEntityType, ImportJobStatus, etc.
├── errors/
│   ├── index.ts
│   └── import.errors.ts        # Typed error classes (15 error types)
├── parsers/
│   ├── index.ts
│   ├── csv.parser.ts           # CSV parsing (quoted fields, escaped quotes, booleans)
│   └── json.parser.ts          # JSON parsing (array, wrapper keys, single object)
├── validators/
│   ├── index.ts
│   └── row.validator.ts        # Per-row validation (Brand, Product, Ingredient)
├── normalizers/
│   ├── index.ts
│   └── normalizer.ts           # slugify, normalizeText, normalizeBrandName, etc.
├── mappers/
│   ├── index.ts
│   └── row.mapper.ts           # RawImportRow → NormalizedBrandRow/ProductRow/IngredientRow
├── jobs/
│   └── index.ts                # Future scheduled import jobs (placeholder)
└── templates/
    ├── products.csv            # Sample product import template
    ├── brands.csv              # Sample brand import template
    └── ingredients.csv         # Sample ingredient import template
```

## Import Pipeline

### Stage 1: Parse

Converts raw file content (CSV or JSON) into `RawImportRow[]`.

| Format | Parser | Notes |
|--------|--------|-------|
| CSV | `parseCsv()` | Handles quoted fields, escaped quotes, commas in values, newlines in values, boolean coercion |
| JSON | `parseJson()` | Supports array of objects, wrapper keys (`rows`/`data`/`items`), single object |

### Stage 2: Validate

Each row is validated against entity-specific rules. Validation produces:
- **Errors**: Block import (missing required fields, invalid formats)
- **Warnings**: Allow import with note (unknown values, truncation)

| Entity | Required Fields | Key Validations |
|--------|----------------|-----------------|
| Brand | `name` | Name max 200 chars, country code ISO-3166 alpha-2, URL format |
| Product | `brand_name`, `name` | UPC 8-14 digits, package size > 0, known food forms/protein sources |
| Ingredient | `name` | Name max 200 chars, known categories |

### Stage 3: Normalize

Valid rows are normalized using shared utilities:

| Function | Purpose | Example |
|----------|---------|---------|
| `slugify()` | URL-safe slug | `"Royal Canin"` → `"royal-canin"` |
| `normalizeBrandName()` | Title-case brand | `"royal canin"` → `"Royal Canin"` |
| `normalizeIngredientName()` | Title-case ingredient | `"chicken meal"` → `"Chicken Meal"` |
| `normalizeCanonicalName()` | Lowercase for dedup | `"Chicken Meal"` → `"chicken meal"` |
| `normalizeUpc()` | Strip spaces/dashes | `"0-123456-789012"` → `"0123456789012"` |
| `normalizeCountryCode()` | Uppercase ISO code | `"us"` → `"US"` |
| `normalizeUrl()` | Trim + lowercase host | `" HTTPS://Example.COM "` → `"https://example.com"` |
| `normalizeList()` | Split comma/pipe/semicolon | `"a, b; c\|d"` → `["a", "b", "c", "d"]` |
| `normalizeNumeric()` | Parse number strings | `"1,234.56"` → `1234.56` |
| `normalizeBoolean()` | Coerce booleans | `"yes"` → `true` |
| `parsePackageSizeToGrams()` | Convert label to grams | `"5 lb"` → `2267.96` |

### Stage 4: Deduplicate

Checks existing records by:
- **Brand**: slug uniqueness
- **Product**: UPC uniqueness, brand+slug composite
- **Ingredient**: canonical_name uniqueness

Deduplication strategies:
| Strategy | Behavior |
|----------|----------|
| `skip` | Skip rows that match existing records (default) |
| `overwrite` | Upsert with new data |
| `merge` | Merge non-null fields into existing records |

### Stage 5: Save

Writes to PostgreSQL using:
- **UPSERT** (`ON CONFLICT ... DO UPDATE`) for idempotent writes
- **FK resolution**: brand_name → brand_id, food_form → food_form_id, etc.
- **Auto-creation**: Brands are auto-created if not found during product import
- **Batch relationships**: product_ingredients, product_targeting, product_claims, product_tags
- **Nutrition**: nutrition_profiles + product_nutrients for calorie and nutrient data
- **Images**: product_images with primary flag

### Stage 6: Generate Report

Produces an `ImportReport` with:
- Total rows processed
- Imported / Updated / Skipped / Failed counts
- Per-row status with error details
- Duration in milliseconds
- Timestamp range

## Normalization Utilities

The normalizer module (`normalizers/normalizer.ts`) provides shared, reusable text processing:

```typescript
import { slugify, normalizeBrandName, normalizeCanonicalName } from './normalizers';

slugify('Royal Canin')           // "royal-canin"
slugify('Blue Buffalo Life!')    // "blue-buffalo-life"
normalizeBrandName('royal canin') // "Royal Canin"
normalizeCanonicalName('Chicken Meal') // "chicken meal"
parsePackageSizeToGrams('5 lb')  // 2267.96
normalizeList('grain-free, high protein') // ["grain-free", "high protein"]
```

These utilities consolidate the duplicated `slugify()` methods from Brands and Ingredients services, plus add new normalization functions for import use cases.

## Supported Entity Types

### Products

Full product import including:
- Brand (auto-created if missing)
- Product details (name, UPC, SKU, package size)
- Food form and protein source (resolved to FK IDs)
- Targeting (pet types, life stages, breed sizes)
- Claims and tags
- Nutrition profile (kcal, moisture)
- Nutrient values (protein, fat, fiber, ash, omega-3/6, calcium, phosphorus)
- Product images (URL)

### Brands

Brand import including:
- Name, manufacturer, country code
- Website URL, description, logo
- Active status

### Ingredients

Ingredient import including:
- Name, INCI name, canonical name
- Category (resolved to FK ID)
- Animal-derived, allergen, controversial flags
- Active status

## Sample Templates

CSV templates are provided in `templates/`:

| Template | Rows | Columns |
|----------|------|---------|
| `products.csv` | 4 sample products | 28 columns |
| `brands.csv` | 8 sample brands | 7 columns |
| `ingredients.csv` | 14 sample ingredients | 9 columns |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/import` | Admin | Run import pipeline |
| GET | `/api/v1/import/jobs` | Admin | List all import jobs |
| GET | `/api/v1/import/jobs/:jobId` | Admin | Get job detail |
| GET | `/api/v1/import/jobs/:jobId/report` | Admin | Get import report |

## Future Scaling

### Scheduled Imports (Sprint 5+)

The `jobs/` directory is prepared for scheduled import runners:
- Cron-based imports from supplier APIs
- Webhook-triggered imports
- Retry logic with exponential backoff

### Streaming Imports (Sprint 6+)

For imports > 10,000 rows:
- Stream processing instead of full-buffer
- Progress webhooks
- Resume from checkpoint

### Multi-source Import (Sprint 7+)

Additional parsers:
- Excel (.xlsx) parser
- XML parser
- API endpoint connector (REST/GraphQL)

### Import Queue (Sprint 5+)

Replace in-memory job store with:
- PostgreSQL `import_jobs` table
- Redis-based job queue (Bull/BullMQ)
- Worker processes for long-running imports

### Incremental Import (Sprint 6+)

- Hash-based change detection
- Delta imports (only changed rows)
- Version tracking per import source

## File Size Limits

| Limit | Value |
|-------|-------|
| Max file size | 10 MB |
| Max rows per import | 10,000 |
| Max batch size (DB writes) | 500 rows |

## Error Handling

All errors extend `ImportError` (which extends `ApiError`). Error codes are prefixed with `IMPORT_`. The pipeline catches errors at each stage and continues processing valid rows, collecting failures in the report.
