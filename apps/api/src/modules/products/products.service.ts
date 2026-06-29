import { Injectable, Logger } from '@nestjs/common';
import type { Uuid } from '@types';
import { ProductsRepository } from './repositories/products.repository';
import { BrandsRepository } from './repositories/brands.repository';
import type { Product, ProductSummary } from './domain/types';
import type {
  ProductQuery,
  ProductSearchInput,
  ProductListFilters,
  ProductSort,
  ProductPagination,
} from './domain/interfaces/product-query.interface';
import { ProductSortField, SortOrder } from './domain/enums/product.enums';
import {
  ProductNotFoundError,
  ProductSlugCollisionError,
  ProductUpcCollisionError,
  ProductSkuCollisionError,
  BrandNotFoundError,
  ProductInvalidLifecycleTransitionError,
  ProductSoftDeletedError,
} from './domain/errors';

/**
 * Products service — business orchestration layer.
 *
 * The service is the ONLY layer that calls repositories. Controllers
 * must never inject repositories directly. This keeps transactions
 * scoped to a single use case.
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly products: ProductsRepository,
    private readonly brands: BrandsRepository,
  ) {}

  /* ================================================================
   * Read (public)
   * ================================================================ */

  /** GET /api/v1/products/:slug */
  async findBySlug(slug: string): Promise<Product> {
    const product = await this.products.findBySlug(slug);
    if (!product) throw new ProductNotFoundError(slug);
    return product;
  }

  /** GET /api/v1/products/:slug (admin — includes soft-deleted + unpublished) */
  async findBySlugAdmin(slug: string): Promise<Product> {
    const product = await this.products.findBySlug(slug, {
      includeSoftDeleted: true,
      includeUnpublished: true,
    });
    if (!product) throw new ProductNotFoundError(slug);
    return product;
  }

  /** GET /api/v1/products (paginated list) */
  async list(query: ProductQuery): Promise<{ items: ReadonlyArray<Product>; total: number }> {
    const [items, total] = await Promise.all([
      this.products.findMany(query),
      this.products.count(query),
    ]);
    return { items, total };
  }

  /** GET /api/v1/products (featured) */
  async findFeatured(
    pagination: { page: number; limit: number },
    options?: { petType?: string },
  ): Promise<ReadonlyArray<Product>> {
    return this.products.findFeatured(pagination, options);
  }

  /** GET /api/v1/products (top-rated from materialized view) */
  async findTopRated(
    pagination: { page: number; limit: number },
    options?: { petType?: string; minScore?: number },
  ): Promise<ReadonlyArray<Product>> {
    return this.products.findTopRated(pagination, options);
  }

  /** GET /api/v1/products/search?q=... */
  async search(input: ProductSearchInput): Promise<ReadonlyArray<Product>> {
    return this.products.search(input);
  }

  /* ================================================================
   * Mutations (admin)
   * ================================================================ */

  /** POST /api/v1/products */
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
  }): Promise<Product> {
    // 1. Verify brand exists
    const brand = await this.brands.findById(input.brandId as Uuid);
    if (!brand) throw new BrandNotFoundError(input.brandId);

    // 2. Check (brand, slug) uniqueness
    const slugExists = await this.products.existsByBrandSlug(
      input.brandId as Uuid,
      input.slug,
    );
    if (slugExists) throw new ProductSlugCollisionError(input.brandId as Uuid, input.slug);

    // 3. Check UPC uniqueness (if provided)
    if (input.upc) {
      const upcExists = await this.products.existsByUpc(input.upc);
      if (upcExists) throw new ProductUpcCollisionError(input.upc);
    }

    // 4. Check (brand, SKU) uniqueness (if provided)
    if (input.sku) {
      const skuExists = await this.products.existsByBrandSku(
        input.brandId as Uuid,
        input.sku,
      );
      if (skuExists) throw new ProductSkuCollisionError(input.brandId as Uuid, input.sku);
    }

    // 5. Create
    const product = await this.products.create({
      brandId: input.brandId as Uuid,
      name: input.name,
      slug: input.slug,
      description: input.description,
      upc: input.upc,
      sku: input.sku,
      packageSizeGrams: input.packageSizeGrams,
      packageSizeLabel: input.packageSizeLabel,
      foodFormId: input.foodFormId as Uuid | null,
      primaryProteinSourceId: input.primaryProteinSourceId as Uuid | null,
      isActive: input.isActive,
    });

    // 6. Publish immediately if requested
    if (input.publishImmediately) {
      await this.products.publish(product.id);
    }

    this.logger.log(`Created product ${product.id} (${product.slug})`);
    return this.products.findById(product.id, { includeUnpublished: true }) as Promise<Product>;
  }

  /** PATCH /api/v1/products/:productId */
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
  ): Promise<Product> {
    const existing = await this.products.findById(productId, {
      includeUnpublished: true,
      includeSoftDeleted: true,
    });
    if (!existing) throw new ProductNotFoundError(productId);

    // Check slug uniqueness (if changing)
    if (patch.name !== undefined || patch.slug !== undefined) {
      // slug is not directly updatable in the current schema (UNIQUE per brand)
      // but name changes don't affect slug — slug is set at creation only.
    }

    // Check UPC uniqueness (if changing)
    if (patch.upc !== undefined && patch.upc !== null && patch.upc !== (existing.upc as unknown as string | null)) {
      const upcExists = await this.products.existsByUpc(patch.upc, productId);
      if (upcExists) throw new ProductUpcCollisionError(patch.upc);
    }

    // Check (brand, SKU) uniqueness (if changing)
    if (patch.sku !== undefined && patch.sku !== null && patch.sku !== (existing.sku as unknown as string | null)) {
      const skuExists = await this.products.existsByBrandSku(
        existing.brandId,
        patch.sku,
        productId,
      );
      if (skuExists) throw new ProductSkuCollisionError(existing.brandId, patch.sku);
    }

    const updated = await this.products.update(productId, patch);
    this.logger.log(`Updated product ${productId}`);
    return updated;
  }

  /** POST /api/v1/products/:productId/publish */
  async publish(productId: Uuid, publishAt?: Date): Promise<Product> {
    const existing = await this.products.findById(productId, {
      includeUnpublished: true,
      includeSoftDeleted: true,
    });
    if (!existing) throw new ProductNotFoundError(productId);

    await this.products.publish(productId, publishAt);
    this.logger.log(`Published product ${productId}`);
    return this.products.findById(productId, { includeUnpublished: true }) as Promise<Product>;
  }

  /** POST /api/v1/products/:productId/unpublish */
  async unpublish(productId: Uuid): Promise<Product> {
    const existing = await this.products.findById(productId, {
      includeUnpublished: true,
      includeSoftDeleted: true,
    });
    if (!existing) throw new ProductNotFoundError(productId);

    await this.products.unpublish(productId);
    this.logger.log(`Unpublished product ${productId}`);
    return this.products.findById(productId, { includeUnpublished: true }) as Promise<Product>;
  }

  /** POST /api/v1/products/:productId/soft-delete */
  async softDelete(productId: Uuid): Promise<void> {
    const existing = await this.products.findById(productId, {
      includeUnpublished: true,
      includeSoftDeleted: true,
    });
    if (!existing) throw new ProductNotFoundError(productId);

    await this.products.softDelete(productId);
    this.logger.log(`Soft-deleted product ${productId}`);
  }

  /** POST /api/v1/products/:productId/restore */
  async restore(productId: Uuid): Promise<Product> {
    const existing = await this.products.findById(productId, {
      includeUnpublished: true,
      includeSoftDeleted: true,
    });
    if (!existing) throw new ProductNotFoundError(productId);

    await this.products.restore(productId);
    this.logger.log(`Restored product ${productId}`);
    return this.products.findById(productId, { includeUnpublished: true }) as Promise<Product>;
  }

  /* ================================================================
   * Helpers
   * ================================================================ */

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

    const filters: ProductListFilters = {};
    if (params.q) filters.q = params.q;
    if (params.brandId) filters.brandId = params.brandId as Uuid;
    if (params.petType) filters.petType = params.petType as never;
    if (params.lifeStage) filters.lifeStage = params.lifeStage as never;
    if (params.breedSize) filters.breedSize = params.breedSize as never;
    if (params.foodForm) filters.foodForm = params.foodForm as never;
    if (params.proteinOrigin) filters.proteinOrigin = params.proteinOrigin as never;
    if (params.minScore !== undefined) filters.minScore = params.minScore;
    if (params.maxScore !== undefined) filters.maxScore = params.maxScore;
    if (params.isActive !== undefined) filters.isActive = params.isActive;
    if (params.isPublished !== undefined) filters.isPublished = params.isPublished;

    const sort: ProductSort = {
      by: (params.sortBy as ProductSortField) ?? ProductSortField.PublishedAt,
      order: params.sortOrder === 'asc' ? SortOrder.Asc : SortOrder.Desc,
    };

    const pagination: ProductPagination = {
      page,
      limit,
      total: 0, // computed by repository
    };

    return { filters, sort, pagination };
  }
}
