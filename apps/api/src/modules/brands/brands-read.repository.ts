import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import { SortOrder } from './domain/enums';
import type { BrandQuery, BrandSearchInput } from './domain/interfaces';

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

@Injectable()
export class BrandsReadRepository extends BaseRepository {
  protected readonly tableName = 'brands';

  private readonly logger = new Logger(BrandsReadRepository.name);

  private static readonly SORT_FIELD_MAP: Record<string, string> = {
    created_at: 'b.created_at',
    name: 'b.name',
    product_count: 'COALESCE(b._product_count, 0)',
    avg_score: 'COALESCE(b._avg_overall_score, 0)',
  };

  private baseQuery(): string {
    return `
      SELECT
        b.id, b.name, b.slug, b.manufacturer, b.country_code,
        b.website_url, b.description, b.logo_image_url,
        b.is_active, b.created_at, b.updated_at, b.deleted_at,
        COALESCE(pc.cnt, 0) AS product_count,
        ps.avg_overall_score, ps.avg_quality_score, ps.avg_safety_score,
        ps.avg_nutrition_score, ps.avg_transparency_score,
        COALESCE(rc.open_count, 0) AS open_recall_count
      FROM brands b
      LEFT JOIN (
        SELECT brand_id, COUNT(*)::int AS cnt
        FROM products WHERE deleted_at IS NULL AND is_active = true
        GROUP BY brand_id
      ) pc ON pc.brand_id = b.id
      LEFT JOIN (
        SELECT p.brand_id,
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
        FROM recalls WHERE deleted_at IS NULL AND status IN ('active', 'pending')
        GROUP BY brand_id
      ) rc ON rc.brand_id = b.id
    `;
  }

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
        `(b.name ILIKE '%' || $${idx} || '%' OR b.manufacturer ILIKE '%' || $${idx} || '%')`,
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

    const sortCol = BrandsReadRepository.SORT_FIELD_MAP[query.sort.by] ?? 'b.name';
    const sortDir = query.sort.order === SortOrder.Asc ? 'ASC' : 'DESC';
    const nullsSort = (query.sort.by as string) === 'avg_score' ? ' NULLS LAST' : '';

    const limit = query.pagination.limit;
    const offset = (query.pagination.page - 1) * limit;

    values.push(limit, offset);
    const sql = `
      ${this.baseQuery()}
      ${where}
      ORDER BY ${sortCol} ${sortDir}${nullsSort}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await this.query<BrandRow>(sql, values);
    return result.rows;
  }

  async count(filters: BrandQuery['filters']): Promise<number> {
    const { conditions, values } = this.buildFilters(filters);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const sql = `SELECT COUNT(DISTINCT b.id)::int AS total FROM brands b ${where}`;
    const result = await this.query<{ total: number }>(sql, values);
    return result.rows[0]?.total ?? 0;
  }

  async search(input: BrandSearchInput): Promise<{ items: BrandRow[]; total: number }> {
    const conditions = [
      'b.deleted_at IS NULL',
      'b.is_active = true',
      `(b.name ILIKE '%' || $1 || '%' OR b.manufacturer ILIKE '%' || $1 || '%')`,
    ];

    const limit = input.limit ?? 20;
    const offset = ((input.page ?? 1) - 1) * limit;

    const countSql = `SELECT COUNT(DISTINCT b.id)::int AS total FROM brands b WHERE ${conditions.join(' AND ')}`;
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

  async findByIds(ids: readonly Uuid[]): Promise<BrandRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `${this.baseQuery()} WHERE b.id IN (${placeholders}) AND b.deleted_at IS NULL`;
    const result = await this.query<BrandRow>(sql, [...ids]);
    return result.rows;
  }

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

  async countProducts(brandId: Uuid): Promise<number> {
    const sql = `SELECT COUNT(*)::int AS total FROM products WHERE brand_id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ total: number }>(sql, [brandId]);
    return result.rows[0]?.total ?? 0;
  }
}
