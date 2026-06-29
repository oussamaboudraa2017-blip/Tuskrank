import type { Uuid } from '@types';
import type { SearchEntityType } from '../enums';

/**
 * A single search result item.
 *
 * Unified shape returned by all search strategies. The `entityType`
 * discriminator tells the controller which module to delegate to for
 * detail hydration.
 */
export interface SearchResultItem {
  /** Entity UUID. */
  readonly id: Uuid;
  /** Discriminator: product | brand | ingredient. */
  readonly entityType: SearchEntityType;
  /** Display name. */
  readonly name: string;
  /** URL-safe slug. */
  readonly slug: string;
  /** Combined relevance score (0..1). Higher = more relevant. */
  readonly score: number;
  /** Which strategy produced this result. */
  readonly matchedBy: string;
  /** Snippet with highlighted matches (HTML-safe). Null when unavailable. */
  readonly snippet: string | null;
  /** Brand name (for products). Null for brand/ingredient results. */
  readonly brandName: string | null;
  /** Brand slug (for products). Null for brand/ingredient results. */
  readonly brandSlug: string | null;
  /** Current overall score (for products). Null for brands/ingredients. */
  readonly overallScore: number | null;
  /** Current letter grade (for products). Null for brands/ingredients. */
  readonly grade: string | null;
  /** Primary image URL (for products). Null otherwise. */
  readonly imageUrl: string | null;
}

/**
 * Aggregated search response shape.
 */
export interface SearchResult {
  /** The original (normalized) query. */
  readonly query: string;
  /** Total matching rows (before pagination). */
  readonly total: number;
  /** Result items for the current page. */
  readonly items: ReadonlyArray<SearchResultItem>;
  /** Which strategies were used. */
  readonly strategies: ReadonlyArray<string>;
  /** Server-side latency in milliseconds. */
  readonly latencyMs: number;
}

/**
 * Global (multi-entity) search result — groups results by entity type.
 */
export interface GlobalSearchResult {
  readonly query: string;
  readonly total: number;
  readonly products: ReadonlyArray<SearchResultItem>;
  readonly brands: ReadonlyArray<SearchResultItem>;
  readonly ingredients: ReadonlyArray<SearchResultItem>;
  readonly strategies: ReadonlyArray<string>;
  readonly latencyMs: number;
}

/**
 * Autocomplete suggestion shape.
 */
export interface AutocompleteSuggestion {
  /** The suggested query text. */
  readonly text: string;
  /** Entity type of the suggestion source. */
  readonly entityType: SearchEntityType;
  /** Result count for this suggestion. */
  readonly count: number;
}

/**
 * Trending search shape.
 */
export interface TrendingSearch {
  readonly normalized: string;
  readonly totalCount: number;
  readonly latestWindowEnd: Date;
}
