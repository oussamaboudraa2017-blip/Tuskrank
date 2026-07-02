# Search Architecture

> Sprint 3 — PostgreSQL full-text search with multi-signal ranking, synonyms, autocomplete, and trending.

## Overview

The search module provides full-text search, autocomplete, synonym expansion, and trending analytics for Tuskrank products, brands, and ingredients. It is built on PostgreSQL FTS + `pg_trgm` and is designed for future swap to Elasticsearch / Meilisearch via the `SearchProvider` interface.

## Module structure

```
src/modules/search/
├── constants/
│   └── search.constants.ts        # SEARCH_BOUNDS, SEARCH_RANKING_WEIGHTS, SEARCH_ANALYTICS
├── dto/
│   ├── search-query.dto.ts        # SearchQueryDto, GlobalSearchQueryDto, AutocompleteQueryDto
│   └── search-result.dto.ts       # SearchResultItemDto, SearchResultDto, GlobalSearchResultDto, AutocompleteSuggestionDto
├── enums/
│   ├── search-entity-type.enum.ts # SearchEntityType (product, brand, ingredient, general)
│   └── search-strategy.enum.ts    # SearchStrategy (full_text, trigram, slug, exact, keyword)
├── interfaces/
│   ├── search-provider.interface.ts # SearchProvider contract (swap backends)
│   └── search-query.interface.ts   # SearchQuery, SlugSearchQuery
├── types/
│   └── search-result.type.ts      # SearchResultItem, SearchResult, GlobalSearchResult, AutocompleteSuggestion, TrendingSearch
├── search.controller.ts           # 7 REST endpoints (all public)
├── search.repository.ts           # PostgreSQL FTS + trigram queries
├── search.service.ts              # Query composition, ranking, logging
└── search.module.ts               # NestJS module wiring
```

## Endpoints

All endpoints are **public** (opt-out from `SupabaseAuthGuard`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/search/products?q=...` | Search products (FTS + trigram + keyword) |
| GET | `/api/v1/search/brands?q=...` | Search brands (trigram + keyword) |
| GET | `/api/v1/search/ingredients?q=...` | Search ingredients (trigram + keyword) |
| GET | `/api/v1/search/global?q=...` | Multi-entity search (products + brands + ingredients) |
| GET | `/api/v1/search/autocomplete?q=...` | Prefix autocomplete (ILIKE + trigram) |
| GET | `/api/v1/search/synonyms/:term` | Expand a term via `search_synonyms` |
| GET | `/api/v1/search/trending` | Trending searches from `v_trending_searches` |

## Query parameters

### Common (SearchQueryDto)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Search query (1-500 chars) |
| `limit` | number | 10 | Result limit (1-50) |
| `offset` | number | 0 | Pagination offset |
| `locale` | string | en-US | Locale filter |

### Products-specific

| Param | Type | Description |
|-------|------|-------------|
| `petType` | string | Filter by pet type slug (dog, cat, etc.) |
| `minScore` | number | Minimum overall score (0-100) |

### Global-specific

| Param | Type | Description |
|-------|------|-------------|
| `types` | string | Comma-separated entity types to search |

### Autocomplete-specific

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Prefix (min 2 chars) |
| `types` | string | all | Comma-separated entity types |
| `limit` | number | 10 | Max suggestions (1-20) |

## Search strategies

### PostgreSQL full-text search (FTS)

- Uses `to_tsvector('english', name) @@ to_tsquery('english', ...)`
- Prefix matching with `:*` suffix
- `ts_rank()` for relevance scoring

### Trigram similarity

- Uses `pg_trgm` extension: `similarity(name, query)`
- Minimum threshold: 0.3 (configurable via `SEARCH_BOUNDS.trigramDefaultSimilarity`)
- Handles fuzzy matching, typos, and partial matches

### Keyword lookup

- Uses the `search_keywords` table (auto-synced by triggers on insert/update)
- Trigram operator `%` for similarity matching
- Includes `search_synonyms` for bidirectional expansion

### Multi-signal ranking

Final score combines four signals:

```
score = 0.40 * fts_score     # Full-text search rank
      + 0.25 * trigram_score # Trigram similarity
      + 0.20 * entity_score  # Product quality score (0-100 → 0-1)
      + 0.15 * recency_score # Recency (default: 0.5)
```

Weights are defined in `SEARCH_RANKING_WEIGHTS` and tunable without migration.

## Database infrastructure

### Tables (from `database/schema.sql`)

| Table | Purpose |
|-------|---------|
| `search_keywords` | Normalized keywords per entity (auto-synced) |
| `search_synonyms` | Bidirectional synonym mappings |
| `popular_searches` | Aggregated search counts (partitioning-ready) |
| `search_logs` | Raw search events (partitioning-ready) |

### Functions (from `database/functions.sql`)

| Function | Purpose |
|----------|---------|
| `fn_normalize_keyword(raw)` | Normalize search term (lowercase, trim, collapse whitespace) |
| `fn_upsert_search_keyword(...)` | Upsert keyword with count increment |
| `fn_match_score(query, target)` | Trigram similarity scoring |
| `fn_refresh_search_index(...)` | Emergency rebuild entry point |

### Indexes (from `database/indexes.sql`)

| Index | Type | Purpose |
|-------|------|---------|
| `idx_products_name_trgm` | GIN trigram | Fuzzy product name matching |
| `idx_brands_name_trgm` | GIN trigram | Fuzzy brand name matching |
| `idx_ingredients_name_trgm` | GIN trigram | Fuzzy ingredient name matching |
| `idx_products_name_fts` | GIN tsvector | Full-text product name search |
| `idx_brands_name_fts` | GIN tsvector | Full-text brand name search |
| `idx_ingredients_name_fts` | GIN tsvector | Full-text ingredient name search |

### Triggers (from `database/triggers.sql`)

| Trigger | Table | Purpose |
|---------|-------|---------|
| `trg_products_sync_search_keywords` | products | Auto-sync keywords on insert/update |
| `trg_brands_sync_search_keywords` | brands | Auto-sync keywords on insert/update |
| `trg_ingredients_sync_search_keywords` | ingredients | Auto-sync keywords on insert/update |
| `trg_product_ingredients_sync_search_keywords` | product_ingredients | Sync ingredient keywords |

### Views (from `database/views.sql`)

| View | Purpose |
|------|---------|
| `v_trending_searches` | Rolling 24h trending searches |
| `v_top_rated_products` | Products ranked by overall score |
| `v_top_brands` | Brands ranked by product count + avg score |
| `v_latest_recalls` | Recent recalls for banner display |

## Future: Backend swap

The `SearchProvider` interface defines the contract:

```typescript
interface SearchProvider {
  search(query, options): Promise<SearchResultItem[]>;
  count(query, options): Promise<number>;
  autocomplete(prefix, options): Promise<SearchResultItem[]>;
}
```

To swap from PostgreSQL to Elasticsearch/Meilisearch:
1. Create `ElasticsearchSearchProvider implements SearchProvider`
2. Update `SearchModule` providers to use the new implementation
3. No changes to `SearchService`, `SearchController`, or DTOs

## Performance considerations

- All queries use `$1`-bound parameters (no injection risk)
- Trigram minimum similarity (0.3) prevents expensive sequential scans
- `DISTINCT ON` prevents duplicate results from multiple JOINs
- Search logging is fire-and-forget (non-blocking)
- Autocomplete capped at 10 results (configurable)
- Global search runs entity queries in parallel via `Promise.all`
