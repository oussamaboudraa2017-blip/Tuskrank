import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '@database';
import { ImportRepository } from './import.repository';
import { parseCsv } from './parsers/csv.parser';
import { parseJson } from './parsers/json.parser';
import { validateBrandRow, validateProductRow, validateIngredientRow } from './validators';
import { mapBrandRow, mapProductRow, mapIngredientRow } from './mappers';
import { ImportFormat, ImportEntityType, ImportJobStatus, ImportRowStatus, DedupeStrategy } from './enums';
import type {
  ImportContext,
  ImportJob,
  ImportReport,
  ImportReportError,
  ImportReportWarning,
  ImportRowResult,
  NormalizedBrandRow,
  NormalizedProductRow,
  NormalizedIngredientRow,
} from './types';
import {
  ImportInvalidFormatError,
  ImportInvalidEntityTypeError,
  ImportJobAlreadyRunningError,
  ImportAllRowsFailedError,
} from './errors';

/**
 * Import service — orchestrates the full import pipeline.
 *
 * Pipeline: Import → Validate → Normalize → Deduplicate → Save → Report
 *
 * This service is the ONLY layer that calls the repository.
 */
@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  /** In-memory job store. Replace with DB table in Sprint 5+. */
  private readonly jobs = new Map<string, ImportJob>();

  /** Simple concurrency guard — one import at a time. */
  private running = false;

  /** Pre-loaded lookup cache for FK resolution. Key: `${table}:${lower(name)}`. */
  private lookupCache = new Map<string, { id: string; slug?: string }>();

  constructor(
    private readonly repo: ImportRepository,
    private readonly db: DatabaseService,
  ) {}

  /* ================================================================
   * Public API
   * ================================================================ */

  /**
   * Execute a full import pipeline.
   */
  async import(params: {
    entityType: ImportEntityType;
    format: ImportFormat;
    content: string;
    filename: string;
    dedupeStrategy?: DedupeStrategy;
  }): Promise<ImportJob> {
    if (this.running) throw new ImportJobAlreadyRunningError();

    this.running = true;
    const startTime = Date.now();

    const ctx: ImportContext = {
      jobId: uuid(),
      entityType: params.entityType,
      format: params.format,
      dedupeStrategy: params.dedupeStrategy ?? DedupeStrategy.Skip,
      filename: params.filename,
      rawRows: [],
      normalizedRows: [],
      validatedRows: [],
      deduplicatedRows: [],
      savedResults: [],
      errors: [],
    };

    // Create initial job record
    const job = this.createJob(ctx, startTime);
    this.jobs.set(ctx.jobId, job);

    try {
      // Step 1: Parse
      this.updateJobStatus(ctx.jobId, ImportJobStatus.Parsing);
      ctx.rawRows = this.parse(ctx, params.content);

      // Step 2: Validate
      this.updateJobStatus(ctx.jobId, ImportJobStatus.Validating);
      ctx.validatedRows = this.validate(ctx);

      // Check if all rows failed
      const allFailed = ctx.validatedRows.every((r) => !r.valid);
      if (allFailed && ctx.rawRows.length > 0) {
        throw new ImportAllRowsFailedError(ctx.rawRows.length);
      }

      // Step 3: Normalize (only valid rows)
      this.updateJobStatus(ctx.jobId, ImportJobStatus.Normalizing);
      ctx.normalizedRows = this.normalize(ctx);

      // Step 4: Deduplicate
      this.updateJobStatus(ctx.jobId, ImportJobStatus.Deduplicating);
      ctx.deduplicatedRows = await this.deduplicate(ctx);

      // Step 5: Save
      this.updateJobStatus(ctx.jobId, ImportJobStatus.Saving);
      await this.buildLookupCache(ctx);
      ctx.savedResults = await this.save(ctx);

      // Step 6: Complete
      this.updateJobStatus(ctx.jobId, ImportJobStatus.Completed);
      const completedJob = this.finalizeJob(ctx, startTime);
      this.jobs.set(ctx.jobId, completedJob);

      this.logger.log(
        `Import complete: ${ctx.entityType} — ${completedJob.results.imported} imported, ` +
        `${completedJob.results.updated} updated, ${completedJob.results.skipped} skipped, ` +
        `${completedJob.results.failed} failed (${completedJob.durationMs}ms)`,
      );

      return completedJob;
    } catch (err) {
      this.logger.error(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      const failedJob = this.finalizeJob(ctx, startTime, err instanceof Error ? err.message : String(err));
      this.jobs.set(ctx.jobId, failedJob);
      return failedJob;
    } finally {
      this.running = false;
    }
  }

  /**
   * Get a job by ID.
   */
  getJob(jobId: string): ImportJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs.
   */
  listJobs(): ImportJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
  }

  /**
   * Generate a human-readable import report.
   */
  getReport(jobId: string): ImportReport | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    const errors: ImportReportError[] = [];
    const warnings: ImportReportWarning[] = [];

    for (const row of job.results.rowResults) {
      if (row.status === ImportRowStatus.Failed && row.errors) {
        for (const err of row.errors) {
          errors.push({ rowIndex: row.rowIndex, field: err.field, message: err.message });
        }
      }
    }

    return {
      jobId: job.id,
      entityType: job.entityType,
      filename: job.filename,
      totalRows: job.totalRows,
      imported: job.results.imported,
      updated: job.results.updated,
      skipped: job.results.skipped,
      failed: job.results.failed,
      durationMs: job.durationMs ?? 0,
      startedAt: job.startedAt,
      completedAt: job.completedAt ?? new Date(),
      errors,
      warnings,
    };
  }

  /* ================================================================
   * Lookup cache (N+1 fix)
   * ================================================================ */

  /**
   * Pre-load all lookup table data into a Map for O(1) FK resolution.
   * Eliminates per-row queries for food_forms, protein_sources, pet_types,
   * life_stages, breed_sizes, claims, tags, and nutrients.
   */
  private async buildLookupCache(ctx: ImportContext): Promise<void> {
    this.lookupCache.clear();

    const loadTable = async (tableName: string, query: string) => {
      const result = await this.db.query<{ id: string; name: string; slug?: string }>(query, []);
      for (const row of result.rows) {
        this.lookupCache.set(`${tableName}:${row.name.toLowerCase()}`, {
          id: row.id,
          slug: row.slug,
        });
      }
    };

    await Promise.all([
      loadTable('food_forms', 'SELECT id, name FROM food_forms LIMIT 500'),
      loadTable('protein_sources', 'SELECT id, name FROM protein_sources LIMIT 500'),
      loadTable('pet_types', 'SELECT id, name FROM pet_types LIMIT 50'),
      loadTable('life_stages', 'SELECT id, name FROM life_stages LIMIT 200'),
      loadTable('breed_sizes', 'SELECT id, name FROM breed_sizes LIMIT 200'),
      loadTable('claims', 'SELECT id, name FROM claims WHERE deleted_at IS NULL LIMIT 500'),
      loadTable('tags', 'SELECT id, name FROM tags WHERE deleted_at IS NULL LIMIT 500'),
      loadTable('nutrients', 'SELECT id, name FROM nutrients WHERE deleted_at IS NULL LIMIT 500'),
      loadTable('ingredient_categories', 'SELECT id, name FROM ingredient_categories WHERE deleted_at IS NULL LIMIT 500'),
    ]);

    this.logger.log(`Lookup cache built: ${this.lookupCache.size} entries`);
  }

  private lookupId(table: string, name: string): string | null {
    return this.lookupCache.get(`${table}:${name.toLowerCase()}`)?.id ?? null;
  }

  /* ================================================================
   * Pipeline stages
   * ================================================================ */

  private parse(ctx: ImportContext, content: string): typeof ctx.rawRows {
    if (ctx.format === ImportFormat.Csv) {
      const result = parseCsv(content);
      return [...result.rows];
    }
    if (ctx.format === ImportFormat.Json) {
      const result = parseJson(content);
      return [...result.rows];
    }
    throw new ImportInvalidFormatError(ctx.format);
  }

  private validate(ctx: ImportContext): ImportContext['validatedRows'] {
    return ctx.rawRows.map((row, idx) => {
      const rowIndex = idx + 1; // 1-indexed for human readability
      switch (ctx.entityType) {
        case ImportEntityType.Brands:
          return validateBrandRow(row, rowIndex);
        case ImportEntityType.Products:
          return validateProductRow(row, rowIndex);
        case ImportEntityType.Ingredients:
          return validateIngredientRow(row, rowIndex);
        default:
          throw new ImportInvalidEntityTypeError(ctx.entityType);
      }
    });
  }

  private normalize(ctx: ImportContext): typeof ctx.normalizedRows {
    const validIndices = new Set(
      ctx.validatedRows
        .filter((r) => r.valid)
        .map((r) => r.rowIndex - 1), // back to 0-indexed
    );

    return ctx.rawRows
      .filter((_, idx) => validIndices.has(idx))
      .map((row) => {
        switch (ctx.entityType) {
          case ImportEntityType.Brands:
            return mapBrandRow(row);
          case ImportEntityType.Products:
            return mapProductRow(row);
          case ImportEntityType.Ingredients:
            return mapIngredientRow(row);
          default:
            throw new ImportInvalidEntityTypeError(ctx.entityType);
        }
      });
  }

  private async deduplicate(ctx: ImportContext): Promise<typeof ctx.deduplicatedRows> {
    const results: typeof ctx.deduplicatedRows = [];

    for (const row of ctx.normalizedRows) {
      const isDupe = await this.checkDuplicate(ctx, row);
      if (isDupe) {
        if (ctx.dedupeStrategy === DedupeStrategy.Skip) {
          continue; // Skip duplicate
        }
        // Overwrite/Merge — include in results
      }
      results.push(row);
    }

    return results;
  }

  private async checkDuplicate(
    ctx: ImportContext,
    row: typeof ctx.normalizedRows[number],
  ): Promise<boolean> {
    switch (ctx.entityType) {
      case ImportEntityType.Brands: {
        const brand = row as NormalizedBrandRow;
        const existing = await this.repo.findBrandBySlug(brand.slug);
        return existing !== null;
      }
      case ImportEntityType.Products: {
        const product = row as NormalizedProductRow;
        if (product.upc) {
          const existing = await this.repo.findProductByUpc(product.upc);
          if (existing) return true;
        }
        // Also check brand + slug
        const brand = await this.repo.findBrandByName(product.brandName);
        if (brand) {
          const existing = await this.repo.findProductByBrandAndSlug(brand.id, product.slug);
          if (existing) return true;
        }
        return false;
      }
      case ImportEntityType.Ingredients: {
        const ingredient = row as NormalizedIngredientRow;
        const existing = await this.repo.findIngredientByCanonicalName(ingredient.canonicalName);
        return existing !== null;
      }
      default:
        return false;
    }
  }

  private async save(ctx: ImportContext): Promise<ImportRowResult[]> {
    const results: ImportRowResult[] = [];

    for (const row of ctx.deduplicatedRows) {
      try {
        switch (ctx.entityType) {
          case ImportEntityType.Brands: {
            const result = await this.saveBrand(row as NormalizedBrandRow);
            results.push({
              rowIndex: results.length + 1,
              status: ImportRowStatus.Imported,
              entityId: result.id,
              entitySlug: result.slug,
            });
            break;
          }
          case ImportEntityType.Products: {
            const result = await this.saveProduct(row as NormalizedProductRow);
            results.push({
              rowIndex: results.length + 1,
              status: ImportRowStatus.Imported,
              entityId: result.id,
              entitySlug: result.slug,
            });
            break;
          }
          case ImportEntityType.Ingredients: {
            const result = await this.saveIngredient(row as NormalizedIngredientRow);
            results.push({
              rowIndex: results.length + 1,
              status: ImportRowStatus.Imported,
              entityId: result.id,
              entitySlug: result.slug,
            });
            break;
          }
        }
      } catch (err) {
        results.push({
          rowIndex: results.length + 1,
          status: ImportRowStatus.Failed,
          errors: [{ field: '*', code: 'SAVE_FAILED', message: err instanceof Error ? err.message : String(err) }],
        });
      }
    }

    return results;
  }

  /* ================================================================
   * Entity save helpers
   * ================================================================ */

  private async saveBrand(row: NormalizedBrandRow) {
    return this.repo.insertBrand({
      name: row.name,
      slug: row.slug,
      manufacturer: row.manufacturer,
      countryCode: row.countryCode,
      websiteUrl: row.websiteUrl,
      description: row.description,
      logoImageUrl: row.logoImageUrl,
      isActive: row.isActive,
    });
  }

  private async saveProduct(row: NormalizedProductRow) {
    return this.db.transaction(async (_client: import('pg').PoolClient) => {
      // Resolve brand (still per-row since brands may be auto-created)
      let brand = await this.repo.findBrandByName(row.brandName);
      if (!brand) {
        brand = await this.repo.insertBrand({
          name: row.brandName,
          slug: row.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        });
      }

      // Resolve food form (from cache)
      const foodFormId = row.foodForm ? this.lookupId('food_forms', row.foodForm) : null;

      // Resolve protein source (from cache)
      const proteinSourceId = row.primaryProteinSource
        ? this.lookupId('protein_sources', row.primaryProteinSource)
        : null;

      const product = await this.repo.insertProduct({
        brandId: brand.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        upc: row.upc,
        sku: row.sku,
        packageSizeGrams: row.packageSizeGrams,
        packageSizeLabel: row.packageSizeLabel,
        foodFormId,
        primaryProteinSourceId: proteinSourceId,
        isActive: row.isActive,
      });

      // Resolve and insert targeting (from cache)
      for (const petTypeName of row.petTypes) {
        const petTypeId = this.lookupId('pet_types', petTypeName);
        if (petTypeId) {
          const lifeStageId = row.lifeStages.length > 0
            ? this.lookupId('life_stages', row.lifeStages[0])
            : null;
          const breedSizeId = row.breedSizes.length > 0
            ? this.lookupId('breed_sizes', row.breedSizes[0])
            : null;

          await this.repo.insertProductTargeting({
            productId: product.id,
            petTypeId,
            lifeStageId,
            breedSizeId,
          });
        }
      }

      // Resolve and insert claims (from cache)
      for (const claimName of row.claims) {
        const claimId = this.lookupId('claims', claimName);
        if (claimId) {
          await this.repo.insertProductClaim(product.id, claimId);
        }
      }

      // Resolve and insert tags (from cache)
      for (const tagName of row.tags) {
        const tagId = this.lookupId('tags', tagName);
        if (tagId) {
          await this.repo.insertProductTag(product.id, tagId);
        }
      }

      // Insert nutrition profile if we have calorie data
      if (row.kcalPer100g !== null || row.moisturePct !== null) {
        const profile = await this.repo.insertNutritionProfile({
          productId: product.id,
          kcalPer100g: row.kcalPer100g,
          moisturePct: row.moisturePct,
          source: 'import',
        });

        // Insert nutrient values (from cache)
        const nutrientMap: Array<{ name: string; value: number | null; unit: string }> = [
          { name: 'Protein', value: row.proteinPct, unit: '%' },
          { name: 'Fat', value: row.fatPct, unit: '%' },
          { name: 'Fiber', value: row.fiberPct, unit: '%' },
          { name: 'Ash', value: row.ashPct, unit: '%' },
          { name: 'Omega-3 Fatty Acids', value: row.omega3Pct, unit: '%' },
          { name: 'Omega-6 Fatty Acids', value: row.omega6Pct, unit: '%' },
          { name: 'Calcium', value: row.calciumPct, unit: '%' },
          { name: 'Phosphorus', value: row.phosphorusPct, unit: '%' },
        ];

        for (const nutrient of nutrientMap) {
          if (nutrient.value !== null) {
            const nutrientId = this.lookupId('nutrients', nutrient.name);
            if (nutrientId) {
              await this.repo.insertProductNutrient({
                productId: product.id,
                nutrientId,
                nutritionProfileId: profile.id,
                amount: nutrient.value,
                unit: nutrient.unit,
              });
            }
          }
        }
      }

      // Insert image
      if (row.imageUrl) {
        await this.repo.insertProductImage({
          productId: product.id,
          publicUrl: row.imageUrl,
          storagePath: `imports/${product.slug}/image`,
          altText: row.name,
          isPrimary: true,
        });
      }

      return product;
    });
  }

  private async saveIngredient(row: NormalizedIngredientRow) {
    return this.db.transaction(async () => {
      const categoryId = row.category ? this.lookupId('ingredient_categories', row.category) : null;

      return this.repo.insertIngredient({
        name: row.name,
        slug: row.slug,
        inciName: row.inciName,
        categoryId,
        canonicalName: row.canonicalName,
        description: row.description,
        isAnimalDerived: row.isAnimalDerived,
        isCommonAllergen: row.isCommonAllergen,
        isControversial: row.isControversial,
        isActive: row.isActive,
      });
    });
  }

  /* ================================================================
   * Job management helpers
   * ================================================================ */

  private createJob(ctx: ImportContext, startTime: number): ImportJob {
    return {
      id: ctx.jobId,
      entityType: ctx.entityType,
      format: ctx.format,
      dedupeStrategy: ctx.dedupeStrategy,
      status: ImportJobStatus.Pending,
      filename: ctx.filename,
      totalRows: 0,
      processedRows: 0,
      results: { imported: 0, updated: 0, skipped: 0, failed: 0, rowResults: [] },
      startedAt: new Date(startTime),
      completedAt: null,
      durationMs: null,
      errors: [],
    };
  }

  private updateJobStatus(jobId: string, status: ImportJobStatus): void {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.set(jobId, { ...job, status });
    }
  }

  private finalizeJob(ctx: ImportContext, startTime: number, error?: string): ImportJob {
    const durationMs = Date.now() - startTime;
    const imported = ctx.savedResults.filter((r) => r.status === ImportRowStatus.Imported).length;
    const updated = ctx.savedResults.filter((r) => r.status === ImportRowStatus.Updated).length;
    const skipped = ctx.rawRows.length - ctx.normalizedRows.length;
    const failed = ctx.savedResults.filter((r) => r.status === ImportRowStatus.Failed).length + (error ? 1 : 0);

    return {
      id: ctx.jobId,
      entityType: ctx.entityType,
      format: ctx.format,
      dedupeStrategy: ctx.dedupeStrategy,
      status: error ? ImportJobStatus.Failed : ImportJobStatus.Completed,
      filename: ctx.filename,
      totalRows: ctx.rawRows.length,
      processedRows: ctx.savedResults.length,
      results: { imported, updated, skipped, failed, rowResults: ctx.savedResults },
      startedAt: new Date(startTime),
      completedAt: new Date(),
      durationMs,
      errors: error ? [error] : ctx.errors,
    };
  }
}
