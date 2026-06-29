# Ingredients Module

> Sprint 2C — CRUD, categories, scores, related products, scientific references.

## Overview

The Ingredients module provides full lifecycle management for pet food ingredients. It supports ingredient CRUD, hierarchical categories, scoring/grading, related products lookup, and scientific reference management.

## Module structure

```
src/modules/ingredients/
├── entities/
│   ├── ingredient.entity.ts            # Ingredient entity interface
│   ├── ingredient-category.entity.ts   # Category entity interface
│   └── ingredient-score.entity.ts      # Score entity interface
├── dto/
│   ├── ingredient.dto.ts               # Input DTOs (create, update, list, search, category, score)
│   └── ingredient-detail.dto.ts        # Output DTOs (detail, list item, category, score, reference)
├── domain/
│   ├── enums/
│   │   └── ingredient.enums.ts         # IngredientSortField, SortOrder, IngredientLifecycleState, EvidenceType
│   ├── constants/
│   │   └── ingredient.constants.ts     # INGREDIENT_BOUNDS, INGREDIENT_SLUG_RE, INGREDIENT_DEFAULTS
│   ├── types/
│   │   └── ingredient.type.ts          # Ingredient, IngredientSummary, IngredientCategory, etc.
│   ├── errors/
│   │   └── ingredient.errors.ts        # Typed error classes (16 error types)
│   ├── interfaces/
│   │   └── ingredient-query.interface.ts # IngredientQuery, IngredientSearchInput
│   ├── mapping/
│   │   ├── ingredient.db-model.ts      # Row-shape interfaces for SQL results
│   │   └── ingredient.mapper.ts        # Pure mapper functions (db→domain→DTO)
│   └── validation/
│       └── ingredient.schemas.ts       # Zod validation schemas
├── ingredients.repository.ts           # PostgreSQL queries (extends BaseRepository)
├── ingredients.service.ts              # Business orchestration
├── ingredients.controller.ts           # REST endpoints
└── ingredients.module.ts               # NestJS module wiring
```

## Endpoints

### Public (opt-out from `SupabaseAuthGuard`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/ingredients` | List ingredients (paginated, filterable, sortable) |
| GET | `/api/v1/ingredients/search?q=...` | Search ingredients by name |
| GET | `/api/v1/ingredients/:slug` | Get ingredient detail by slug |
| GET | `/api/v1/ingredients/:ingredientId/products` | Get products containing this ingredient |
| GET | `/api/v1/ingredients/:ingredientId/references` | Get scientific references |
| GET | `/api/v1/ingredients/:ingredientId/scores/history` | Get score history |
| GET | `/api/v1/ingredients/categories` | List categories (tree) |

### Admin (`@Roles('admin')`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/ingredients` | Create ingredient |
| PATCH | `/api/v1/ingredients/:ingredientId` | Update ingredient |
| POST | `/api/v1/ingredients/:ingredientId/activate` | Activate |
| POST | `/api/v1/ingredients/:ingredientId/deactivate` | Deactivate |
| POST | `/api/v1/ingredients/:ingredientId/soft-delete` | Soft-delete |
| POST | `/api/v1/ingredients/:ingredientId/restore` | Restore |
| POST | `/api/v1/ingredients/categories` | Create category |
| PATCH | `/api/v1/ingredients/categories/:categoryId` | Update category |
| POST | `/api/v1/ingredients/categories/:categoryId/soft-delete` | Soft-delete category |
| POST | `/api/v1/ingredients/:ingredientId/scores` | Create score |

## Query parameters

### List (GET /api/v1/ingredients)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search by name/canonical_name/inci_name |
| `categoryId` | uuid | — | Filter by category |
| `isAnimalDerived` | boolean | — | Filter by animal-derived flag |
| `isCommonAllergen` | boolean | — | Filter by allergen flag |
| `isControversial` | boolean | — | Filter by controversial flag |
| `isActive` | boolean | — | Filter by active flag |
| `minScore` | number | — | Minimum score (0-100) |
| `maxScore` | number | — | Maximum score (0-100) |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Result limit (1-100) |
| `sortBy` | string | name | Sort field: created_at, name, canonical_name, score |
| `sortOrder` | string | asc | Sort direction: asc, desc |

## Database tables

### `ingredients`
- `id` (uuid, PK), `name`, `slug` (unique), `inci_name`, `category_id` (FK), `canonical_name` (citext), `description`, `is_animal_derived`, `is_common_allergen`, `is_controversial`, `is_active`, `created_at`, `updated_at`, `deleted_at`
- Generated `search_vector` tsvector (name + canonical_name + inci_name)
- Indexes: trigram on name, GIN on search_vector, partial indexes on flags

### `ingredient_categories`
- `id` (uuid, PK), `slug` (unique), `name`, `description`, `parent_id` (self-ref FK), `sort_order`, `is_active`, `created_at`, `updated_at`, `deleted_at`
- Self-referencing hierarchy with cycle prevention trigger
- Max depth enforced at application layer (3 levels)

### `ingredient_scores`
- `id` (uuid, PK), `ingredient_id` (FK CASCADE), `score` (0-100), `grade` (A-F +/-), `reasoning`, `scoring_version`, `is_current`, timestamps, `deleted_at`
- Partial unique index enforces single current score per ingredient

### `product_ingredients` (junction)
- `id`, `product_id` (FK CASCADE), `ingredient_id` (FK RESTRICT), `position`, `raw_label`, `is_primary`, `percentage_value`, `is_active`, timestamps, `deleted_at`
- Partial unique on (product_id, position) and (product_id, ingredient_id)

### `ingredient_references`
- `id`, `ingredient_id` (FK CASCADE), `reference_id` (FK CASCADE), `evidence_type` (supports/refutes/neutral), `relevance_score` (0-10), `notes`, timestamps, `deleted_at`
- Links to `scientific_references` table

## Relationships

```
ingredient_categories (self-referencing via parent_id)
       │ 1:N (ON DELETE RESTRICT)
       ▼
   ingredients ◄──────────────────────────────┐
       │ 1:N (ON DELETE CASCADE)               │ 1:N (ON DELETE CASCADE)
       ▼                                       ▼
 ingredient_scores                   ingredient_references
       │                                       │ N:1 (ON DELETE CASCADE)
       │                                       ▼
       │                            scientific_references
       │ N:1 (ON DELETE RESTRICT)
       ▼
 product_ingredients ──── N:1 (ON DELETE CASCADE) ────► products
```

## Future extensions

### Safety Rating
The `ingredient_scores` table provides score/grade/reasoning. Future: add dedicated `ingredient_safety_ratings` table with structured safety data (toxicity levels, safe thresholds, regulatory status).

### Transparency Rating
Future: `ingredient_transparency` table tracking disclosure quality, sourcing transparency, and third-party certifications.

### Scientific Evidence
The `ingredient_references` + `scientific_references` tables already support evidence linking. Future: expand with structured evidence grading (GRADE-like system), meta-analysis support, and automated reference validation.

### Aliases / Synonyms
The `search_keywords` + `search_synonyms` tables already support ingredient name normalization. Future: add `ingredient_aliases` table for per-ingredient alternative names (brand-specific terminology, regional variations).

### Ingredient Categories
The hierarchical `ingredient_categories` table supports tree structures. Future: add category-specific scoring rules, category-level safety thresholds, and category-based recommendation logic.
