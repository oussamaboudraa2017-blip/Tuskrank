import { Injectable, Logger } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { SEARCH_BOUNDS, SEARCH_RANKING_WEIGHTS } from './constants';
import { SearchEntityType } from './enums';
import type {
  SearchResult,
  SearchResultItem,
  GlobalSearchResult,
  TrendingSearch,
} from './types';

/**
 * Search service — orchestrates queries across the search backend.
 *
 * Responsibilities:
 *   - Normalize user queries (trim, lowercase, collapse whitespace).
 *   - Expand synonyms bidirectionally (capped at `maxSynonymDepth`).
 *   - Execute entity-specific or global searches via the repository.
 *   - Rank results using the configurable multi-signal weights.
 *   - Log search events asynchronously (fire-and-forget).
 *
 * The service never calls the database directly — all persistence
 * goes through `SearchRepository`. For write operations (`products`
 * service), see the `ProductsService`.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly searchRepo: SearchRepository) {}

  /* ================================================================
   * Entity-specific search
   * ================================================================ */

  /**
   * Search products by query.
   */
  async searchProducts(params: {
    q: string;
    limit?: number;
    offset?: number;
    petType?: string;
    minScore?: number;
    locale?: string;
  }): Promise<SearchResult> {
    const start = Date.now();
    const query = this.normalize(params.q);

    this.validateQuery(query);

    const { items, total } = await this.searchRepo.searchProducts(query, {
      limit: params.limit,
      offset: params.offset,
      petType: params.petType,
      minScore: params.minScore,
      locale: params.locale,
    });

    const ranked = this.rankResults(items);
    const latencyMs = Date.now() - start;

    this.logSearchAsync(query, total, latencyMs, params.locale).catch((err) => {
      this.logger.warn(`Failed to log search: ${err.message}`);
    });

    return {
      query,
      total,
      items: ranked,
      strategies: this.detectStrategies(items),
      latencyMs,
    };
  }

  /**
   * Search brands by query.
   */
  async searchBrands(params: {
    q: string;
    limit?: number;
    offset?: number;
    locale?: string;
  }): Promise<SearchResult> {
    const start = Date.now();
    const query = this.normalize(params.q);

    this.validateQuery(query);

    const { items, total } = await this.searchRepo.searchBrands(query, {
      limit: params.limit,
      offset: params.offset,
      locale: params.locale,
    });

    const ranked = this.rankResults(items);
    const latencyMs = Date.now() - start;

    this.logSearchAsync(query, total, latencyMs, params.locale).catch((err) => {
      this.logger.warn(`Failed to log search: ${err.message}`);
    });

    return {
      query,
      total,
      items: ranked,
      strategies: this.detectStrategies(items),
      latencyMs,
    };
  }

  /**
   * Search ingredients by query.
   */
  async searchIngredients(params: {
    q: string;
    limit?: number;
    offset?: number;
    locale?: string;
  }): Promise<SearchResult> {
    const start = Date.now();
    const query = this.normalize(params.q);

    this.validateQuery(query);

    const { items, total } = await this.searchRepo.searchIngredients(query, {
      limit: params.limit,
      offset: params.offset,
      locale: params.locale,
    });

    const ranked = this.rankResults(items);
    const latencyMs = Date.now() - start;

    this.logSearchAsync(query, total, latencyMs, params.locale).catch((err) => {
      this.logger.warn(`Failed to log search: ${err.message}`);
    });

    return {
      query,
      total,
      items: ranked,
      strategies: this.detectStrategies(items),
      latencyMs,
    };
  }

  /* ================================================================
   * Global search
   * ================================================================ */

  /**
   * Search across all entity types.
   */
  async searchGlobal(params: {
    q: string;
    limit?: number;
    petType?: string;
    minScore?: number;
    locale?: string;
    types?: string;
  }): Promise<GlobalSearchResult> {
    const start = Date.now();
    const query = this.normalize(params.q);

    this.validateQuery(query);

    const { products, brands, ingredients, total } =
      await this.searchRepo.searchGlobal(query, {
        limit: params.limit,
        petType: params.petType,
        minScore: params.minScore,
        locale: params.locale,
      });

    const rankedProducts = this.rankResults(products);
    const rankedBrands = this.rankResults(brands);
    const rankedIngredients = this.rankResults(ingredients);

    const allItems = [...rankedProducts, ...rankedBrands, ...rankedIngredients];
    const latencyMs = Date.now() - start;

    this.logSearchAsync(query, total, latencyMs, params.locale).catch((err) => {
      this.logger.warn(`Failed to log search: ${err.message}`);
    });

    return {
      query,
      total,
      products: rankedProducts,
      brands: rankedBrands,
      ingredients: rankedIngredients,
      strategies: this.detectStrategies(allItems),
      latencyMs,
    };
  }

  /* ================================================================
   * Autocomplete
   * ================================================================ */

  /**
   * Prefix-based autocomplete suggestions.
   */
  async autocomplete(params: {
    q: string;
    types?: string;
    limit?: number;
    locale?: string;
  }): Promise<ReadonlyArray<SearchResultItem>> {
    const prefix = this.normalize(params.q);

    if (prefix.length < SEARCH_BOUNDS.autocompleteMinLength) {
      return [];
    }

    const entityTypes = this.parseEntityTypes(params.types);

    const results = await this.searchRepo.autocomplete(prefix, {
      entityTypes,
      limit: params.limit,
      locale: params.locale,
    });

    return results;
  }

  /* ================================================================
   * Synonyms
   * ================================================================ */

  /**
   * Expand a query using the search_synonyms table.
   */
  async expandSynonyms(params: {
    q: string;
    locale?: string;
  }): Promise<ReadonlyArray<string>> {
    const query = this.normalize(params.q);
    return this.searchRepo.expandSynonyms(query, params.locale);
  }

  /* ================================================================
   * Trending
   * ================================================================ */

  /**
   * Get trending searches.
   */
  async getTrending(params: {
    limit?: number;
    locale?: string;
    windowHours?: number;
  } = {}): Promise<ReadonlyArray<TrendingSearch>> {
    return this.searchRepo.getTrending(params);
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  /**
   * Normalize a search query:
   *   1. Trim whitespace.
   *   2. Collapse multiple spaces.
   *   3. Lowercase.
   */
  private normalize(q: string): string {
    return q.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * Validate query length.
   */
  private validateQuery(q: string): void {
    if (q.length < SEARCH_BOUNDS.queryMinLength) {
      throw new Error('Query is too short');
    }
    if (q.length > SEARCH_BOUNDS.queryMaxLength) {
      throw new Error('Query is too long');
    }
  }

  /**
   * Parse comma-separated entity type string into typed array.
   * Falls back to all types if invalid.
   */
  private parseEntityTypes(
    types?: string,
  ): ReadonlyArray<SearchEntityType> {
    if (!types || types.trim() === '') {
      return [SearchEntityType.Product, SearchEntityType.Brand, SearchEntityType.Ingredient];
    }

    const parsed = types
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) =>
        Object.values(SearchEntityType).includes(t as SearchEntityType),
      );

    if (parsed.length === 0) {
      return [SearchEntityType.Product, SearchEntityType.Brand, SearchEntityType.Ingredient];
    }

    return parsed as ReadonlyArray<SearchEntityType>;
  }

  /**
   * Re-rank results using the multi-signal ranking weights.
   *
   * The repository returns `search_score` (0..1). We layer on:
   *   - Entity quality score (`overallScore` for products, 0 otherwise).
   *   - Recency (not yet implemented — all items treated as equally recent).
   *
   * Final score: `w_fts * fts + w_trigram * tri + w_entity * entity + w_recency * recency`.
   */
  private rankResults(items: ReadonlyArray<SearchResultItem>): SearchResultItem[] {
    return [...items]
      .map((item) => {
        const fts = item.matchedBy === 'full_text' ? item.score : 0;
        const tri = item.matchedBy === 'trigram' ? item.score : 0;
        const entityScore = (item.overallScore ?? 0) / 100;
        const recency = 0.5; // Default mid-point until we have timestamps.

        const final =
          SEARCH_RANKING_WEIGHTS.fullText * fts +
          SEARCH_RANKING_WEIGHTS.trigram * tri +
          SEARCH_RANKING_WEIGHTS.entityScore * entityScore +
          SEARCH_RANKING_WEIGHTS.recency * recency;

        return { ...item, score: Math.min(1, Math.max(0, final)) };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Detect which strategies were used across a set of results.
   */
  private detectStrategies(items: ReadonlyArray<SearchResultItem>): string[] {
    const strategies = new Set<string>();
    for (const item of items) {
      strategies.add(item.matchedBy);
    }
    return Array.from(strategies);
  }

  /**
   * Log a search event asynchronously (fire-and-forget).
   */
  private async logSearchAsync(
    query: string,
    resultCount: number,
    latencyMs: number,
    _locale?: string,
  ): Promise<void> {
    try {
      await this.searchRepo.logSearch({
        normalized: query,
        raw: query,
        resultCount,
        latencyMs,
      });
    } catch {
      // Logging failures are non-critical — swallow.
    }
  }
}
