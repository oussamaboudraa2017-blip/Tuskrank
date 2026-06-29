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
import type { Product } from '../domain/types';
import { ProductMapper } from '../domain/mapping/product.mapper';
import {
  ProductSortField,
  SortOrder,
} from '../domain/enums/product.enums';

/* ==================================================================
 * Sort-field → SQL column mapping
 * ================================================================== */
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

/* ==================================================================
 * ProductsRepository
 * ================================================================== */

@Injectable()
export class ProductsRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'products';

  /* ================================================================
   * Read
   * ================================================================ */

  async findById(
    id: Uuid,
    options?: { includeSoftDeleted?: boolean; includeUnpublished?: boolean },
  ): Promise<Product | null> {
    const base = this.productBaseQuery();
    const conditions: string[] = ['p.id = $1'];
    if (!options?.includeSoftDeleted) conditions.push('p.deleted_at IS NULL');
    if (!options?.includeUnpublished) conditions.push('p.published_at IS NOT NULL');

    const sql = `${base} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query<ProductRow>(sql, [id]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    await this.hydrateChildren(row);
    return ProductMapper.dbToDomain(row) as unknown as Product;
  }

  async findBySlug(
    slug: string,
    options?: { includeSoftDeleted?: boolean; includeUnpublished?: boolean },
  ): Promise<Product | null> {
    const base = this.productBaseQuery();
    const conditions: string[] = ['p.slug = $1'];
    if (!options?.includeSoftDeleted) conditions.push('p.deleted_at IS NULL');
    if (!options?.includeUnpublished) conditions.push('p.published_at IS NOT NULL');

    const sql = `${base} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query<ProductRow>(sql, [slug]);
    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    await this.hydrateChildren(row);
    return ProductMapper.dbToDomain(row) as unknown as Product;
  }

  async findMany(
    query: ProductQuery,
  ): Promise<ReadonlyArray<Product>> {
    const { filters, sort, pagination } = query;
    const { conditions, values } = this.buildFilterConditions(filters);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sortCol = SORT_FIELD_MAP[sort.by] ?? 'p.created_at';
    const sortDir = SORT_ORDER_MAP[sort.order] ?? 'DESC';
    const offset = (pagination.page - 1) * pagination.limit;

    const base = this.productBaseQuery();
    const sql = `${base} ${where} ORDER BY ${sortCol} ${sortDir} NULLS LAST LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const result = await this.query<ProductRow>(sql, [
      ...values,
      pagination.limit,
      offset,
    ]);

    const rows = result.rows;
    await Promise.all(rows.map((r) => this.hydrateChildren(r)));
    return rows.map((r) => ProductMapper.dbToDomain(r) as unknown as Product);
  }

  async findFeatured(
    pagination: { page: number; limit: number },
    options?: { petType?: string },
  ): Promise<ReadonlyArray<Product>> {
    const conditions: string[] = [
      'p.deleted_at IS NULL',
      'p.is_active = true',
      'p.published_at IS NOT NULL',
      'ps.is_current = true',
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

    const base = this.productBaseQuery();
    const sql = `${base} ${where} ORDER BY ps.overall_score DESC NULLS LAST, p.published_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    const result = await this.query<ProductRow>(sql, [
      ...values,
      pagination.limit,
      offset,
    ]);

    const rows = result.rows;
    await Promise.all(rows.map((r) => this.hydrateChildren(r)));
    return rows.map((r) => ProductMapper.dbToDomain(r) as unknown as Product);
  }

  async findTopRated(
    pagination: { page: number; limit: number },
    options?: { petType?: string; minScore?: number },
  ): Promise<ReadonlyArray<Product>> {
    const conditions: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (options?.minScore !== undefined) {
      values.push(options.minScore);
      conditions.push(`mv.overall_score >= $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (pagination.page - 1) * pagination.limit;

    const mvSql = `
      SELECT mv.product_id AS id
      FROM mv_top_rated_products mv
      ${where}
      ORDER BY mv.overall_score DESC NULLS LAST, mv.published_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const mvResult = await this.query<{ id: Uuid }>(mvSql, [
      ...values,
      pagination.limit,
      offset,
    ]);

    if (mvResult.rows.length === 0) return [];

    const ids = mvResult.rows.map((r) => r.id);
    const products: Product[] = [];
    for (const id of ids) {
      const p = await this.findById(id, { includeUnpublished: true });
      if (p) products.push(p);
    }
    return products;
  }

  async search(
    input: ProductSearchInput,
  ): Promise<ReadonlyArray<Product>> {
    const tsQuery = this.toTsQuery(input.q);
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
    const values: unknown[] = [tsQuery];

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
    const limit = input.top ?? 20;
    const page = 1;
    const offset = (page - 1) * limit;

    const base = this.productBaseQuery();
    const sql = `
      ${base} ${where}
      ORDER BY ts_rank(to_tsvector('english', p.name), to_tsquery('english', $1)) DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const result = await this.query<ProductRow>(sql, [...values, limit, offset]);

    const rows = result.rows;
    await Promise.all(rows.map((r) => this.hydrateChildren(r)));
    return rows.map((r) => ProductMapper.dbToDomain(r) as unknown as Product);
  }

  /* ================================================================
   * Counts
   * ================================================================ */

  async count(query: ProductQuery): Promise<number> {
    const { filters } = query;
    const { conditions, values } = this.buildFilterConditions(filters);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `SELECT COUNT(*)::int AS total FROM products p ${where}`;
    const result = await this.query<{ total: number }>(sql, values);
    return result.rows[0]?.total ?? 0;
  }

  /* ================================================================
   * Existence
   * ================================================================ */

  async exists(id: Uuid): Promise<boolean> {
    const sql = 'SELECT 1 FROM products WHERE id = $1 AND deleted_at IS NULL';
    const result = await this.query(sql, [id]);
    return result.rowCount === 1;
  }

  async existsByBrandSlug(
    brandId: Uuid,
    slug: string,
    excludeId?: Uuid,
  ): Promise<boolean> {
    let sql = 'SELECT 1 FROM products WHERE brand_id = $1 AND slug = $2 AND deleted_at IS NULL';
    const values: unknown[] = [brandId, slug];
    if (excludeId) {
      values.push(excludeId);
      sql += ` AND id != $${values.length}`;
    }
    const result = await this.query(sql, values);
    return result.rowCount === 1;
  }

  async existsByUpc(upc: string, excludeId?: Uuid): Promise<boolean> {
    let sql = 'SELECT 1 FROM products WHERE upc = $1 AND deleted_at IS NULL';
    const values: unknown[] = [upc];
    if (excludeId) {
      values.push(excludeId);
      sql += ` AND id != $${values.length}`;
    }
    const result = await this.query(sql, values);
    return result.rowCount === 1;
  }

  async existsByBrandSku(
    brandId: Uuid,
    sku: string,
    excludeId?: Uuid,
  ): Promise<boolean> {
    let sql = 'SELECT 1 FROM products WHERE brand_id = $1 AND sku = $2 AND deleted_at IS NULL';
    const values: unknown[] = [brandId, sku];
    if (excludeId) {
      values.push(excludeId);
      sql += ` AND id != $${values.length}`;
    }
    const result = await this.query(sql, values);
    return result.rowCount === 1;
  }

  /* ================================================================
   * Mutations
   * ================================================================ */

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
  ): Promise<Product> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.db.query<R>(text, values);
    const sql = `
      INSERT INTO products (
        brand_id, name, slug, description, upc, sku,
        package_size_grams, package_size_label,
        food_form_id, primary_protein_source_id, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )
      RETURNING *
    `;
    const result = await run<ProductRow & { id: Uuid }>(sql, [
      input.brandId,
      input.name,
      input.slug,
      input.description ?? null,
      input.upc ?? null,
      input.sku ?? null,
      input.packageSizeGrams ?? null,
      input.packageSizeLabel ?? null,
      input.foodFormId ?? null,
      input.primaryProteinSourceId ?? null,
      input.isActive ?? true,
    ]);

    const row = result.rows[0];
    return this.findById(row.id, { includeUnpublished: true }) as Promise<Product>;
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
  ): Promise<Product> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.db.query<R>(text, values);
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (patch.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(patch.name); }
    if (patch.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(patch.description); }
    if (patch.upc !== undefined) { setClauses.push(`upc = $${idx++}`); values.push(patch.upc); }
    if (patch.sku !== undefined) { setClauses.push(`sku = $${idx++}`); values.push(patch.sku); }
    if (patch.packageSizeGrams !== undefined) { setClauses.push(`package_size_grams = $${idx++}`); values.push(patch.packageSizeGrams); }
    if (patch.packageSizeLabel !== undefined) { setClauses.push(`package_size_label = $${idx++}`); values.push(patch.packageSizeLabel); }
    if (patch.foodFormId !== undefined) { setClauses.push(`food_form_id = $${idx++}`); values.push(patch.foodFormId); }
    if (patch.primaryProteinSourceId !== undefined) { setClauses.push(`primary_protein_source_id = $${idx++}`); values.push(patch.primaryProteinSourceId); }
    if (patch.isActive !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(patch.isActive); }

    setClauses.push(`updated_at = NOW()`);
    values.push(productId);

    const sql = `
      UPDATE products
      SET ${setClauses.join(', ')}
      WHERE id = $${idx} AND deleted_at IS NULL
      RETURNING *
    `;
    await run(sql, values);
    return this.findById(productId, { includeUnpublished: true }) as Promise<Product>;
  }

  async softDelete(productId: Uuid, client?: PoolClient): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.db.query<R>(text, values);
    const sql = `
      UPDATE products
      SET deleted_at = NOW(), is_active = false, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    await run(sql, [productId]);
  }

  async restore(productId: Uuid, client?: PoolClient): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.db.query<R>(text, values);
    const sql = `
      UPDATE products
      SET deleted_at = NULL, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NOT NULL
    `;
    await run(sql, [productId]);
  }

  async publish(productId: Uuid, publishedAt?: Date, client?: PoolClient): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.db.query<R>(text, values);
    const ts = publishedAt ?? new Date();
    const sql = `
      UPDATE products
      SET published_at = $1, is_active = true, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
    `;
    await run(sql, [ts.toISOString(), productId]);
  }

  async unpublish(productId: Uuid, client?: PoolClient): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.db.query<R>(text, values);
    const sql = `
      UPDATE products
      SET published_at = NULL, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    await run(sql, [productId]);
  }

  /* ================================================================
   * Brand reference lookups
   * ================================================================ */

  async findBrandById(brandId: Uuid): Promise<{ id: Uuid; name: string; slug: string; countryCode: string | null; logoImageUrl: string | null; isActive: boolean } | null> {
    const sql = `SELECT id, name, slug, country_code, logo_image_url, is_active FROM brands WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ id: Uuid; name: string; slug: string; country_code: string | null; logo_image_url: string | null; is_active: boolean }>(sql, [brandId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { id: r.id, name: r.name, slug: r.slug, countryCode: r.country_code, logoImageUrl: r.logo_image_url, isActive: r.is_active };
  }

  async findFoodFormById(foodFormId: Uuid): Promise<{ id: Uuid; slug: string; name: string; isActive: boolean } | null> {
    const sql = `SELECT id, slug, name, is_active FROM food_forms WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ id: Uuid; slug: string; name: string; is_active: boolean }>(sql, [foodFormId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { id: r.id, slug: r.slug, name: r.name, isActive: r.is_active };
  }

  async findProteinSourceById(sourceId: Uuid): Promise<{ id: Uuid; slug: string; name: string; origin: string | null; isActive: boolean } | null> {
    const sql = `SELECT id, slug, name, origin, is_active FROM protein_sources WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ id: Uuid; slug: string; name: string; origin: string | null; is_active: boolean }>(sql, [sourceId]);
    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return { id: r.id, slug: r.slug, name: r.name, origin: r.origin, isActive: r.is_active };
  }

  /* ================================================================
   * Private — SQL builders
   * ================================================================ */

  private productBaseQuery(): string {
    return `
      SELECT
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
        ff.slug AS food_form_slug, ff.name AS food_form_name, ff.is_active AS food_form_is_active,
        ps.slug AS protein_source_slug, ps.name AS protein_source_name,
        ps.origin AS protein_source_origin, ps.is_active AS protein_source_is_current,
        ps2.id AS score_id, ps2.overall_score AS score_overall,
        ps2.quality_score AS score_quality, ps2.safety_score AS score_safety,
        ps2.nutrition_score AS score_nutrition, ps2.transparency_score AS score_transparency,
        ps2.scoring_version AS score_scoring_version, ps2.updated_at AS score_updated_at,
        ps2.is_current AS score_is_current
      FROM products p
      INNER JOIN brands b ON b.id = p.brand_id
      LEFT JOIN food_forms ff ON ff.id = p.food_form_id
      LEFT JOIN protein_sources ps ON ps.id = p.primary_protein_source_id
      LEFT JOIN product_scores ps2 ON ps2.product_id = p.id AND ps2.is_current = true AND ps2.deleted_at IS NULL
    `;
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
      if (filters.isPublished) {
        conditions.push('p.published_at IS NOT NULL');
      } else {
        conditions.push('p.published_at IS NULL');
      }
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

  private async hydrateChildren(row: ProductRow): Promise<void> {
    const productId = row.id;
    const [imagesRes, ingredientsRes, tagsRes, claimsRes, targetingRes, nutritionRes, nutrientsRes, scoreHistoryRes] =
      await Promise.all([
        this.query<ProductImageRow>(
          `SELECT * FROM product_images WHERE product_id = $1 AND deleted_at IS NULL ORDER BY sort_order`,
          [productId],
        ),
        this.query<ProductIngredientRow>(
          `SELECT pi.*, i.slug AS ingredient_slug, i.name AS ingredient_name,
                  i.current_score AS ingredient_current_score, i.current_grade AS ingredient_current_grade,
                  i.is_controversial AS ingredient_is_controversial,
                  i.is_common_allergen AS ingredient_is_common_allergen,
                  i.is_animal_derived AS ingredient_is_animal_derived
           FROM product_ingredients pi
           INNER JOIN ingredients i ON i.id = pi.ingredient_id
           WHERE pi.product_id = $1 AND pi.deleted_at IS NULL
           ORDER BY pi.position`,
          [productId],
        ),
        this.query<ProductTagRow>(
          `SELECT pt.id, pt.product_id, pt.tag_id, t.slug AS tag_slug, t.name AS tag_name
           FROM product_tags pt
           INNER JOIN tags t ON t.id = pt.tag_id
           WHERE pt.product_id = $1 AND pt.deleted_at IS NULL`,
          [productId],
        ),
        this.query<ProductClaimRow>(
          `SELECT pc.id, pc.product_id, pc.claim_id, c.slug AS claim_slug, c.name AS claim_name,
                  pc.evidence_note
           FROM product_claims pc
           INNER JOIN claims c ON c.id = pc.claim_id
           WHERE pc.product_id = $1 AND pc.deleted_at IS NULL`,
          [productId],
        ),
        this.query<ProductTargetingRow>(
          `SELECT * FROM product_targeting WHERE product_id = $1 AND is_active = true`,
          [productId],
        ),
        this.query<NutritionProfileRow>(
          `SELECT * FROM nutrition_profiles WHERE product_id = $1 AND deleted_at IS NULL ORDER BY effective_from DESC`,
          [productId],
        ),
        this.query<ProductNutrientValueRow>(
          `SELECT * FROM product_nutrients WHERE product_id = $1`,
          [productId],
        ),
        this.query<ScoreHistoryRow>(
          `SELECT * FROM score_history WHERE product_id = $1 ORDER BY computed_at DESC LIMIT 10`,
          [productId],
        ),
      ]);

    // Mutate the row in place — the mapper expects these arrays.
    const mutableRow = row as Record<string, any>;
    mutableRow.images = imagesRes.rows;
    mutableRow.ingredient_panel = ingredientsRes.rows;
    mutableRow.tags = tagsRes.rows;
    mutableRow.claims = claimsRes.rows;
    mutableRow.targeting = targetingRes.rows;
    mutableRow.nutrition_profiles = nutritionRes.rows;
    mutableRow.nutrient_values = nutrientsRes.rows;
    mutableRow.score_history = scoreHistoryRes.rows;
  }

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
}

/* ==================================================================
 * Child-table repositories (read-only companions)
 * ================================================================== */

@Injectable()
export class ProductImagesRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'product_images';
}

@Injectable()
export class NutritionProfilesRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'nutrition_profiles';
}

@Injectable()
export class ProductIngredientsRepository extends BaseRepository<BaseEntity> {
  protected override readonly tableName = 'product_ingredients';
}
