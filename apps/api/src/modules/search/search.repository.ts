import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database';
import type { Uuid } from '@types';
import type { SearchResultItem } from './types';
import { SearchEntityType } from './enums';
import { SEARCH_BOUNDS } from './constants';

/**
 * Search repository — PostgreSQL full-text search implementation.
 *
 * Uses `pg_trgm` for fuzzy matching, `tsvector`/`tsquery` for
 * full-text search, and `search_keywords` for keyword-based lookup.
 *
 * All queries use `$1`-bound parameters. No raw interpolation.
 *
 * Future: swap this implementation for an Elasticsearch /
 * Meilisearch adapter by implementing the `SearchProvider` interface.
 */
@Injectable()
export class SearchRepository {
  private readonly logger = new Logger(SearchRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /* ================================================================
   * Full-text search
   * ================================================================ */

  /**
   * Search products using PostgreSQL full-text search + trigram similarity.
   *
   * Strategy:
   *   1. FTS via `to_tsvector('english', p.name) @@ to_tsquery(...)`.
   *   2. Trigram similarity via `similarity(p.name, $1)`.
   *   3. Keyword table lookup via `search_keywords`.
   *   Results are deduplicated and ranked by a composite score.
   */
  async searchProducts(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      petType?: string;
      minScore?: number;
      locale?: string;
      minSimilarity?: number;
    } = {},
  ): Promise<{ items: ReadonlyArray<SearchResultItem>; total: number }> {
    const limit = options.limit ?? SEARCH_BOUNDS.defaultLimit;
    const offset = options.offset ?? 0;
    const tsQuery = this.toTsQuery(query);
    const minSim = options.minSimilarity ?? SEARCH_BOUNDS.trigramDefaultSimilarity;

    const conditions: string[] = [
      'p.deleted_at IS NULL',
      'p.is_active = true',
      'p.published_at IS NOT NULL',
    ];
    const values: unknown[] = [query, tsQuery, minSim];
    let idx = 4;

    if (options.petType) {
      values.push(options.petType);
      conditions.push(
        `EXISTS (SELECT 1 FROM product_targeting pt
          JOIN pet_types pt2 ON pt2.id = pt.pet_type_id
          WHERE pt.product_id = p.id AND pt2.slug = $${idx} AND pt.is_active = true)`,
      );
      idx++;
    }
    if (options.minScore !== undefined) {
      values.push(options.minScore);
      conditions.push(
        `EXISTS (SELECT 1 FROM product_scores ps
          WHERE ps.product_id = p.id AND ps.is_current = true
            AND ps.overall_score >= $${idx})`,
      );
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT p.id)::int AS total
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_ingredients pi ON pi.product_id = p.id AND pi.deleted_at IS NULL
      LEFT JOIN ingredients i ON i.id = pi.ingredient_id
      LEFT JOIN search_keywords sk ON sk.entity_id = p.id AND sk.entity_type = 'product' AND sk.deleted_at IS NULL
      ${where}
        AND (
          to_tsvector('english', p.name) @@ to_tsquery('english', $2)
          OR similarity(p.name, $1) >= $3
          OR i.name IS NOT NULL AND to_tsvector('english', i.name) @@ to_tsquery('english', $2)
          OR sk.normalized % $1
        )
    `;
    const countResult = await this.db.query<{ total: number }>(countSql, values);
    const total = countResult.rows[0]?.total ?? 0;

    // Search query
    values.push(limit, offset);
    const searchSql = `
      SELECT DISTINCT ON (p.id)
        p.id,
        'product'::text AS entity_type,
        p.name,
        p.slug,
        b.name AS brand_name,
        b.slug AS brand_slug,
        COALESCE(ps.overall_score, 0) AS overall_score,
        ps.scoring_version,
        ps.grade,
        (SELECT pi2.public_url FROM product_images pi2
         WHERE pi2.product_id = p.id AND pi2.is_primary AND pi2.deleted_at IS NULL
         LIMIT 1) AS image_url,
        GREATEST(
          ts_rank(to_tsvector('english', p.name), to_tsquery('english', $2)) * 0.5,
          similarity(p.name, $1) * 0.3,
          CASE WHEN sk.normalized % $1 THEN 0.2 ELSE 0 END
        ) AS search_score
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_scores ps ON ps.product_id = p.id AND ps.is_current = true AND ps.deleted_at IS NULL
      LEFT JOIN product_ingredients pi ON pi.product_id = p.id AND pi.deleted_at IS NULL
      LEFT JOIN ingredients i ON i.id = pi.ingredient_id
      LEFT JOIN search_keywords sk ON sk.entity_id = p.id AND sk.entity_type = 'product' AND sk.deleted_at IS NULL
      ${where}
        AND (
          to_tsvector('english', p.name) @@ to_tsquery('english', $2)
          OR similarity(p.name, $1) >= $3
          OR i.name IS NOT NULL AND to_tsvector('english', i.name) @@ to_tsquery('english', $2)
          OR sk.normalized % $1
        )
      ORDER BY p.id, search_score DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;
    const result = await this.db.query<{
      id: Uuid;
      entity_type: string;
      name: string;
      slug: string;
      brand_name: string | null;
      brand_slug: string | null;
      overall_score: number | null;
      grade: string | null;
      image_url: string | null;
      search_score: number;
    }>(searchSql, values);

    const items: SearchResultItem[] = result.rows.map((r: {
      id: Uuid; entity_type: string; name: string; slug: string;
      brand_name: string | null; brand_slug: string | null;
      overall_score: number | null; grade: string | null;
      image_url: string | null; search_score: number;
    }) => ({
      id: r.id,
      entityType: SearchEntityType.Product,
      name: r.name,
      slug: r.slug,
      score: Math.min(1, Math.max(0, r.search_score)),
      matchedBy: this.detectMatchStrategy(r.search_score, query, r.name),
      snippet: null,
      brandName: r.brand_name,
      brandSlug: r.brand_slug,
      overallScore: r.overall_score,
      grade: r.grade,
      imageUrl: r.image_url,
    }));

    return { items, total };
  }

  /**
   * Search brands using trigram similarity + keyword lookup.
   */
  async searchBrands(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      locale?: string;
      minSimilarity?: number;
    } = {},
  ): Promise<{ items: ReadonlyArray<SearchResultItem>; total: number }> {
    const limit = options.limit ?? SEARCH_BOUNDS.defaultLimit;
    const offset = options.offset ?? 0;
    const minSim = options.minSimilarity ?? SEARCH_BOUNDS.trigramDefaultSimilarity;

    const conditions: string[] = [
      'b.deleted_at IS NULL',
      'b.is_active = true',
    ];
    const values: unknown[] = [query, minSim];
    let idx = 3;

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(DISTINCT b.id)::int AS total
      FROM brands b
      LEFT JOIN search_keywords sk ON sk.entity_id = b.id AND sk.entity_type = 'brand' AND sk.deleted_at IS NULL
      ${where}
        AND (
          similarity(b.name, $1) >= $2
          OR b.name ILIKE '%' || $1 || '%'
          OR sk.normalized % $1
        )
    `;
    const countResult = await this.db.query<{ total: number }>(countSql, values);
    const total = countResult.rows[0]?.total ?? 0;

    values.push(limit, offset);
    const searchSql = `
      SELECT DISTINCT ON (b.id)
        b.id,
        'brand'::text AS entity_type,
        b.name,
        b.slug,
        NULL::text AS brand_name,
        NULL::text AS brand_slug,
        NULL::numeric AS overall_score,
        NULL::text AS grade,
        b.logo_image_url AS image_url,
        GREATEST(
          similarity(b.name, $1) * 0.6,
          CASE WHEN b.name ILIKE '%' || $1 || '%' THEN 0.3 ELSE 0 END,
          CASE WHEN sk.normalized % $1 THEN 0.1 ELSE 0 END
        ) AS search_score
      FROM brands b
      LEFT JOIN search_keywords sk ON sk.entity_id = b.id AND sk.entity_type = 'brand' AND sk.deleted_at IS NULL
      ${where}
        AND (
          similarity(b.name, $1) >= $2
          OR b.name ILIKE '%' || $1 || '%'
          OR sk.normalized % $1
        )
      ORDER BY b.id, search_score DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;
    const result = await this.db.query<{
      id: Uuid;
      entity_type: string;
      name: string;
      slug: string;
      brand_name: string | null;
      brand_slug: string | null;
      overall_score: number | null;
      grade: string | null;
      image_url: string | null;
      search_score: number;
    }>(searchSql, values);

    const items: SearchResultItem[] = result.rows.map((r: {
      id: Uuid; entity_type: string; name: string; slug: string;
      brand_name: string | null; brand_slug: string | null;
      overall_score: number | null; grade: string | null;
      image_url: string | null; search_score: number;
    }) => ({
      id: r.id,
      entityType: SearchEntityType.Brand,
      name: r.name,
      slug: r.slug,
      score: Math.min(1, Math.max(0, r.search_score)),
      matchedBy: 'trigram',
      snippet: null,
      brandName: null,
      brandSlug: null,
      overallScore: null,
      grade: null,
      imageUrl: r.image_url,
    }));

    return { items, total };
  }

  /**
   * Search ingredients using trigram similarity + keyword lookup.
   */
  async searchIngredients(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      locale?: string;
      minSimilarity?: number;
    } = {},
  ): Promise<{ items: ReadonlyArray<SearchResultItem>; total: number }> {
    const limit = options.limit ?? SEARCH_BOUNDS.defaultLimit;
    const offset = options.offset ?? 0;
    const minSim = options.minSimilarity ?? SEARCH_BOUNDS.trigramDefaultSimilarity;

    const conditions: string[] = [
      'i.deleted_at IS NULL',
      'i.is_active = true',
    ];
    const values: unknown[] = [query, minSim];
    let idx = 3;

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countSql = `
      SELECT COUNT(DISTINCT i.id)::int AS total
      FROM ingredients i
      LEFT JOIN search_keywords sk ON sk.entity_id = i.id AND sk.entity_type = 'ingredient' AND sk.deleted_at IS NULL
      ${where}
        AND (
          similarity(i.name, $1) >= $2
          OR i.name ILIKE '%' || $1 || '%'
          OR sk.normalized % $1
        )
    `;
    const countResult = await this.db.query<{ total: number }>(countSql, values);
    const total = countResult.rows[0]?.total ?? 0;

    values.push(limit, offset);
    const searchSql = `
      SELECT DISTINCT ON (i.id)
        i.id,
        'ingredient'::text AS entity_type,
        i.name,
        i.slug,
        NULL::text AS brand_name,
        NULL::text AS brand_slug,
        NULL::numeric AS overall_score,
        NULL::text AS grade,
        NULL::text AS image_url,
        GREATEST(
          similarity(i.name, $1) * 0.6,
          CASE WHEN i.name ILIKE '%' || $1 || '%' THEN 0.3 ELSE 0 END,
          CASE WHEN sk.normalized % $1 THEN 0.1 ELSE 0 END
        ) AS search_score
      FROM ingredients i
      LEFT JOIN search_keywords sk ON sk.entity_id = i.id AND sk.entity_type = 'ingredient' AND sk.deleted_at IS NULL
      ${where}
        AND (
          similarity(i.name, $1) >= $2
          OR i.name ILIKE '%' || $1 || '%'
          OR sk.normalized % $1
        )
      ORDER BY i.id, search_score DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;
    const result = await this.db.query<{
      id: Uuid;
      entity_type: string;
      name: string;
      slug: string;
      brand_name: string | null;
      brand_slug: string | null;
      overall_score: number | null;
      grade: string | null;
      image_url: string | null;
      search_score: number;
    }>(searchSql, values);

    const items: SearchResultItem[] = result.rows.map((r: {
      id: Uuid; entity_type: string; name: string; slug: string;
      brand_name: string | null; brand_slug: string | null;
      overall_score: number | null; grade: string | null;
      image_url: string | null; search_score: number;
    }) => ({
      id: r.id,
      entityType: SearchEntityType.Ingredient,
      name: r.name,
      slug: r.slug,
      score: Math.min(1, Math.max(0, r.search_score)),
      matchedBy: 'trigram',
      snippet: null,
      brandName: null,
      brandSlug: null,
      overallScore: null,
      grade: null,
      imageUrl: r.image_url,
    }));

    return { items, total };
  }

  /* ================================================================
   * Global search
   * ================================================================ */

  /**
   * Search across all entity types, returning grouped results.
   */
  async searchGlobal(
    query: string,
    options: {
      limit?: number;
      petType?: string;
      minScore?: number;
      locale?: string;
      minSimilarity?: number;
    } = {},
  ): Promise<{
    products: ReadonlyArray<SearchResultItem>;
    brands: ReadonlyArray<SearchResultItem>;
    ingredients: ReadonlyArray<SearchResultItem>;
    total: number;
  }> {
    const limit = options.limit ?? SEARCH_BOUNDS.defaultLimit;

    const [productResults, brandResults, ingredientResults] = await Promise.all([
      this.searchProducts(query, { ...options, limit }),
      this.searchBrands(query, { ...options, limit }),
      this.searchIngredients(query, { ...options, limit }),
    ] as const);

    const total = productResults.total + brandResults.total + ingredientResults.total;

    return {
      products: productResults.items,
      brands: brandResults.items,
      ingredients: ingredientResults.items,
      total,
    };
  }

  /* ================================================================
   * Autocomplete
   * ================================================================ */

  /**
   * Prefix-based autocomplete using trigram + ILIKE.
   */
  async autocomplete(
    prefix: string,
    options: {
      entityTypes?: ReadonlyArray<SearchEntityType>;
      limit?: number;
      locale?: string;
    } = {},
  ): Promise<ReadonlyArray<SearchResultItem>> {
    const limit = options.limit ?? SEARCH_BOUNDS.autocompleteMaxLimit;
    const types = options.entityTypes ?? [
      SearchEntityType.Product,
      SearchEntityType.Brand,
      SearchEntityType.Ingredient,
    ];
    const results: SearchResultItem[] = [];

    if (types.includes(SearchEntityType.Product)) {
      const sql = `
        SELECT p.id, 'product'::text AS entity_type, p.name, p.slug,
               b.name AS brand_name, b.slug AS brand_slug,
               COALESCE(ps.overall_score, 0) AS overall_score,
               ps.grade,
               (SELECT pi2.public_url FROM product_images pi2
                WHERE pi2.product_id = p.id AND pi2.is_primary AND pi2.deleted_at IS NULL
                LIMIT 1) AS image_url
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN product_scores ps ON ps.product_id = p.id AND ps.is_current = true AND ps.deleted_at IS NULL
        WHERE p.deleted_at IS NULL AND p.is_active = true AND p.published_at IS NOT NULL
          AND (p.name ILIKE $1 || '%' OR p.name ILIKE '% ' || $1 || '%')
        ORDER BY p.name
        LIMIT $2
      `;
      const res = await this.db.query<{
        id: Uuid; name: string; slug: string;
        brand_name: string | null; brand_slug: string | null;
        overall_score: number | null; grade: string | null; image_url: string | null;
      }>(sql, [prefix, limit]);
      for (const r of res.rows) {
        results.push({
          id: r.id, entityType: SearchEntityType.Product, name: r.name, slug: r.slug,
          score: 1, matchedBy: 'prefix', snippet: null,
          brandName: r.brand_name, brandSlug: r.brand_slug,
          overallScore: r.overall_score, grade: r.grade, imageUrl: r.image_url,
        });
      }
    }

    if (types.includes(SearchEntityType.Brand)) {
      const sql = `
        SELECT b.id, 'brand'::text AS entity_type, b.name, b.slug,
               NULL::text AS brand_name, NULL::text AS brand_slug,
               NULL::numeric AS overall_score, NULL::text AS grade,
               b.logo_image_url AS image_url
        FROM brands b
        WHERE b.deleted_at IS NULL AND b.is_active = true
          AND (b.name ILIKE $1 || '%' OR b.name ILIKE '% ' || $1 || '%')
        ORDER BY b.name
        LIMIT $2
      `;
      const res = await this.db.query<{
        id: Uuid; name: string; slug: string; image_url: string | null;
      }>(sql, [prefix, limit]);
      for (const r of res.rows) {
        results.push({
          id: r.id, entityType: SearchEntityType.Brand, name: r.name, slug: r.slug,
          score: 1, matchedBy: 'prefix', snippet: null,
          brandName: null, brandSlug: null,
          overallScore: null, grade: null, imageUrl: r.image_url,
        });
      }
    }

    if (types.includes(SearchEntityType.Ingredient)) {
      const sql = `
        SELECT i.id, 'ingredient'::text AS entity_type, i.name, i.slug,
               NULL::text AS brand_name, NULL::text AS brand_slug,
               NULL::numeric AS overall_score, NULL::text AS grade,
               NULL::text AS image_url
        FROM ingredients i
        WHERE i.deleted_at IS NULL AND i.is_active = true
          AND (i.name ILIKE $1 || '%' OR i.name ILIKE '% ' || $1 || '%')
        ORDER BY i.name
        LIMIT $2
      `;
      const res = await this.db.query<{
        id: Uuid; name: string; slug: string;
      }>(sql, [prefix, limit]);
      for (const r of res.rows) {
        results.push({
          id: r.id, entityType: SearchEntityType.Ingredient, name: r.name, slug: r.slug,
          score: 1, matchedBy: 'prefix', snippet: null,
          brandName: null, brandSlug: null,
          overallScore: null, grade: null, imageUrl: null,
        });
      }
    }

    return results.slice(0, limit);
  }

  /* ================================================================
   * Synonyms
   * ================================================================ */

  /**
   * Expand a query using search_synonyms (bidirectional).
   */
  async expandSynonyms(
    query: string,
    locale: string = 'en-US',
  ): Promise<ReadonlyArray<string>> {
    const sql = `
      SELECT DISTINCT canonical AS term
      FROM search_synonyms
      WHERE deleted_at IS NULL
        AND (synonym = lower($1) OR canonical = lower($1))
        AND locale = $2
      UNION
      SELECT DISTINCT synonym AS term
      FROM search_synonyms
      WHERE deleted_at IS NULL
        AND (canonical = lower($1) OR synonym = lower($1))
        AND locale = $2
    `;
    const result = await this.db.query<{ term: string }>(sql, [query.toLowerCase(), locale]);
    return result.rows.map((r: { term: string }) => r.term).filter((t: string) => t !== query.toLowerCase());
  }

  /* ================================================================
   * Trending & Analytics
   * ================================================================ */

  /**
   * Get trending searches from the `v_trending_searches` view.
   */
  async getTrending(options: {
    limit?: number;
    locale?: string;
    windowHours?: number;
  } = {}): Promise<ReadonlyArray<{ normalized: string; totalCount: number; latestWindowEnd: Date }>> {
    const limit = options.limit ?? 20;
    const sql = `
      SELECT normalized, total_count, latest_window_end
      FROM v_trending_searches
      ORDER BY total_count DESC
      LIMIT $1
    `;
    const result = await this.db.query<{
      normalized: string;
      total_count: number;
      latest_window_end: Date;
    }>(sql, [limit]);

    return result.rows.map((r: { normalized: string; total_count: number; latest_window_end: Date }) => ({
      normalized: r.normalized,
      totalCount: r.total_count,
      latestWindowEnd: r.latest_window_end,
    }));
  }

  /* ================================================================
   * Search logging
   * ================================================================ */

  /**
   * Log a search event to `search_logs`.
   */
  async logSearch(params: {
    normalized: string;
    raw: string;
    resultCount: number;
    latencyMs: number;
    userId?: Uuid;
    sessionId?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    const sql = `
      INSERT INTO search_logs (
        normalized, raw, result_count, latency_ms,
        user_id, session_id, request_id, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9)
    `;
    await this.db.query(sql, [
      params.normalized,
      params.raw,
      params.resultCount,
      params.latencyMs,
      params.userId ?? null,
      params.sessionId ?? null,
      params.requestId ?? null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
    ]);
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  /**
   * Convert a user query to a tsquery string.
   * Handles multi-word queries by joining with AND.
   */
  private toTsQuery(q: string): string {
    return q
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(' & ');
  }

  /**
   * Detect which strategy matched for a result.
   */
  private detectMatchStrategy(
    score: number,
    query: string,
    name: string,
  ): string {
    if (name.toLowerCase() === query.toLowerCase()) return 'exact';
    if (name.toLowerCase().startsWith(query.toLowerCase())) return 'prefix';
    return 'full_text';
  }
}
