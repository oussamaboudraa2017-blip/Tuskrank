import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';

interface MigrationRecord {
  name: string;
  applied_at: Date;
}

@Injectable()
export class MigrationRunner implements OnModuleInit {
  private readonly logger = new Logger(MigrationRunner.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTrackingTable();
    await this.runPending();
  }

  private async ensureTrackingTable(): Promise<void> {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name    TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  private async runPending(): Promise<void> {
    const migrations = await this.discoverMigrations();
    for (const migration of migrations) {
      const alreadyRun = await this.isApplied(migration.name);
      if (alreadyRun) {
        this.logger.debug(`Migration already applied: ${migration.name}`);
        continue;
      }

      this.logger.log(`Applying migration: ${migration.name}`);
      try {
        await migration.up();
        await this.record(migration.name);
        this.logger.log(`Migration applied: ${migration.name}`);
      } catch (err) {
        this.logger.error(`Migration failed: ${migration.name}`, (err as Error).stack);
        throw err;
      }
    }
  }

  private async discoverMigrations(): Promise<{ name: string; up: () => Promise<unknown> }[]> {
    return [
      { name: '002_create_indexes', up: () => this.db.query(this.getIndexesSql()) },
      { name: '003_create_audit_logs', up: () => this.db.query(this.getAuditLogsSql()) },
    ];
  }

  private getAuditLogsSql(): string {
    return `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     TEXT NOT NULL,
        user_email  TEXT NOT NULL DEFAULT '',
        method      TEXT NOT NULL,
        path        TEXT NOT NULL,
        body        TEXT,
        status_code INTEGER NOT NULL,
        ip          TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_method_path ON audit_logs (method, path);
    `;
  }

  private getIndexesSql(): string {
    return `
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
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_name_trgm ON brands USING GIN (name gin_trgm_ops);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_manufacturer_trgm ON brands USING GIN (manufacturer gin_trgm_ops);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_name_trgm ON ingredients USING GIN (name gin_trgm_ops);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_canonical_name_trgm ON ingredients USING GIN (canonical_name gin_trgm_ops);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_inci_name_trgm ON ingredients USING GIN (inci_name gin_trgm_ops);
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_active ON products(is_active) WHERE deleted_at IS NULL;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published ON products(published_at) WHERE deleted_at IS NULL AND published_at IS NOT NULL;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_brands_active ON brands(is_active) WHERE deleted_at IS NULL;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredients_active ON ingredients(is_active) WHERE deleted_at IS NULL;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_active_published ON products(brand_id, is_active, published_at) WHERE deleted_at IS NULL;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_published_score ON products(published_at, overall_score) WHERE deleted_at IS NULL AND published_at IS NOT NULL;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ingredient_scores_ingredient_current ON ingredient_scores(ingredient_id, is_current) WHERE deleted_at IS NULL AND is_current = true;
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_scores_product_current ON product_scores(product_id, is_current) WHERE deleted_at IS NULL AND is_current = true;
    `;
  }

  private async isApplied(name: string): Promise<boolean> {
    const result = await this.db.query<MigrationRecord>(
      'SELECT name FROM _migrations WHERE name = $1',
      [name],
    );
    return result.rows.length > 0;
  }

  private async record(name: string): Promise<void> {
    await this.db.query(
      'INSERT INTO _migrations (name) VALUES ($1)',
      [name],
    );
  }
}
