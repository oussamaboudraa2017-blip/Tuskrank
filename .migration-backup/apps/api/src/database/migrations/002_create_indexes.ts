import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database.service';

const MIGRATION_SQL = `
-- Foreign keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_ingredients_ingredient_id ON product_ingredients(ingredient_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_claims_product_id ON product_claims(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_targeting_product_id ON product_targeting(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_nutrition_profiles_product_id ON nutrition_profiles(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_nutrients_profile_id ON product_nutrients(profile_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_score_history_product_id ON score_history(product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_references_ingredient_id ON ingredient_references(ingredient_id);

-- Trigram indexes for ILIKE / fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_name_trgm ON brands USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_manufacturer_trgm ON brands USING GIN (manufacturer gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_name_trgm ON ingredients USING GIN (name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_canonical_name_trgm ON ingredients USING GIN (canonical_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_inci_name_trgm ON ingredients USING GIN (inci_name gin_trgm_ops);

-- Partial indexes for soft-delete filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published ON products(published_at) WHERE deleted_at IS NULL AND published_at IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_active ON brands(is_active) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_active ON ingredients(is_active) WHERE deleted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_active_published ON products(brand_id, is_active, published_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published_score ON products(published_at, overall_score) WHERE deleted_at IS NULL AND published_at IS NOT NULL;

-- Score indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_scores_ingredient_current ON ingredient_scores(ingredient_id, is_current) WHERE deleted_at IS NULL AND is_current = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_scores_product_current ON product_scores(product_id, is_current) WHERE deleted_at IS NULL AND is_current = true;
`;

@Injectable()
export class CreateIndexesMigration {
  private readonly logger = new Logger(CreateIndexesMigration.name);

  constructor(private readonly db: DatabaseService) {}

  async up(): Promise<void> {
    const statements = MIGRATION_SQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    let applied = 0;
    for (const stmt of statements) {
      try {
        await this.db.query(stmt + ';');
        applied++;
        this.logger.debug(`Applied: ${stmt.slice(0, 80)}...`);
      } catch (err) {
        this.logger.warn(`Skipped (likely already exists or concurrent build): ${stmt.slice(0, 80)}`);
        this.logger.warn((err as Error).message);
      }
    }

    this.logger.log(`Migration 002 complete: ${applied}/${statements.length} statements applied`);
  }
}
