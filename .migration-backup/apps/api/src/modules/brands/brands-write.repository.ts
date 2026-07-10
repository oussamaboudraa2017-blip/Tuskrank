import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import type { BrandRow } from './brands-read.repository';

@Injectable()
export class BrandsWriteRepository extends BaseRepository {
  protected readonly tableName = 'brands';

  create(
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
    return this.executeWithClient<BrandRow>(
      `INSERT INTO brands (name, slug, manufacturer, country_code, website_url, description, logo_image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        data.name, data.slug,
        data.manufacturer ?? null, data.countryCode ?? null,
        data.websiteUrl ?? null, data.description ?? null,
        data.logoImageUrl ?? null, data.isActive ?? true,
      ],
      client,
    ).then((r) => r.rows[0]);
  }

  update(
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
    return this.executeWithClient<BrandRow>(
      `UPDATE brands SET ${setClauses.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values,
      client,
    ).then((r) => r.rows[0]);
  }

  async softDelete(id: Uuid, client?: PoolClient): Promise<void> {
    await this.executeWithClient(
      `UPDATE brands SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [id],
      client,
    );
  }

  async restore(id: Uuid, client?: PoolClient): Promise<void> {
    await this.executeWithClient(
      `UPDATE brands SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`,
      [id],
      client,
    );
  }

  private executeWithClient<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values: ReadonlyArray<unknown>,
    client?: PoolClient,
  ) {
    return client
      ? client.query<R>(text, [...values])
      : this.query<R>(text, values);
  }
}
