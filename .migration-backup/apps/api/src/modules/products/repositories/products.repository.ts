import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import type { PoolClient } from 'pg';
import type { ProductEntity as BaseEntity } from '../entities';
import type {
  ProductRow,
  ProductImageRow,
  ProductIngredientRow,
  ProductTagRow,
  ProductClaimRow,
  ProductTargetingRow,
  NutritionProfileRow,
  ProductNutrientValueRow,
  ScoreHistoryRow,
} from '../domain/mapping/product.db-model';
import type {
  ProductQuery,
  ProductSearchInput,
} from '../domain/interfaces/product-query.interface';
import {
  ProductSortField,
  SortOrder,
} from '../domain/enums/product.enums';

const SORT_FIELD_MAP: Record<string, string> = {
  [ProductSortField.CreatedAt]: 'p.created_at',
  [ProductSortField.PublishedAt]: 'p.published_at',
  [ProductSortField.OverallScore]: 'COALESCE(ps.overall_score, 0)',
  [ProductSortField.Name]: 'p.name',
};

const SORT_ORDER_MAP: Record<string, string> = {
  [SortOrder.Asc]: 'ASC',
  [SortOrder.Desc]: 'DESC',
};

const PRODUCT_BASE_COLS = `
  p.id, p.brand_id, p.name, p.slug, p.description, p.upc, p.sku,
  p.package_size_grams, p.package_size_label,
  p.food_form_id, p.primary_protein_source_id,
  p.is_active, p.published_at, p.created_at, p.updated_at, p.deleted_at,
  b.name AS brand_name, b.slug AS brand_slug,
  b.manufacturer AS brand_manufacturer,
  b.country_code AS brand_country_code,
  b.website_url AS brand_website_url,
  b.description AS brand_description,
  b.logo_image_url AS brand_logo_image_url,
  b.is_active AS brand_is_active,
  ff.slug AS food_form_slug, ff.name AS food_form_name,
  ff.is_active AS food_form_is_active,
  ps.slug AS protein_source_slug, ps.name AS protein_source_name,
  ps.origin AS protein_source_origin, ps.is_active AS protein_source_is_current,
  ps2.id AS score_id, ps2.overall_score AS score_overall,
  ps2.quality_score AS score_quality, ps2.safety_score AS score_safety,
  ps2.nutrition_score AS score_nutrition, ps2.transparency_score AS score_transparency,
  ps2.scoring_version AS score_scoring_version, ps2.updated_at AS score_updated_at,
  ps2.is_current AS score_is_current
`;

const PRODUCT_BASE_FROM = `
  FROM products p
  INNER JOIN brands b ON b.id = p.brand_id
  LEFT JOIN food_forms ff ON ff.id = p.food_form_id
  LEFT JOIN protein_sources ps ON ps.id = p.primary_protein_source_id
  LEFT JOIN product_scores ps2 ON ps2.product_id = p.id AND ps2.is_current = true AND ps2.deleted_at IS NULL
`;

type ProductChildRows = {
  images: ProductImageRow[];
  ingredients: ProductIngredientRow[];
  tags: ProductTagRow[];
  claims: ProductClaimRow[];
  targeting: ProductTargetingRow[];
  nutritionProfiles: NutritionProfileRow[];
  nutrientValues: ProductNutrientValueRow[];
  scoreHistory: ScoreHistoryRow[];
};

@Injectable()
export class ProductsReadRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'products';

  async findById(id: Uuid): Promise<ProductRow | null> {
    const result = await this.execute<ProductRow>(
      `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findBySlug(slug: string): Promise<ProductRow | null> {
    const result = await this.execute<ProductRow>(
      `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} WHERE p.slug = $1 AND p.deleted_at IS NULL`,
      [slug],
    );
    return result.rows[0] ?? null;
  }

  async findMany(
    query: ProductQuery,
  ): Promise<{ rows: ProductRow[]; total: number }> {
    const { filters, sort, pagination } = query;
    const { conditions, values } = this.buildFilterConditions(filters);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortCol = SORT_FIELD_MAP[sort.by] ?? 'p.created_at';
    const sortDir = SORT_ORDER_MAP[sort.order] ?? 'DESC';
    const offset = (pagination.page - 1) * pagination.limit;

    const countSql = `SELECT COUNT(*)::int AS total ${PRODUCT_BASE_FROM} ${where}`;
    const dataSql = `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} ${where} ORDER BY ${sortCol} ${sortDir} NULLS LAST LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;

    const [countResult, dataResult] = await Promise.all([
      this.execute<{ total: number }>(countSql, values),
      this.execute<ProductRow>(dataSql, [...values, pagination.limit, offset]),
    ]);

    return {
      rows: dataResult.rows,
      total: countResult.rows[0]?.total ?? 0,
    };
  }

  /** Cursor-based pagination — O(1) at scale, no OFFSET drift. */
  async findManyCursor(
    query: ProductQuery,
  ): Promise<{ rows: ProductRow[]; nextCursor: string | null; total: number }> {
    const { filters, sort, pagination } = query;
    const { conditions, values } = this.buildFilterConditions(filters);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortCol = SORT_FIELD_MAP[sort.by] ?? 'p.created_at';
    const sortDir = sort.order === SortOrder.Asc ? 'ASC' : 'DESC';
    const sortOp = sortDir === 'ASC' ? '>' : '<';
    const limit = Math.min(pagination.limit, 100);

    const countSql = `SELECT COUNT(*)::int AS total ${PRODUCT_BASE_FROM} ${where}`;
    let dataSql: string;
    let dataValues: unknown[];

    if (query.cursor) {
      const decoded = this.decodeCursor(query.cursor);
      if (decoded) {
        const sortField = sortCol === 'p.created_at' ? 'p.created_at' : sortCol;
        dataSql = `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} ${where} AND (${sortField}, p.id) ${sortOp} ($1::timestamptz, $2::uuid) ORDER BY ${sortField} ${sortDir}, p.id ${sortDir} LIMIT $3`;
        dataValues = [new Date(decoded.sortValue).toISOString(), decoded.id, limit];
      } else {
        dataSql = `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} ${where} ORDER BY ${sortCol} ${sortDir}, p.id ${sortDir} LIMIT $${values.length + 1}`;
        dataValues = [...values, limit];
      }
    } else {
      dataSql = `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} ${where} ORDER BY ${sortCol} ${sortDir}, p.id ${sortDir} LIMIT $${values.length + 1}`;
      dataValues = [...values, limit];
    }

    const [countResult, dataResult] = await Promise.all([
      this.execute<{ total: number }>(countSql, values),
      this.execute<ProductRow>(dataSql, dataValues),
    ]);

    const rows = dataResult.rows;
    const lastRow = rows[rows.length - 1];
    const nextCursor = rows.length === limit
      ? this.encodeCursor(lastRow.id, (lastRow as unknown as Record<string, unknown>)[sortCol === 'p.created_at' ? 'created_at' : sortCol])
      : null;

    return {
      rows,
      nextCursor,
      total: countResult.rows[0]?.total ?? 0,
    };
  }

  private decodeCursor(cursor: string): { id: Uuid; sortValue: string } | null {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (typeof decoded.id === 'string' && typeof decoded.sv === 'string') {
        return { id: decoded.id as Uuid, sortValue: decoded.sv };
      }
      return null;
    } catch {
      return null;
    }
  }

  private encodeCursor(id: Uuid, sortValue: unknown): string {
    return Buffer.from(JSON.stringify({ id, sv: String(sortValue) })).toString('base64url');
  }

  async findFeatured(
    pagination: { page: number; limit: number },
    options?: { petType?: string },
  ): Promise<ProductRow[]> {
    const conditions: string[] = [
      'p.deleted_at IS NULL',
      'p.is_active = true',
      'p.published_at IS NOT NULL',
      'ps2.is_current = true',
    ];
    const values: unknown[] = [];

    if (options?.petType) {
      values.push(options.petType);
      conditions.push(
        `EXISTS (SELECT 1 FROM product_targeting pt
          JOIN pet_types pt2 ON pt2.id = pt.pet_type_id
          WHERE pt.product_id = p.id AND pt2.slug = $${values.length} AND pt.is_active = true)`,
      );
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (pagination.page - 1) * pagination.limit;

    const sql = `SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} ${where} ORDER BY ps2.overall_score DESC NULLS LAST, p.published_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const result = await this.execute<ProductRow>(sql, [...values, pagination.limit, offset]);
    return result.rows;
  }

  async countByBrand(brandId: Uuid): Promise<number> {
    const result = await this.execute<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM products WHERE brand_id = $1 AND deleted_at IS NULL`,
      [brandId],
    );
    return result.rows[0]?.total ?? 0;
  }

  /* ================================================================
   * Existence checks
   * ================================================================ */

  async existsByBrandSlug(brandId: Uuid, slug: string, excludeId?: Uuid): Promise<boolean> {
    let sql = 'SELECT 1 FROM products WHERE brand_id = $1 AND slug = $2 AND deleted_at IS NULL';
    const values: unknown[] = [brandId, slug];
    if (excludeId) {
      values.push(excludeId);
      sql += ` AND id != $${values.length}`;
    }
    const result = await this.execute(sql, values);
    return result.rowCount === 1;
  }

  async existsByUpc(upc: string, excludeId?: Uuid): Promise<boolean> {
    let sql = 'SELECT 1 FROM products WHERE upc = $1 AND deleted_at IS NULL';
    const values: unknown[] = [upc];
    if (excludeId) {
      values.push(excludeId);
      sql += ` AND id != $${values.length}`;
    }
    const result = await this.execute(sql, values);
    return result.rowCount === 1;
  }

  async existsByBrandSku(brandId: Uuid, sku: string, excludeId?: Uuid): Promise<boolean> {
    let sql = 'SELECT 1 FROM products WHERE brand_id = $1 AND sku = $2 AND deleted_at IS NULL';
    const values: unknown[] = [brandId, sku];
    if (excludeId) {
      values.push(excludeId);
      sql += ` AND id != $${values.length}`;
    }
    const result = await this.execute(sql, values);
    return result.rowCount === 1;
  }

  /** Batch hydrate children for multiple products — eliminates N+1. */
  async batchHydrate(rows: ProductRow[]): Promise<ProductRow[]> {
    if (rows.length === 0) return rows;
    const ids = rows.map((r) => r.id);

    const children = await Promise.all([
      this.batchFind<ProductImageRow>('product_images', 'product_id', ids, 'ORDER BY sort_order'),
      this.batchFindIngredients(ids),
      this.batchFindTags(ids),
      this.batchFindClaims(ids),
      this.batchFind<ProductTargetingRow>('product_targeting', 'product_id', ids, 'AND is_active = true'),
      this.batchFind<NutritionProfileRow>('nutrition_profiles', 'product_id', ids, 'ORDER BY effective_from DESC'),
      this.batchFind<ProductNutrientValueRow>('product_nutrients', 'product_id', ids),
      this.batchFindScoreHistory(ids),
    ]);

    const grouped = children.map(
      (childRows) => this.groupByProductId(childRows as { product_id: Uuid }[]),
    );

    for (const row of rows) {
      const mutableRow = row as unknown as Record<string, unknown>;
      mutableRow.images = this.getForProduct(grouped[0] as Map<Uuid, ProductImageRow[]>, row.id);
      mutableRow.ingredient_panel = this.getForProduct(grouped[1] as Map<Uuid, ProductIngredientRow[]>, row.id);
      mutableRow.tags = this.getForProduct(grouped[2] as Map<Uuid, ProductTagRow[]>, row.id);
      mutableRow.claims = this.getForProduct(grouped[3] as Map<Uuid, ProductClaimRow[]>, row.id);
      mutableRow.targeting = this.getForProduct(grouped[4] as Map<Uuid, ProductTargetingRow[]>, row.id);
      mutableRow.nutrition_profiles = this.getForProduct(grouped[5] as Map<Uuid, NutritionProfileRow[]>, row.id);
      mutableRow.nutrient_values = this.getForProduct(grouped[6] as Map<Uuid, ProductNutrientValueRow[]>, row.id);
      mutableRow.score_history = this.getForProduct(grouped[7] as Map<Uuid, ScoreHistoryRow[]>, row.id);
    }

    return rows;
  }

  async hydrateSingle(row: ProductRow): Promise<ProductRow> {
    return (await this.batchHydrate([row]))[0];
  }

  private async batchFind<R extends { product_id: Uuid }>(
    table: string,
    fkColumn: string,
    ids: Uuid[],
    extraSql = '',
  ): Promise<R[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.execute<R>(
      `SELECT * FROM ${this.table(table)} WHERE ${this.col(fkColumn)} IN (${placeholders}) AND deleted_at IS NULL ${extraSql}`,
      ids,
    );
    return result.rows;
  }

  private async batchFindIngredients(ids: Uuid[]): Promise<ProductIngredientRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.execute<ProductIngredientRow>(
            `SELECT pi.*, i.slug AS ingredient_slug, i.name AS ingredient_name,
              s.score AS ingredient_current_score, s.grade AS ingredient_current_grade,
              i.is_controversial AS ingredient_is_controversial,
              i.is_common_allergen AS ingredient_is_common_allergen,
              i.is_animal_derived AS ingredient_is_animal_derived
       FROM product_ingredients pi
       INNER JOIN ingredients i ON i.id = pi.ingredient_id
       LEFT JOIN ingredient_scores s ON s.ingredient_id = i.id AND s.is_current AND s.deleted_at IS NULL
       WHERE pi.product_id IN (${placeholders}) AND pi.deleted_at IS NULL
       ORDER BY pi.position`,
      ids,
    );
    return result.rows;
  }

  private async batchFindTags(ids: Uuid[]): Promise<ProductTagRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.execute<ProductTagRow>(
      `SELECT pt.id, pt.product_id, pt.tag_id, t.slug AS tag_slug, t.name AS tag_name
       FROM product_tags pt
       INNER JOIN tags t ON t.id = pt.tag_id
       WHERE pt.product_id IN (${placeholders}) AND pt.deleted_at IS NULL`,
      ids,
    );
    return result.rows;
  }

  private async batchFindClaims(ids: Uuid[]): Promise<ProductClaimRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.execute<ProductClaimRow>(
      `SELECT pc.id, pc.product_id, pc.claim_id, c.slug AS claim_slug, c.name AS claim_name,
              pc.evidence_note
       FROM product_claims pc
       INNER JOIN claims c ON c.id = pc.claim_id
       WHERE pc.product_id IN (${placeholders}) AND pc.deleted_at IS NULL`,
      ids,
    );
    return result.rows;
  }

  private async batchFindScoreHistory(ids: Uuid[]): Promise<ScoreHistoryRow[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.execute<ScoreHistoryRow>(
      `SELECT * FROM score_history WHERE product_id IN (${placeholders}) ORDER BY computed_at DESC LIMIT 10`,
      ids,
    );
    return result.rows;
  }

  private groupByProductId<T extends { product_id: Uuid }>(rows: T[]): Map<Uuid, T[]> {
    const map = new Map<Uuid, T[]>();
    for (const row of rows) {
      const existing = map.get(row.product_id);
      if (existing) {
        existing.push(row);
      } else {
        map.set(row.product_id, [row]);
      }
    }
    return map;
  }

  private getForProduct<T>(map: Map<Uuid, T[]>, productId: Uuid): T[] {
    return map.get(productId) ?? [];
  }

  private buildFilterConditions(filters: {
    q?: string;
    brandId?: Uuid;
    isActive?: boolean;
    isPublished?: boolean;
  }): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    conditions.push('p.deleted_at IS NULL');

    if (filters.isActive !== undefined) {
      conditions.push(`p.is_active = $${idx++}`);
      values.push(filters.isActive);
    }
    if (filters.isPublished !== undefined) {
      conditions.push(filters.isPublished ? 'p.published_at IS NOT NULL' : 'p.published_at IS NULL');
    }
    if (filters.brandId) {
      conditions.push(`p.brand_id = $${idx++}`);
      values.push(filters.brandId);
    }
    if (filters.q) {
      conditions.push(`p.name ILIKE $${idx++}`);
      values.push(`%${filters.q}%`);
    }

    return { conditions, values };
  }
}

/* ================================================================
 * ProductsWriteRepository — mutations only
 * ================================================================ */

@Injectable()
export class ProductsWriteRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'products';

  async create(
    input: {
      brandId: Uuid;
      name: string;
      slug: string;
      description?: string | null;
      upc?: string | null;
      sku?: string | null;
      packageSizeGrams?: number | null;
      packageSizeLabel?: string | null;
      foodFormId?: Uuid | null;
      primaryProteinSourceId?: Uuid | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<ProductRow> {
    const result = client
      ? await client.query<ProductRow>(
          `INSERT INTO products (brand_id, name, slug, description, upc, sku,
            package_size_grams, package_size_label, food_form_id, primary_protein_source_id, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [input.brandId, input.name, input.slug, input.description ?? null,
           input.upc ?? null, input.sku ?? null, input.packageSizeGrams ?? null,
           input.packageSizeLabel ?? null, input.foodFormId ?? null,
           input.primaryProteinSourceId ?? null, input.isActive ?? true],
        )
      : await this.execute<ProductRow>(
          `INSERT INTO products (brand_id, name, slug, description, upc, sku,
            package_size_grams, package_size_label, food_form_id, primary_protein_source_id, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
          [input.brandId, input.name, input.slug, input.description ?? null,
           input.upc ?? null, input.sku ?? null, input.packageSizeGrams ?? null,
           input.packageSizeLabel ?? null, input.foodFormId ?? null,
           input.primaryProteinSourceId ?? null, input.isActive ?? true],
        );
    return result.rows[0];
  }

  async update(
    productId: Uuid,
    patch: {
      name?: string;
      description?: string | null;
      upc?: string | null;
      sku?: string | null;
      packageSizeGrams?: number | null;
      packageSizeLabel?: string | null;
      foodFormId?: Uuid | null;
      primaryProteinSourceId?: Uuid | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<void> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fields: [string, unknown][] = [
      ['name', patch.name],
      ['description', patch.description],
      ['upc', patch.upc],
      ['sku', patch.sku],
      ['package_size_grams', patch.packageSizeGrams],
      ['package_size_label', patch.packageSizeLabel],
      ['food_form_id', patch.foodFormId],
      ['primary_protein_source_id', patch.primaryProteinSourceId],
      ['is_active', patch.isActive],
    ];

    for (const [col, val] of fields) {
      if (val !== undefined) {
        setClauses.push(`${this.col(col)} = $${idx++}`);
        values.push(val);
      }
    }

    if (setClauses.length === 0) return;
    setClauses.push('updated_at = NOW()');
    values.push(productId);

    const sql = `UPDATE products SET ${setClauses.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL`;

    if (client) {
      await client.query(sql, values);
    } else {
      await this.execute(sql, values);
    }
  }

  async softDelete(productId: Uuid, client?: PoolClient): Promise<void> {
    const sql = `UPDATE products SET deleted_at = NOW(), is_active = false, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
    if (client) {
      await client.query(sql, [productId]);
    } else {
      await this.execute(sql, [productId]);
    }
  }

  async restore(productId: Uuid, client?: PoolClient): Promise<void> {
    const sql = `UPDATE products SET deleted_at = NULL, updated_at = NOW() WHERE id = $1 AND deleted_at IS NOT NULL`;
    if (client) {
      await client.query(sql, [productId]);
    } else {
      await this.execute(sql, [productId]);
    }
  }

  async publish(productId: Uuid, publishedAt?: Date, client?: PoolClient): Promise<void> {
    const ts = (publishedAt ?? new Date()).toISOString();
    const sql = `UPDATE products SET published_at = $1, is_active = true, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`;
    if (client) {
      await client.query(sql, [ts, productId]);
    } else {
      await this.execute(sql, [ts, productId]);
    }
  }

  async unpublish(productId: Uuid, client?: PoolClient): Promise<void> {
    const sql = `UPDATE products SET published_at = NULL, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL`;
    if (client) {
      await client.query(sql, [productId]);
    } else {
      await this.execute(sql, [productId]);
    }
  }
}

/* ================================================================
 * ProductsSearchRepository — search queries only
 * ================================================================ */

@Injectable()
export class ProductsSearchRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'products';

  async search(input: ProductSearchInput): Promise<ProductRow[]> {
    const conditions: string[] = [
      'p.deleted_at IS NULL',
      'p.published_at IS NOT NULL',
      `(to_tsvector('english', p.name) @@ to_tsquery('english', $1)
        OR EXISTS (
          SELECT 1 FROM product_ingredients pi
          JOIN ingredients i ON i.id = pi.ingredient_id
          WHERE pi.product_id = p.id
            AND to_tsvector('english', i.name) @@ to_tsquery('english', $1)
        ))`,
    ];
    const values: unknown[] = [this.toTsQuery(input.q)];

    if (input.brandId) {
      values.push(input.brandId);
      conditions.push(`p.brand_id = $${values.length}`);
    }
    if (input.petType) {
      values.push(input.petType);
      conditions.push(
        `EXISTS (SELECT 1 FROM product_targeting pt
          JOIN pet_types pt2 ON pt2.id = pt.pet_type_id
          WHERE pt.product_id = p.id AND pt2.slug = $${values.length} AND pt.is_active = true)`,
      );
    }
    if (input.foodForm) {
      values.push(input.foodForm);
      conditions.push(
        `EXISTS (SELECT 1 FROM food_forms ff WHERE ff.id = p.food_form_id AND ff.slug = $${values.length})`,
      );
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const limitValue = input.top ?? 20;

    const sql = `
      SELECT ${PRODUCT_BASE_COLS} ${PRODUCT_BASE_FROM} ${where}
      ORDER BY ts_rank(to_tsvector('english', p.name), to_tsquery('english', $1)) DESC
      LIMIT $${values.length + 1}
    `;
    const result = await this.execute<ProductRow>(sql, [...values, limitValue]);
    return result.rows;
  }

  private toTsQuery(q: string): string {
    return q
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').trim())
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(' & ');
  }
}

/* ================================================================
 * Companion read-only repositories
 * ================================================================ */

@Injectable()
export class ProductLookupRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'brands';

  async findBrandById(brandId: Uuid): Promise<{
    id: Uuid; name: string; slug: string;
    countryCode: string | null; logoImageUrl: string | null; isActive: boolean;
  } | null> {
    const result = await this.execute<{
      id: Uuid; name: string; slug: string;
      country_code: string | null; logo_image_url: string | null; is_active: boolean;
    }>(
      `SELECT id, name, slug, country_code, logo_image_url, is_active FROM brands WHERE id = $1 AND deleted_at IS NULL`,
      [brandId],
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { id: r.id, name: r.name, slug: r.slug, countryCode: r.country_code, logoImageUrl: r.logo_image_url, isActive: r.is_active };
  }

  async findFoodFormById(foodFormId: Uuid): Promise<{
    id: Uuid; slug: string; name: string; isActive: boolean;
  } | null> {
    const result = await this.execute<{
      id: Uuid; slug: string; name: string; is_active: boolean;
    }>(
      `SELECT id, slug, name, is_active FROM food_forms WHERE id = $1 AND deleted_at IS NULL`,
      [foodFormId],
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { id: r.id, slug: r.slug, name: r.name, isActive: r.is_active };
  }

  async findProteinSourceById(sourceId: Uuid): Promise<{
    id: Uuid; slug: string; name: string; origin: string | null; isActive: boolean;
  } | null> {
    const result = await this.execute<{
      id: Uuid; slug: string; name: string; origin: string | null; is_active: boolean;
    }>(
      `SELECT id, slug, name, origin, is_active FROM protein_sources WHERE id = $1 AND deleted_at IS NULL`,
      [sourceId],
    );
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { id: r.id, slug: r.slug, name: r.name, origin: r.origin, isActive: r.is_active };
  }
}
