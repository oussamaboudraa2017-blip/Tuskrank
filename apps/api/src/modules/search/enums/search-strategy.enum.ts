/**
 * Search strategy used to find results.
 *
 * Strategies are composable — a single query can combine multiple
 * strategies (e.g. FTS + trigram + slug) and merge results by rank.
 */
export enum SearchStrategy {
  /** PostgreSQL full-text search (tsvector / tsquery). */
  FullText = 'full_text',
  /** Trigram similarity (pg_trgm). */
  Trigram = 'trigram',
  /** Direct slug match (exact or prefix). */
  Slug = 'slug',
  /** Exact name match (case-insensitive). */
  Exact = 'exact',
  /** Keyword table lookup (search_keywords). */
  Keyword = 'keyword',
}
