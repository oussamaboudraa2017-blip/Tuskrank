import { Injectable, Logger } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { BaseRepository } from '@database';

/**
 * Import repository — handles batch writes to PostgreSQL.
 *
 * All queries use `$1`-bound parameters. No raw interpolation.
 * Uses transactions for atomic batch writes.
 */
@Injectable()
export class ImportRepository extends BaseRepository {
  protected readonly tableName = undefined;

  private readonly logger = new Logger(ImportRepository.name);

  /* ------------------------------------------------------------------
   * Brand lookups
   * ------------------------------------------------------------------ */

  async findBrandByName(name: string): Promise<{ id: string; slug: string } | null> {
    const sql = `SELECT id, slug FROM brands WHERE lower(name) = lower($1) AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string; slug: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findBrandBySlug(slug: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM brands WHERE slug = $1 AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [slug]);
    return result.rows[0] ?? null;
  }

  /* ------------------------------------------------------------------
   * Ingredient lookups
   * ------------------------------------------------------------------ */

  async findIngredientByCanonicalName(canonicalName: string): Promise<{ id: string; slug: string } | null> {
    const sql = `SELECT id, slug FROM ingredients WHERE lower(canonical_name::text) = lower($1) AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string; slug: string }>(sql, [canonicalName]);
    return result.rows[0] ?? null;
  }

  async findIngredientCategoryByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM ingredient_categories WHERE lower(name) = lower($1) AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  /* ------------------------------------------------------------------
   * Product lookups
   * ------------------------------------------------------------------ */

  async findProductByUpc(upc: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM products WHERE upc = $1 AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [upc]);
    return result.rows[0] ?? null;
  }

  async findProductByBrandAndSlug(brandId: string, slug: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM products WHERE brand_id = $1 AND slug = $2 AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [brandId, slug]);
    return result.rows[0] ?? null;
  }

  /* ------------------------------------------------------------------
   * Lookup table lookups (for foreign key resolution)
   * ------------------------------------------------------------------ */

  async findFoodFormByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM food_forms WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findProteinSourceByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM protein_sources WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findPetTypeByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM pet_types WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findLifeStageByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM life_stages WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findBreedSizeByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM breed_sizes WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findCategoryByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM categories WHERE lower(name) = lower($1) AND deleted_at IS NULL LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findClaimByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM claims WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findTagByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM tags WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  async findNutrientByName(name: string): Promise<{ id: string } | null> {
    const sql = `SELECT id FROM nutrients WHERE lower(name) = lower($1) LIMIT 1`;
    const result = await this.query<{ id: string }>(sql, [name]);
    return result.rows[0] ?? null;
  }

  /* ------------------------------------------------------------------
   * Batch inserts (within transaction)
   * ------------------------------------------------------------------ */

  async insertBrand(
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
  ): Promise<{ id: string; slug: string }> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO brands (name, slug, manufacturer, country_code, website_url, description, logo_image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        manufacturer = EXCLUDED.manufacturer,
        country_code = EXCLUDED.country_code,
        website_url = EXCLUDED.website_url,
        description = EXCLUDED.description,
        logo_image_url = EXCLUDED.logo_image_url,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING id, slug
    `;
    const result = await run<{ id: string; slug: string }>(sql, [
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

  async insertProduct(
    data: {
      brandId: string;
      name: string;
      slug: string;
      description?: string | null;
      upc?: string | null;
      sku?: string | null;
      packageSizeGrams?: number | null;
      packageSizeLabel?: string | null;
      foodFormId?: string | null;
      primaryProteinSourceId?: string | null;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<{ id: string; slug: string }> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO products (brand_id, name, slug, description, upc, sku, package_size_grams, package_size_label, food_form_id, primary_protein_source_id, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (brand_id, slug) DO UPDATE SET
        description = EXCLUDED.description,
        upc = EXCLUDED.upc,
        sku = EXCLUDED.sku,
        package_size_grams = EXCLUDED.package_size_grams,
        package_size_label = EXCLUDED.package_size_label,
        food_form_id = EXCLUDED.food_form_id,
        primary_protein_source_id = EXCLUDED.primary_protein_source_id,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING id, slug
    `;
    const result = await run<{ id: string; slug: string }>(sql, [
      data.brandId,
      data.name,
      data.slug,
      data.description ?? null,
      data.upc ?? null,
      data.sku ?? null,
      data.packageSizeGrams ?? null,
      data.packageSizeLabel ?? null,
      data.foodFormId ?? null,
      data.primaryProteinSourceId ?? null,
      data.isActive ?? true,
    ]);
    return result.rows[0];
  }

  async insertIngredient(
    data: {
      name: string;
      slug: string;
      inciName?: string | null;
      categoryId?: string | null;
      canonicalName: string;
      description?: string | null;
      isAnimalDerived?: boolean;
      isCommonAllergen?: boolean;
      isControversial?: boolean;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<{ id: string; slug: string }> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO ingredients (name, slug, inci_name, category_id, canonical_name, description, is_animal_derived, is_common_allergen, is_controversial, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        inci_name = EXCLUDED.inci_name,
        category_id = EXCLUDED.category_id,
        canonical_name = EXCLUDED.canonical_name,
        description = EXCLUDED.description,
        is_animal_derived = EXCLUDED.is_animal_derived,
        is_common_allergen = EXCLUDED.is_common_allergen,
        is_controversial = EXCLUDED.is_controversial,
        is_active = EXCLUDED.is_active,
        updated_at = now()
      RETURNING id, slug
    `;
    const result = await run<{ id: string; slug: string }>(sql, [
      data.name,
      data.slug,
      data.inciName ?? null,
      data.categoryId ?? null,
      data.canonicalName,
      data.description ?? null,
      data.isAnimalDerived ?? false,
      data.isCommonAllergen ?? false,
      data.isControversial ?? false,
      data.isActive ?? true,
    ]);
    return result.rows[0];
  }

  /* ------------------------------------------------------------------
   * Batch relationship inserts
   * ------------------------------------------------------------------ */

  async insertProductIngredient(
    data: {
      productId: string;
      ingredientId: string;
      position: number;
      rawLabel?: string | null;
      isPrimary?: boolean;
      percentageValue?: number | null;
    },
    client?: PoolClient,
  ): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO product_ingredients (product_id, ingredient_id, position, raw_label, is_primary, percentage_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (product_id, ingredient_id) WHERE deleted_at IS NULL DO NOTHING
    `;
    await run(sql, [
      data.productId,
      data.ingredientId,
      data.position,
      data.rawLabel ?? null,
      data.isPrimary ?? false,
      data.percentageValue ?? null,
    ]);
  }

  async insertProductTargeting(
    data: {
      productId: string;
      petTypeId: string;
      lifeStageId?: string | null;
      breedSizeId?: string | null;
      categoryId?: string | null;
    },
    client?: PoolClient,
  ): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO product_targeting (product_id, pet_type_id, life_stage_id, breed_size_id, category_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (product_id, pet_type_id, life_stage_id, breed_size_id, category_id) DO NOTHING
    `;
    await run(sql, [
      data.productId,
      data.petTypeId,
      data.lifeStageId ?? null,
      data.breedSizeId ?? null,
      data.categoryId ?? null,
    ]);
  }

  async insertProductClaim(
    productId: string,
    claimId: string,
    client?: PoolClient,
  ): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO product_claims (product_id, claim_id)
      VALUES ($1, $2)
      ON CONFLICT (product_id, claim_id) DO NOTHING
    `;
    await run(sql, [productId, claimId]);
  }

  async insertProductTag(
    productId: string,
    tagId: string,
    client?: PoolClient,
  ): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO product_tags (product_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT (product_id, tag_id) DO NOTHING
    `;
    await run(sql, [productId, tagId]);
  }

  async insertNutritionProfile(
    data: {
      productId: string;
      kcalPer100g?: number | null;
      moisturePct?: number | null;
      source?: string;
    },
    client?: PoolClient,
  ): Promise<{ id: string }> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO nutrition_profiles (product_id, kcal_per_100g, moisture_pct, effective_from, source)
      VALUES ($1, $2, $3, CURRENT_DATE, $4)
      RETURNING id
    `;
    const result = await run<{ id: string }>(sql, [
      data.productId,
      data.kcalPer100g ?? null,
      data.moisturePct ?? null,
      data.source ?? 'import',
    ]);
    return result.rows[0];
  }

  async insertProductNutrient(
    data: {
      productId: string;
      nutrientId: string;
      nutritionProfileId?: string | null;
      amount: number;
      unit: string;
      bound?: string;
    },
    client?: PoolClient,
  ): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO product_nutrients (product_id, nutrient_id, nutrition_profile_id, amount, unit, bound)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `;
    await run(sql, [
      data.productId,
      data.nutrientId,
      data.nutritionProfileId ?? null,
      data.amount,
      data.unit,
      data.bound ?? 'exact',
    ]);
  }

  async insertProductImage(
    data: {
      productId: string;
      publicUrl: string;
      storagePath: string;
      altText?: string | null;
      isPrimary?: boolean;
    },
    client?: PoolClient,
  ): Promise<void> {
    const run = <R extends Record<string, any> = Record<string, any>>(
      text: string,
      values: ReadonlyArray<unknown> = [],
    ) =>
      client
        ? client.query<R>(text, [...values])
        : this.query<R>(text, values);
    const sql = `
      INSERT INTO product_images (product_id, public_url, storage_path, alt_text, is_primary)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await run(sql, [
      data.productId,
      data.publicUrl,
      data.storagePath,
      data.altText ?? null,
      data.isPrimary ?? false,
    ]);
  }
}
