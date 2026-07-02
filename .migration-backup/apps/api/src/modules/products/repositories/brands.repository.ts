import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import type { BrandEntity } from '../entities';

@Injectable()
export class BrandsRepository extends BaseRepository<BrandEntity> {
  protected override readonly tableName = 'brands';

  async findById(id: Uuid): Promise<BrandEntity | null> {
    const sql = `
      SELECT id, name, slug, manufacturer, country_code, website_url,
             description, logo_image_url, is_active, created_at, updated_at, deleted_at
      FROM brands
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await this.query<BrandEntity>(sql, [id]);
    return result.rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<BrandEntity | null> {
    const sql = `
      SELECT id, name, slug, manufacturer, country_code, website_url,
             description, logo_image_url, is_active, created_at, updated_at, deleted_at
      FROM brands
      WHERE slug = $1 AND deleted_at IS NULL
    `;
    const result = await this.query<BrandEntity>(sql, [slug]);
    return result.rows[0] ?? null;
  }

  async listActive(options?: { limit?: number; offset?: number }): Promise<ReadonlyArray<BrandEntity>> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;
    const sql = `
      SELECT id, name, slug, manufacturer, country_code, website_url,
             description, logo_image_url, is_active, created_at, updated_at, deleted_at
      FROM brands
      WHERE deleted_at IS NULL AND is_active = true
      ORDER BY name ASC
      LIMIT $1 OFFSET $2
    `;
    const result = await this.query<BrandEntity>(sql, [limit, offset]);
    return result.rows;
  }

  async count(): Promise<number> {
    const sql = 'SELECT COUNT(*)::int AS total FROM brands WHERE deleted_at IS NULL AND is_active = true';
    const result = await this.query<{ total: number }>(sql);
    return result.rows[0]?.total ?? 0;
  }
}
