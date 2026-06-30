import { Injectable, Logger } from '@nestjs/common';
import { BrandsReadRepository, BrandsWriteRepository } from './brands.repository';
import type { BrandRow } from './brands.repository';
import type { BrandQuery, BrandSearchInput } from './domain/interfaces';
import { BrandSortField, SortOrder } from './domain/enums';
import {
  BrandNotFoundError,
  BrandSlugCollisionError,
  BrandHasProductsError,
  BrandInvalidLifecycleTransitionError,
} from './domain/errors';
import { BRAND_BOUNDS } from './domain/constants';
import type { Uuid } from '@types';
import { CacheService } from '@shared';

/**
 * Brands service — business orchestration.
 *
 * The ONLY layer that calls the repository. Throws typed domain errors.
 */
@Injectable()
export class BrandsService {
  private readonly logger = new Logger(BrandsService.name);

  constructor(
    private readonly readRepo: BrandsReadRepository,
    private readonly writeRepo: BrandsWriteRepository,
    private readonly cache: CacheService,
  ) {}

  /* ================================================================
   * Read methods
   * ================================================================ */

  async findBySlug(slug: string) {
    const cached = await this.cache.get<ReturnType<typeof this.toDomain>>(`brand:slug:${slug}`);
    if (cached) return cached;
    const row = await this.readRepo.findBySlug(slug);
    if (!row) throw new BrandNotFoundError(slug);
    const domain = this.toDomain(row);
    await this.cache.set(`brand:slug:${slug}`, domain, 300_000);
    return domain;
  }

  async findById(id: Uuid) {
    const cached = await this.cache.get<ReturnType<typeof this.toDomain>>(`brand:${id}`);
    if (cached) return cached;
    const row = await this.readRepo.findById(id);
    if (!row) throw new BrandNotFoundError(id);
    const domain = this.toDomain(row);
    await this.cache.set(`brand:${id}`, domain, 300_000);
    return domain;
  }

  async list(query: BrandQuery) {
    const [rows, total] = await Promise.all([
      this.readRepo.findMany(query),
      this.readRepo.count(query.filters),
    ]);
    const summaries = rows.map((r) => this.toSummary(r));
    return { items: summaries, total };
  }

  async search(input: BrandSearchInput) {
    const { items: rows, total } = await this.readRepo.search(input);
    const summaries = rows.map((r) => this.toSummary(r));
    return { items: summaries, total };
  }

  async findFeatured(limit = 10) {
    const cached = await this.cache.get<ReturnType<typeof this.toSummary>[]>(`brand:featured`);
    if (cached) return cached;
    const rows = await this.readRepo.findFeatured(limit);
    const summaries = rows.map((r) => this.toSummary(r));
    await this.cache.set(`brand:featured`, summaries, 600_000);
    return summaries;
  }

  /* ================================================================
   * Mutation methods
   * ================================================================ */

  async create(data: {
    name: string;
    slug?: string;
    manufacturer?: string | null;
    countryCode?: string | null;
    websiteUrl?: string | null;
    description?: string | null;
    logoImageUrl?: string | null;
    isActive?: boolean;
  }) {
    const slug = data.slug ?? this.slugify(data.name);

    if (await this.readRepo.existsBySlug(slug)) {
      throw new BrandSlugCollisionError(slug);
    }

    const row = await this.writeRepo.create({ ...data, slug });
    await this.cache.deleteByPattern('brand:featured');
    this.logger.log(`Created brand ${row.id} (${row.name})`);
    return this.toDomain(row);
  }

  async update(
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
  ) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new BrandNotFoundError(id);

    if (data.slug && data.slug !== existing.slug) {
      if (await this.readRepo.existsBySlug(data.slug, id)) {
        throw new BrandSlugCollisionError(data.slug);
      }
    }

    const row = await this.writeRepo.update(id, data);
    await this.cache.delete(`brand:${id}`);
    await this.cache.delete(`brand:slug:${existing.slug}`);
    if (data.slug && data.slug !== existing.slug) {
      await this.cache.delete(`brand:slug:${data.slug}`);
    }
    await this.cache.deleteByPattern('brand:featured');
    this.logger.log(`Updated brand ${id}`);
    return this.toDomain(row);
  }

  async softDelete(id: Uuid) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new BrandNotFoundError(id);

    const productCount = await this.readRepo.countProducts(id);
    if (productCount > 0) {
      throw new BrandHasProductsError();
    }

    await this.writeRepo.softDelete(id);
    await this.cache.delete(`brand:${id}`);
    await this.cache.delete(`brand:slug:${existing.slug}`);
    await this.cache.deleteByPattern('brand:featured');
    this.logger.log(`Soft-deleted brand ${id}`);
  }

  async restore(id: Uuid) {
    const existing = await this.readRepo.findById(id, { includeSoftDeleted: true });
    if (!existing) throw new BrandNotFoundError(id);
    if (!existing.deleted_at) {
      throw new BrandInvalidLifecycleTransitionError('active', 'restore');
    }
    await this.writeRepo.restore(id);
    await this.cache.delete(`brand:${id}`);
    await this.cache.delete(`brand:slug:${existing.slug}`);
    await this.cache.deleteByPattern('brand:featured');
    this.logger.log(`Restored brand ${id}`);
    return this.findById(id);
  }

  async activate(id: Uuid) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new BrandNotFoundError(id);
    if (existing.is_active) return this.toDomain(existing);
    const row = await this.writeRepo.update(id, { isActive: true });
    await this.cache.delete(`brand:${id}`);
    await this.cache.deleteByPattern('brand:featured');
    this.logger.log(`Activated brand ${id}`);
    return this.toDomain(row);
  }

  async deactivate(id: Uuid) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new BrandNotFoundError(id);
    if (!existing.is_active) return this.toDomain(existing);
    const row = await this.writeRepo.update(id, { isActive: false });
    await this.cache.delete(`brand:${id}`);
    await this.cache.deleteByPattern('brand:featured');
    this.logger.log(`Deactivated brand ${id}`);
    return this.toDomain(row);
  }

  /* ================================================================
   * Query builder
   * ================================================================ */

  buildQueryFromDto(params: {
    page?: number;
    limit?: number;
    q?: string;
    countryCode?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }): BrandQuery {
    return {
      filters: {
        q: params.q,
        countryCode: params.countryCode,
        isActive: params.isActive,
      },
      sort: {
        by: (params.sortBy as BrandSortField) ?? BRAND_BOUNDS.sortBy,
        order: (params.sortOrder as SortOrder) ?? BRAND_BOUNDS.sortOrder,
      },
      pagination: {
        page: params.page ?? 1,
        limit: params.limit ?? BRAND_BOUNDS.defaultLimit,
        total: 0,
      },
    };
  }

  /* ================================================================
   * Domain mapping (wire → domain)
   * ================================================================ */

  private toDomain(row: BrandRow) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      manufacturer: row.manufacturer,
      countryCode: row.country_code,
      websiteUrl: row.website_url,
      description: row.description,
      logoImageUrl: row.logo_image_url,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      productCount: row.product_count !== null && row.product_count !== undefined ? Number(row.product_count) : undefined,
      avgOverallScore: row.avg_overall_score !== null && row.avg_overall_score !== undefined ? Number(row.avg_overall_score) : null,
      avgQualityScore: row.avg_quality_score !== null && row.avg_quality_score !== undefined ? Number(row.avg_quality_score) : null,
      avgSafetyScore: row.avg_safety_score !== null && row.avg_safety_score !== undefined ? Number(row.avg_safety_score) : null,
      avgNutritionScore: row.avg_nutrition_score !== null && row.avg_nutrition_score !== undefined ? Number(row.avg_nutrition_score) : null,
      avgTransparencyScore: row.avg_transparency_score !== null && row.avg_transparency_score !== undefined ? Number(row.avg_transparency_score) : null,
      openRecallCount: row.open_recall_count !== null && row.open_recall_count !== undefined ? Number(row.open_recall_count) : undefined,
    };
  }

  private toSummary(row: BrandRow) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      manufacturer: row.manufacturer,
      countryCode: row.country_code,
      websiteUrl: row.website_url,
      logoImageUrl: row.logo_image_url,
      isActive: row.is_active,
      productCount: row.product_count !== null && row.product_count !== undefined ? Number(row.product_count) : 0,
      avgOverallScore: row.avg_overall_score !== null && row.avg_overall_score !== undefined ? Number(row.avg_overall_score) : null,
    };
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
