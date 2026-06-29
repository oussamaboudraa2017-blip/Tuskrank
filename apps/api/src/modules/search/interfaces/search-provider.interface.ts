import type { SearchResultItem } from '../types';
import type { SearchEntityType } from '../enums';

/**
 * Provider interface for search backends.
 *
 * The repository implements this interface against PostgreSQL.
 * A future Elasticsearch / Meilisearch adapter would implement the
 * same contract, allowing the service to swap backends without
 * changing the controller layer.
 */
export interface SearchProvider {
  /**
   * Full-text search across one or more entity types.
   *
   * @param query   - The user's search string.
   * @param options - Entity type filter, pagination, locale.
   * @returns Ranked search results.
   */
  search(
    query: string,
    options: {
      entityTypes?: ReadonlyArray<SearchEntityType>;
      limit?: number;
      offset?: number;
      locale?: string;
    },
  ): Promise<ReadonlyArray<SearchResultItem>>;

  /**
   * Count total results for a query (before pagination).
   */
  count(
    query: string,
    options: {
      entityTypes?: ReadonlyArray<SearchEntityType>;
      locale?: string;
    },
  ): Promise<number>;

  /**
   * Autocomplete suggestions for a prefix.
   */
  autocomplete(
    prefix: string,
    options: {
      entityTypes?: ReadonlyArray<SearchEntityType>;
      limit?: number;
      locale?: string;
    },
  ): Promise<ReadonlyArray<SearchResultItem>>;
}
