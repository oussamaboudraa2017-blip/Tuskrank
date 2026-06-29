import { SearchEntityType } from '../enums';

/**
 * SearchProvider — the repository contract for the search module.
 *
 * The service is the only consumer; controllers must never call the repository
 * directly. This interface enables swapping PostgreSQL for Elasticsearch /
 * Meilisearch without touching the service layer.
 */
export interface SearchProvider {
  /**
   * Full multi-entity search with ranking.
   * Returns deduplicated results across all entity types.
   */
  search(query: string, options?: SearchOptions): Promise<{
    query: string;
    total: number;
    items: ReadonlyArray<import('../types').SearchResultItem>;
    strategies: ReadonlyArray<string>;
    latencyMs: number;
  }>;

  /**
   * Single-entity search.
   * Filter results to one entity type with optional sub-filters.
   */
  searchByEntity(
    entityType: SearchEntityType,
    query: string,
    options?: EntitySearchOptions,
  ): Promise<{
    query: string;
    total: number;
    items: ReadonlyArray<import('../types').SearchResultItem>;
    strategies: ReadonlyArray<string>;
    latencyMs: number;
  }>;

  /**
   * Slug lookup — find an entity by its exact slug and type.
   * Returns null if not found.
   */
  findBySlug(
    entityType: SearchEntityType,
    slug: string,
  ): Promise<import('../types').SearchResultItem | null>;

  /**
   * Autocomplete suggestions for a partial query.
   */
  autocomplete(
    query: string,
    options?: AutocompleteOptions,
  ): Promise<ReadonlyArray<import('../types').SearchResultItem>>;

  /**
   * Retrieve the N most popular (frequently searched) queries.
   */
  getPopularSearches(limit?: number): Promise<ReadonlyArray<import('../types').PopularSearch>>;

  /**
   * Retrieve trending searches from the last N hours.
   */
  getTrendingSearches(hours?: number): Promise<ReadonlyArray<import('../types').TrendingSearch>>;

  /**
   * Log a search query for analytics and trending.
   */
  logSearch(params: {
    normalized: string;
    raw: string;
    resultCount: number;
    latencyMs: number;
    userId?: string;
  }): Promise<void>;
}

/**
 * Options for multi-entity search.
 */
export interface SearchOptions {
  page?: number;
  limit?: number;
  locale?: string;
  includeSnippets?: boolean;
}

/**
 * Options for single-entity search with sub-filters.
 */
export interface EntitySearchOptions extends SearchOptions {
  brandId?: string;
  minScore?: number;
  sortBy?: 'relevance' | 'score' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Options for autocomplete.
 */
export interface AutocompleteOptions {
  limit?: number;
  entityType?: SearchEntityType;
}
