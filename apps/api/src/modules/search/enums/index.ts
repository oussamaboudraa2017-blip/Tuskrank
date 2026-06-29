/**
 * Search entity types — the domains that can be searched.
 */
export enum SearchEntityType {
  Product = 'product',
  Brand = 'brand',
  Ingredient = 'ingredient',
}

/**
 * Search matching strategies — how a result was matched.
 */
export enum SearchStrategy {
  /** PostgreSQL full-text search (tsvector/tsquery). */
  FullText = 'full_text',
  /** Trigram similarity (pg_trgm). */
  Trigram = 'trigram',
  /** Exact name match. */
  Exact = 'exact',
  /** Prefix match (autocomplete). */
  Prefix = 'prefix',
  /** Keyword lookup via search_keywords table. */
  Keyword = 'keyword',
  /** Slug-based lookup. */
  Slug = 'slug',
  /** Synonym-expanded match. */
  Synonym = 'synonym',
}

/**
 * Ranking strategy signals — used to compose the final score.
 */
export enum RankingSignal {
  /** Full-text search relevance (ts_rank). */
  FullText = 'full_text',
  /** Trigram similarity score. */
  Trigram = 'trigram',
  /** Entity's own score (product overall_score, etc.). */
  EntityScore = 'entity_score',
  /** Recency of the entity (created_at / updated_at). */
  Recency = 'recency',
  /** Popularity from search_logs / popular_searches. */
  Popularity = 'popularity',
  /** Keyword match from search_keywords table. */
  Keyword = 'keyword',
}
