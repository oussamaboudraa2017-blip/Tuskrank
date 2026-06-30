import { Injectable, Logger } from '@nestjs/common';
import type { Uuid } from '@types';
import {
  ProductsReadRepository,
  ProductsWriteRepository,
  ProductsSearchRepository,
  ProductLookupRepository,
} from './repositories/products.repository';
import { BrandsRepository } from './repositories/brands.repository';
import { ProductMapper } from './domain/mapping/product.mapper';
import type { ProductQuery, ProductSearchInput } from './domain/interfaces/product-query.interface';
import {
  ProductSortField,
  SortOrder,
} from './domain/enums';
import {
  ProductNotFoundError,
  ProductSlugCollisionError,
  ProductUpcCollisionError,
  ProductSkuCollisionError,
  BrandNotFoundError,
} from './domain/errors';
import { ProductEntity } from './domain/product.entity';
import type {
  ProductListFilters,
  ProductSort,
  ProductPagination,
} from './domain/interfaces/product-query.interface';
import {
  BreedSizeSlug,
  FoodFormSlug,
  LifeStageSlug,
  PetTypeSlug,
  ProteinOrigin,
} from './domain/enums';
import type { ProductRow } from './domain/mapping/product.db-model';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly readRepo: ProductsReadRepository,
    private readonly writeRepo: ProductsWriteRepository,
    private readonly searchRepo: ProductsSearchRepository,
    private readonly lookupRepo: ProductLookupRepository,
    private readonly brands: BrandsRepository,
  ) {}

  /* ================================================================
   * Read
   * ================================================================ */

  async findBySlug(slug: string): Promise<ProductEntity> {
    const row = await this.readRepo.findBySlug(slug);
    if (!row) throw new ProductNotFoundError(slug);
    const hydrated = await this.readRepo.hydrateSingle(row);
    return ProductMapper.dbToDomain(hydrated);
  }

  async list(query: ProductQuery): Promise<{ items: ProductEntity[]; total: number; nextCursor?: string | null }> {
    if (query.cursor) {
      const { rows, nextCursor, total } = await this.readRepo.findManyCursor(query);
      const hydrated = await this.readRepo.batchHydrate(rows);
      return {
        items: hydrated.map((r) => ProductMapper.dbToDomain(r)),
        total,
        nextCursor,
      };
    }
    const { rows, total } = await this.readRepo.findMany(query);
    const hydrated = await this.readRepo.batchHydrate(rows);
    return {
      items: hydrated.map((r) => ProductMapper.dbToDomain(r)),
      total,
    };
  }

  async findFeatured(
    pagination: { page: number; limit: number },
    options?: { petType?: string },
  ): Promise<ProductEntity[]> {
    const rows = await this.readRepo.findFeatured(pagination, options);
    const hydrated = await this.readRepo.batchHydrate(rows);
    return hydrated.map((r) => ProductMapper.dbToDomain(r));
  }

  async search(input: ProductSearchInput): Promise<ProductEntity[]> {
    const rows = await this.searchRepo.search(input);
    const hydrated = await this.readRepo.batchHydrate(rows);
    return hydrated.map((r) => ProductMapper.dbToDomain(r));
  }

  /* ================================================================
   * Mutations
   * ================================================================ */

  async create(input: {
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
    publishImmediately?: boolean;
  }): Promise<ProductEntity> {
    const brand = await this.brands.findById(input.brandId);
    if (!brand) throw new BrandNotFoundError(input.brandId);

    const slugExists = await this.readRepo.existsByBrandSlug(input.brandId, input.slug);
    if (slugExists) throw new ProductSlugCollisionError(input.brandId, input.slug);

    if (input.upc) {
      const upcExists = await this.readRepo.existsByUpc(input.upc);
      if (upcExists) throw new ProductUpcCollisionError(input.upc);
    }

    if (input.sku) {
      const skuExists = await this.readRepo.existsByBrandSku(input.brandId, input.sku);
      if (skuExists) throw new ProductSkuCollisionError(input.brandId, input.sku);
    }

    const row = await this.writeRepo.create({
      brandId: input.brandId,
      name: input.name,
      slug: input.slug,
      description: input.description,
      upc: input.upc,
      sku: input.sku,
      packageSizeGrams: input.packageSizeGrams,
      packageSizeLabel: input.packageSizeLabel,
      foodFormId: input.foodFormId,
      primaryProteinSourceId: input.primaryProteinSourceId,
      isActive: input.isActive,
    });

    if (input.publishImmediately) {
      await this.writeRepo.publish(row.id);
    }

    this.logger.log(`Created product ${row.id} (${row.slug})`);

    const hydrated = await this.readRepo.hydrateSingle(row);
    return ProductMapper.dbToDomain(hydrated);
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
  ): Promise<ProductEntity> {
    const existing = await this.readRepo.findById(productId);
    if (!existing) throw new ProductNotFoundError(productId);

    if (patch.upc !== undefined && patch.upc !== null && patch.upc !== existing.upc) {
      const exists = await this.readRepo.existsByUpc(patch.upc, productId);
      if (exists) throw new ProductUpcCollisionError(patch.upc);
    }

    if (patch.sku !== undefined && patch.sku !== null && patch.sku !== existing.sku) {
      const exists = await this.readRepo.existsByBrandSku(existing.brand_id, patch.sku, productId);
      if (exists) throw new ProductSkuCollisionError(existing.brand_id, patch.sku);
    }

    await this.writeRepo.update(productId, patch);

    const updated = await this.readRepo.findById(productId);
    if (!updated) throw new ProductNotFoundError(productId);
    const hydrated = await this.readRepo.hydrateSingle(updated);
    return ProductMapper.dbToDomain(hydrated);
  }

  async publish(productId: Uuid, publishAt?: Date): Promise<ProductEntity> {
    const existing = await this.readRepo.findById(productId);
    if (!existing) throw new ProductNotFoundError(productId);

    await this.writeRepo.publish(productId, publishAt);
    this.logger.log(`Published product ${productId}`);

    const updated = await this.readRepo.findById(productId);
    if (!updated) throw new ProductNotFoundError(productId);
    const hydrated = await this.readRepo.hydrateSingle(updated);
    return ProductMapper.dbToDomain(hydrated);
  }

  async unpublish(productId: Uuid): Promise<ProductEntity> {
    const existing = await this.readRepo.findById(productId);
    if (!existing) throw new ProductNotFoundError(productId);

    await this.writeRepo.unpublish(productId);
    this.logger.log(`Unpublished product ${productId}`);

    const updated = await this.readRepo.findById(productId);
    if (!updated) throw new ProductNotFoundError(productId);
    const hydrated = await this.readRepo.hydrateSingle(updated);
    return ProductMapper.dbToDomain(hydrated);
  }

  async softDelete(productId: Uuid): Promise<void> {
    const existing = await this.readRepo.findById(productId);
    if (!existing) throw new ProductNotFoundError(productId);

    await this.writeRepo.softDelete(productId);
    this.logger.log(`Soft-deleted product ${productId}`);
  }

  async restore(productId: Uuid): Promise<ProductEntity> {
    const existing = await this.readRepo.findById(productId);
    if (!existing) throw new ProductNotFoundError(productId);

    await this.writeRepo.restore(productId);
    this.logger.log(`Restored product ${productId}`);

    const updated = await this.readRepo.findById(productId);
    if (!updated) throw new ProductNotFoundError(productId);
    const hydrated = await this.readRepo.hydrateSingle(updated);
    return ProductMapper.dbToDomain(hydrated);
  }

  buildQueryFromDto(params: {
    page?: number;
    limit?: number;
    q?: string;
    brandId?: string;
    petType?: string;
    lifeStage?: string;
    breedSize?: string;
    foodForm?: string;
    proteinOrigin?: string;
    minScore?: number;
    maxScore?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
    isPublished?: boolean;
  }): ProductQuery {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const filters: ProductListFilters = {
      ...(params.q && { q: params.q }),
      ...(params.brandId && { brandId: params.brandId as Uuid }),
      ...(params.petType && { petType: params.petType as PetTypeSlug }),
      ...(params.lifeStage && { lifeStage: params.lifeStage as LifeStageSlug }),
      ...(params.breedSize && { breedSize: params.breedSize as BreedSizeSlug }),
      ...(params.foodForm && { foodForm: params.foodForm as FoodFormSlug }),
      ...(params.proteinOrigin && { proteinOrigin: params.proteinOrigin as ProteinOrigin }),
      ...(params.minScore !== undefined && { minScore: params.minScore }),
      ...(params.maxScore !== undefined && { maxScore: params.maxScore }),
      ...(params.isActive !== undefined && { isActive: params.isActive }),
      ...(params.isPublished !== undefined && { isPublished: params.isPublished }),
    };

    const sort: ProductSort = {
      by: (params.sortBy as ProductSortField) ?? ProductSortField.PublishedAt,
      order: params.sortOrder === 'asc' ? SortOrder.Asc : SortOrder.Desc,
    };

    const pagination: ProductPagination = { page, limit, total: 0 };

    return { filters, sort, pagination };
  }
}
