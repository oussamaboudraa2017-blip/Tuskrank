import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@database';
import { PoolClient } from 'pg';
import { ProductScoringInput } from '../types';

/**
 * Scoring Repository — fetches product data needed by scoring strategies.
 *
 * All queries use `$1`-bound parameters. No raw SQL interpolation.
 */
@Injectable()
export class ScoringRepository {
  private readonly logger = new Logger(ScoringRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Fetch all data needed to score a product.
   * Returns null if product not found.
   */
  async getProductScoringInput(productId: string): Promise<ProductScoringInput | null> {
    // 1. Fetch product + brand
    const productSql = `
      SELECT
        p.id, p.name, p.is_active, p.is_published,
        p.upc, p.sku, p.package_size_grams,
        b.id AS brand_id, b.name AS brand_name,
        b.country_code,
        ff.name AS food_form
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN food_forms ff ON ff.id = p.food_form_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const productResult = await this.db.query<{
      id: string;
      name: string;
      is_active: boolean;
      is_published: boolean;
      upc: string | null;
      sku: string | null;
      package_size_grams: number | null;
      brand_id: string;
      brand_name: string;
      country_code: string | null;
      food_form: string | null;
    }>(productSql, [productId]);

    if (productResult.rows.length === 0) return null;
    const product = productResult.rows[0];

    // 2. Fetch ingredients
    const ingredientsSql = `
      SELECT
        i.id, i.name, i.is_animal_derived, i.is_controversial, i.is_allergen,
        COALESCE(
          (SELECT score FROM ingredient_scores
           WHERE ingredient_id = i.id AND is_current = true AND deleted_at IS NULL
           LIMIT 1),
          0
        ) AS safety_score,
        ic.name AS category
      FROM product_ingredients pi
      JOIN ingredients i ON i.id = pi.ingredient_id AND i.deleted_at IS NULL
      LEFT JOIN ingredient_categories ic ON ic.id = i.category_id
      WHERE pi.product_id = $1 AND pi.deleted_at IS NULL
      ORDER BY pi.sort_order ASC
    `;
    const ingredientsResult = await this.db.query<{
      id: string;
      name: string;
      is_animal_derived: boolean;
      is_controversial: boolean;
      is_allergen: boolean;
      safety_score: number;
      category: string | null;
    }>(ingredientsSql, [productId]);

    // 3. Fetch nutrition profile
    const nutritionSql = `
      SELECT kcal, protein_percent, fat_percent, fiber_percent, ash_percent, moisture_percent
      FROM nutrition_profiles
      WHERE product_id = $1 AND deleted_at IS NULL
      LIMIT 1
    `;
    const nutritionResult = await this.db.query<{
      kcal: number | null;
      protein_percent: number | null;
      fat_percent: number | null;
      fiber_percent: number | null;
      ash_percent: number | null;
      moisture_percent: number | null;
    }>(nutritionSql, [productId]);

    // 4. Fetch brand certifications
    const certsSql = `
      SELECT c.name
      FROM brand_certifications bc
      JOIN certifications c ON c.id = bc.certification_id
      WHERE bc.brand_id = $1 AND bc.deleted_at IS NULL
    `;
    const certsResult = await this.db.query<{ name: string }>(certsSql, [product.brand_id]);

    // 5. Fetch claims
    const claimsSql = `
      SELECT cl.name
      FROM product_claims pc
      JOIN claims cl ON cl.id = pc.claim_id
      WHERE pc.product_id = $1 AND pc.deleted_at IS NULL
    `;
    const claimsResult = await this.db.query<{ name: string }>(claimsSql, [productId]);

    // 6. Fetch tags
    const tagsSql = `
      SELECT t.name
      FROM product_tags pt
      JOIN tags t ON t.id = pt.tag_id
      WHERE pt.product_id = $1 AND pt.deleted_at IS NULL
    `;
    const tagsResult = await this.db.query<{ name: string }>(tagsSql, [productId]);

    // 7. Fetch scientific references
    const refsSql = `
      SELECT sr.id, sr.url, ir.evidence_type
      FROM ingredient_references ir
      JOIN scientific_references sr ON sr.id = ir.reference_id
      JOIN product_ingredients pi ON pi.ingredient_id = ir.ingredient_id
      WHERE pi.product_id = $1 AND pi.deleted_at IS NULL AND ir.deleted_at IS NULL
    `;
    const refsResult = await this.db.query<{
      id: string;
      url: string;
      evidence_type: string;
    }>(refsSql, [productId]);

    // 8. Fetch brand certifications list
    const brandCertsSql = `
      SELECT c.name
      FROM brand_certifications bc
      JOIN certifications c ON c.id = bc.certification_id
      WHERE bc.brand_id = $1 AND bc.deleted_at IS NULL
    `;
    const brandCertsResult = await this.db.query<{ name: string }>(brandCertsSql, [product.brand_id]);

    // Assemble the scoring input
    return {
      productId: product.id,
      name: product.name,
      isActive: product.is_active,
      isPublished: product.is_published,
      ingredients: ingredientsResult.rows.map((r: {
        id: string;
        name: string;
        is_animal_derived: boolean;
        is_controversial: boolean;
        is_allergen: boolean;
        safety_score: number;
        category: string | null;
      }) => ({
        id: r.id,
        name: r.name,
        isAnimalDerived: r.is_animal_derived,
        isControversial: r.is_controversial,
        isAllergen: r.is_allergen,
        safetyScore: r.safety_score,
        category: r.category,
      })),
      nutrition: nutritionResult.rows.length > 0 ? {
        kcal: nutritionResult.rows[0].kcal,
        proteinPercent: nutritionResult.rows[0].protein_percent,
        fatPercent: nutritionResult.rows[0].fat_percent,
        fiberPercent: nutritionResult.rows[0].fiber_percent,
        ashPercent: nutritionResult.rows[0].ash_percent,
        moisturePercent: nutritionResult.rows[0].moisture_percent,
      } : null,
      brand: {
        id: product.brand_id,
        name: product.brand_name,
        countryCode: product.country_code,
        certifications: brandCertsResult.rows.map((r: { name: string }) => r.name),
      },
      claims: claimsResult.rows.map((r: { name: string }) => r.name),
      tags: tagsResult.rows.map((r: { name: string }) => r.name),
      scientificReferences: refsResult.rows.map((r: { id: string; url: string; evidence_type: string }) => ({
        id: r.id,
        url: r.url,
        evidenceType: r.evidence_type,
      })),
      hasUpc: product.upc !== null && product.upc !== '',
      hasSku: product.sku !== null && product.sku !== '',
      packageSizeGrams: product.package_size_grams,
      foodForm: product.food_form,
    };
  }

  /**
   * Fetch multiple products for bulk scoring.
   * Returns only active, published products.
   */
  async getProductIdsForBulk(limit: number): Promise<ReadonlyArray<string>> {
    const sql = `
      SELECT id
      FROM products
      WHERE deleted_at IS NULL AND is_active = true AND is_published = true
      ORDER BY updated_at DESC
      LIMIT $1
    `;
    const result = await this.db.query<{ id: string }>(sql, [limit]);
    return result.rows.map((r: { id: string }) => r.id);
  }

  /**
   * Save a computed score to product_scores.
   * Upserts: sets old is_current=false, inserts new is_current=true.
   */
  async saveProductScore(params: {
    productId: string;
    overallScore: number;
    qualityScore: number | null;
    safetyScore: number | null;
    nutritionScore: number | null;
    transparencyScore: number | null;
    scoringVersion: string;
  }): Promise<string> {
    return this.db.transaction(async (client: PoolClient) => {
      // Invalidate previous current score
      await client.query(
        `UPDATE product_scores SET is_current = false, updated_at = NOW()
         WHERE product_id = $1 AND is_current = true AND deleted_at IS NULL`,
        [params.productId],
      );

      // Insert new score
      const result = await client.query(
        `INSERT INTO product_scores (
          product_id, overall_score, quality_score, safety_score,
          nutrition_score, transparency_score, scoring_version, is_current
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING id`,
        [
          params.productId,
          params.overallScore,
          params.qualityScore,
          params.safetyScore,
          params.nutritionScore,
          params.transparencyScore,
          params.scoringVersion,
        ],
      );

      return (result.rows[0] as { id: string }).id;
    });
  }

  /**
   * Save to score_history (append-only).
   */
  async saveScoreHistory(params: {
    productId: string;
    overallScore: number;
    qualityScore: number | null;
    safetyScore: number | null;
    nutritionScore: number | null;
    transparencyScore: number | null;
    scoringVersion: string;
    triggeredBy: string;
    notes?: string;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO score_history (
        product_id, overall_score, quality_score, safety_score,
        nutrition_score, transparency_score, scoring_version,
        triggered_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::score_history_trigger, $9)`,
      [
        params.productId,
        params.overallScore,
        params.qualityScore,
        params.safetyScore,
        params.nutritionScore,
        params.transparencyScore,
        params.scoringVersion,
        params.triggeredBy,
        params.notes ?? null,
      ],
    );
  }

  /**
   * Get the current score for a product.
   */
  async getCurrentScore(productId: string): Promise<{
    id: string;
    overallScore: number;
    qualityScore: number | null;
    safetyScore: number | null;
    nutritionScore: number | null;
    transparencyScore: number | null;
    scoringVersion: string;
    createdAt: string;
  } | null> {
    const sql = `
      SELECT id, overall_score, quality_score, safety_score,
             nutrition_score, transparency_score, scoring_version,
             created_at::text AS created_at
      FROM product_scores
      WHERE product_id = $1 AND is_current = true AND deleted_at IS NULL
      LIMIT 1
    `;
    const result = await this.db.query<{
      id: string;
      overall_score: number;
      quality_score: number | null;
      safety_score: number | null;
      nutrition_score: number | null;
      transparency_score: number | null;
      scoring_version: string;
      created_at: string;
    }>(sql, [productId]);

    if (result.rows.length === 0) return null;
    const r = result.rows[0];
    return {
      id: r.id,
      overallScore: r.overall_score,
      qualityScore: r.quality_score,
      safetyScore: r.safety_score,
      nutritionScore: r.nutrition_score,
      transparencyScore: r.transparency_score,
      scoringVersion: r.scoring_version,
      createdAt: r.created_at,
    };
  }
}
