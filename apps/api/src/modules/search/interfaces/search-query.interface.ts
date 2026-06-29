import type { SearchEntityType } from '../enums';

/**
 * Composed search query contract.
 *
 * The service builds this from the controller DTO; the repository
 * consumes it. Never exposed on the wire.
 */
export interface SearchQuery {
  /** The normalized search string. */
  readonly q: string;
  /** Entity type filter (empty = search all). */
  readonly entityTypes: ReadonlyArray<SearchEntityType>;
  /** Maximum results per page. */
  readonly limit: number;
  /** Offset for pagination. */
  readonly offset: number;
  /** Locale (ISO 639-1 + optional region). */
  readonly locale: string;
  /** Minimum trigram similarity (0..1). */
  readonly minSimilarity: number;
  /** Pet type filter (optional). */
  readonly petType?: string;
  /** Minimum score filter (optional, products only). */
  readonly minScore?: number;
}

/**
 * Slug-specific search query.
 */
export interface SlugSearchQuery {
  /** The slug to match (exact or prefix). */
  readonly slug: string;
  /** Entity type to search within. */
  readonly entityType: SearchEntityType;
}
