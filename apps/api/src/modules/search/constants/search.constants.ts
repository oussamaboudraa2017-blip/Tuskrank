/**
 * Search module constants.
 *
 * All numeric bounds mirror the CHECK constraints in
 * `database/schema.sql`. Changing a value here MUST come with a
 * paired migration.
 */

export const SEARCH_BOUNDS = {
  /** Minimum query length (characters). */
  queryMinLength: 1,
  /** Maximum query length (characters). */
  queryMaxLength: 500,
  /** Minimum query length for autocomplete (shorter prefix allowed). */
  autocompleteMinLength: 2,
  /** Default result limit for search endpoints. */
  defaultLimit: 10,
  /** Maximum result limit for search endpoints. */
  maxLimit: 50,
  /** Default result limit for autocomplete (lower cap). */
  autocompleteMaxLimit: 10,
  /** Search timeout in milliseconds. */
  searchTimeoutMs: 15_000,
  /** Minimum trigram similarity threshold (0..1). */
  trigramMinSimilarity: 0.1,
  /** Default trigram similarity threshold. */
  trigramDefaultSimilarity: 0.3,
  /** Maximum synonym expansion depth (prevent runaway chains). */
  maxSynonymDepth: 2,
} as const;

/**
 * Ranking weights for multi-signal scoring.
 *
 * These are tunable without a migration. The final rank is:
 *   rank = w_fts * fts_score
 *        + w_trigram * trigram_score
 *        + w_score * entity_score
 *        + w_recency * recency_score
 */
export const SEARCH_RANKING_WEIGHTS = {
  /** Full-text search score weight. */
  fullText: 0.40,
  /** Trigram similarity score weight. */
  trigram: 0.25,
  /** Entity quality score weight (product score, brand activity, etc.). */
  entityScore: 0.20,
  /** Recency weight (newer = higher). */
  recency: 0.15,
} as const;

/**
 * Search log retention and analytics windows.
 */
export const SEARCH_ANALYTICS = {
  /** Rolling window for "trending" searches. */
  trendingWindowHours: 24,
  /** Minimum count to appear in trending. */
  trendingMinCount: 3,
} as const;
