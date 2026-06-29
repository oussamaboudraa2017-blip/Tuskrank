import { Injectable, Logger } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import { SortOrder } from './domain/enums';
import type { BrandQuery, BrandSearchInput } from './domain/interfaces';

/**
 * Wire-side row shape returned by the repository's enriched queries.
 */
export interface BrandRow {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly country_code: string | null;
  readonly website_url: string | null;
  readonly description: string | null;
  readonly logo_image_url: string | null;
  readonly is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;
  readonly deleted_at: Date | null;
  readonly product_count?: string | number;
  readonly avg_overall_score?: string | number | null;
  readonly avg_quality_score?: string | number | null;
  readonly avg_safety_score?: string | number | null;
  readonly avg_nutrition_score?: string | number | null;
  readonly avg_transparency_score?: string | number | null;
  readonly open_recall_count?: string | number;
}

/**
 * Brands repository — queries against PostgreSQL.
 *
 * All queries use `$1`-bound parameters. No raw interpolation.
 */
@Injectable()
export class BrandsRepository extends BaseRepository {
  protected readonly tableName = 'brands';

  private readonly logger = new Logger(BrandsRepository.name);

  /* ------------------------------------------------------------------
   * Sort field map
   * ------------------------------------------------------------------ */

  private static readonly SORT_FIELD_MAP: Record<string, string> = {
    [String('created_at')]: 'b.created_at',
    [String('name')]: 'b.name',
    [String('product_count')]: 'COALESCE(b._product_count, 0)',
    [String('avg_score')]: 'COALESCE(b._avg_overall_score, 0)',
  };

  /* ------------------------------------------------------------------
   * Base query (with joined stats)
   * ------------------------------------------------------------------ */

  private baseQuery(): string {
    return `
      SELECT
        b.id, b.name, b.slug, b.manufacturer, b.country_code,
        b.website_url, b.description, b.logo_image_url,
        b.is_active, b.created_at, b.updated_at, b.deleted_at,
        COALESCE(pc.cnt, 0) AS product_count,
        ps.avg_overall_score,
        ps.avg_quality_score,
        ps.avg_safety_score,
        ps.avg_nutrition_score,
        ps.avg_transparency_score,
        COALESCE(rc.open_count, 0) AS open_recall_count
      FROM brands b
      LEFT JOIN (
        SELECT brand_id, COUNT(*)::int AS cnt
        FROM products
        WHERE deleted_at IS NULL AND is_active = true
        GROUP BY brand_id
      ) pc ON pc.brand_id = b.id
      LEFT JOIN (
        SELECT
          p.brand_id,
          AVG(p.overall_score) AS avg_overall_score,
          AVG(p.quality_score) AS avg_quality_score,
          AVG(p.safety_score) AS avg_safety_score,
          AVG(p.nutrition_score) AS avg_nutrition_score,
          AVG(p.transparency_score) AS avg_transparency_score
        FROM products p
        WHERE p.deleted_at IS NULL AND p.is_active = true
        GROUP BY p.brand_id
      ) ps ON ps.brand_id = b.id
      LEFT JOIN (
        SELECT brand_id, COUNT(*)::int AS open_count
        FROM recalls
        WHERE deleted_at IS NULL AND status IN ('active', 'pending')
        GROUP BY brand_id
      ) rc ON rc.brand_id = b.id
    `;
  }

  /* ------------------------------------------------------------------
   * Filter builder
   * ------------------------------------------------------------------ */

  private buildFilters(filters: BrandQuery['filters']): {
    conditions: string[];
    values: unknown[];
  } {
    const conditions: string[] = ['b.deleted_at IS NULL'];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.q) {
      values.push(filters.q);
      conditions.push(
        `(b.name ILIKE '%' || $${idx} || '%'
          OR b.manufacturer ILIKE '%' || $${idx} || '%')`,
      );
      idx++;
    }

    if (filters.countryCode) {
      values.push(filters.countryCode);
      conditions.push(`b.country_code = $${idx}`);
      idx++;
    }

    if (filters.isActive !== undefined) {
      values.push(filters.isActive);
      conditions.push(`b.is_active = $${idx}`);
      idx++;
    }

    return { conditions, values };
  }

  /* ------------------------------------------------------------------
   * Read methods
   * ------------------------------------------------------------------ */

  async findById(id: Uuid, options: { includeSoftDeleted?: boolean } = {}): Promise<BrandRow | null> {
    const conditions = ['b.id = $1'];
    if (!options.includeSoftDeleted) {
      conditions.push('b.deleted_at IS NULL');
    }

    const sql = `${this.baseQuery()} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query<BrandRow>(sql, [id]);
    return result.rows[0] ?? null;
  }

  async findBySlug(slug: string, options: { includeSoftDeleted?: boolean } = {}): Promise<BrandRow | null> {
    const conditions = ['b.slug = $1'];
    if (!options.includeSoftDeleted) {
      conditions.push('b.deleted_at IS NULL');
    }

    const sql = `${this.baseQuery()} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query<BrandRow>(sql, [slug]);
    return result.rows[0] ?? null;
  }

  async findMany(query: BrandQuery): Promise<BrandRow[]> {
    const { conditions, values } = this.buildFilters(query.filters);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const sortCol = BrandsRepository.SORT_FIELD_MAP[query.sort.by] ?? 'b.name';
    const sortDir = query.sort.order === SortOrder.Asc ? 'ASC' : 'DESC';
    const nullsSort = query.sort.by === String('avg_score') ? ' NULLS LAST' : '';

    const limit = query.pagination.limit;
    const offset = (query.pagination.page - 1) * limit;

    values.push(limit, offset);
    const sql = `
      ${this.baseQuery()}
      ${where}
      ORDER BY ${sortCol}${sortDir}${nullsSort}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await this.query<BrandRow>(sql, values);
    return result.rows;
  }

  async count(filters: BrandQuery['filters']): Promise<number> {
    const { conditions, values } = this.buildFilters(filters);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const sql = `
      SELECT COUNT(DISTINCT b.id)::int AS total
      FROM brands b
      ${where}
    `;

    const result = await this.query<{ total: number }>(sql, values);
    return result.rows[0]?.total ?? 0;
  }

  async search(input: BrandSearchInput): Promise<{ items: BrandRow[]; total: number }> {
    const conditions = [
      'b.deleted_at IS NULL',
      'b.is_active = true',
      `(b.name ILIKE '%' || $1 || '%'
        OR b.manufacturer ILIKE '%' || $1 || '%')`,
    ];

    const limit = input.limit ?? 20;
    const offset = ((input.page ?? 1) - 1) * limit;

    const countSql = `
      SELECT COUNT(DISTINCT b.id)::int AS total
      FROM brands b
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await this.query<{ total: number }>(countSql, [input.q]);
    const total = countResult.rows[0]?.total ?? 0;

    const values: unknown[] = [input.q, limit, offset];
    const sql = `
      ${this.baseQuery()}
      WHERE ${conditions.join(' AND ')}
      ORDER BY b.name ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.query<BrandRow>(sql, values);
    return { items: result.rows, total };
  }

  /* ------------------------------------------------------------------
   * Featured brands (top by product count + score)
   * ------------------------------------------------------------------ */

  async findFeatured(limit = 10): Promise<BrandRow[]> {
    const sql = `
      ${this.baseQuery()}
      WHERE b.deleted_at IS NULL AND b.is_active = true
      ORDER BY COALESCE(pc.cnt, 0) DESC, COALESCE(ps.avg_overall_score, 0) DESC
      LIMIT $1
    `;
    const result = await this.query<BrandRow>(sql, [limit]);
    return result.rows;
  }

  /* ------------------------------------------------------------------
   * Existence checks
   * ------------------------------------------------------------------ */

  async exists(id: Uuid, options: { excludeId?: Uuid; includeSoftDeleted?: boolean } = {}): Promise<boolean> {
    const conditions = ['b.id = $1'];
    if (!options.includeSoftDeleted) {
      conditions.push('b.deleted_at IS NULL');
    }
    const sql = `SELECT EXISTS(SELECT 1 FROM brands b WHERE ${conditions.join(' AND ')}) AS "exists"`;
    const result = await this.query<{ exists: boolean }>(sql, [id]);
    return result.rows[0]?.exists ?? false;
  }

  async existsBySlug(slug: string, excludeId?: Uuid): Promise<boolean> {
    const conditions = ['slug = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [slug];
    if (excludeId) {
      values.push(excludeId);
      conditions.push(`id != $${values.length}`);
    }
    const sql = `SELECT EXISTS(SELECT 1 FROM brands WHERE ${conditions.join(' AND ')}) AS "exists"`;
    const result = await this.query<{ exists: boolean }>(sql, values);
    return result.rows[0]?.exists ?? false;
  }

  /* ------------------------------------------------------------------
   * Mutation methods
   * ------------------------------------------------------------------ */

  async create(
    data: {
      name: string;
      slug: string;
      manufacturer?: string | null;
      countryCode?: string | null;
      websiteUrl?: string | null;
      description?: string | null;
      logoImageUrl?: string | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<BrandRow> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO brands (
        name, slug, manufacturer, country_code, website_url,
        description, logo_image_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await run<BrandRow>(sql, [
      data.name,
      data.slug,
      data.manufacturer ?? null,
      data.countryCode ?? null,
      data.websiteUrl ?? null,
      data.description ?? null,
      data.logoImageUrl ?? null,
      data.isActive ?? true,
    ]);
    return result.rows[0];
  }

  async update(
    id: Uuid,
    data: {
      name?: string;
      slug?: string;
      manufacturer?: string | null;
      countryCode?: string | null;
      websiteUrl?: string | null;
      description?: string | null;
      logoImageUrl?: string | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<BrandRow> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { setClauses.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.manufacturer !== undefined) { setClauses.push(`manufacturer = $${idx++}`); values.push(data.manufacturer); }
    if (data.countryCode !== undefined) { setClauses.push(`country_code = $${idx++}`); values.push(data.countryCode); }
    if (data.websiteUrl !== undefined) { setClauses.push(`website_url = $${idx++}`); values.push(data.websiteUrl); }
    if (data.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(data.description); }
    if (data.logoImageUrl !== undefined) { setClauses.push(`logo_image_url = $${idx++}`); values.push(data.logoImageUrl); }
    if (data.isActive !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const sql = `
      UPDATE brands SET ${setClauses.join(', ')}
      WHERE id = $${idx} AND deleted_at IS NULL
      RETURNING *
    `;
    const result = await run<BrandRow>(sql, values);
    return result.rows[0];
  }

  async softDelete(id: Uuid, client?: PoolClient): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `UPDATE brands SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`;
    await run(sql, [id]);
  }

  async restore(id: Uuid, client?: PoolClient): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `UPDATE brands SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`;
    await run(sql, [id]);
  }

  /* ------------------------------------------------------------------
   * Product count for a brand
   * ------------------------------------------------------------------ */

  async countProducts(brandId: Uuid): Promise<number> {
    const sql = `SELECT COUNT(*)::int AS total FROM products WHERE brand_id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ total: number }>(sql, [brandId]);
    return result.rows[0]?.total ?? 0;
  }
}
