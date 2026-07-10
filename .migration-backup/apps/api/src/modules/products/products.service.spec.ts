import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsReadRepository, ProductsWriteRepository, ProductsSearchRepository, ProductLookupRepository } from './repositories/products.repository';
import { BrandsRepository } from './repositories/brands.repository';
import { ProductEntity } from './domain/product.entity';
import { ProductNotFoundError, ProductSlugCollisionError, ProductUpcCollisionError, BrandNotFoundError } from './domain/errors';
import { ProductSortField, SortOrder } from './domain/enums';
import type { Uuid } from '@types';
import { CacheService } from '@shared';

const u = (id: string) => id as unknown as Uuid;
const P1 = u('p1');
const B1 = u('b1');

const baseHydratedRow = (overrides = {}) => ({
  id: P1, brand_id: B1, name: 'Test', slug: 'test', description: null,
  upc: null, sku: null, package_size_grams: null, package_size_label: null,
  food_form_id: null, primary_protein_source_id: null,
  is_active: true, published_at: null,
  created_at: new Date(), updated_at: new Date(), deleted_at: null,
  brand_name: 'Brand', brand_slug: 'brand', brand_manufacturer: null,
  brand_country_code: null, brand_website_url: null, brand_description: null,
  brand_logo_image_url: null, brand_is_active: true,
  food_form_slug: null, food_form_name: null, food_form_is_active: null,
  protein_source_slug: null, protein_source_name: null,
  protein_source_origin: null, protein_source_is_active: null,
  score_id: null, score_overall: null, score_grade: null,
  score_quality: null, score_safety: null, score_nutrition: null,
  score_transparency: null, score_scoring_version: null,
  score_updated_at: null, score_is_current: null,
  images: [], ingredient_panel: [], tags: [], claims: [], targeting: [],
  nutrition_profiles: [], nutrient_values: [], score_history: [],
  ...overrides,
});

const mockReadRepo = {
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findMany: jest.fn(),
  findManyCursor: jest.fn(),
  findFeatured: jest.fn(),
  batchHydrate: jest.fn(),
  hydrateSingle: jest.fn(),
  existsByBrandSlug: jest.fn(),
  existsByUpc: jest.fn(),
  existsByBrandSku: jest.fn(),
};

const mockWriteRepo = {
  create: jest.fn(),
  update: jest.fn(),
  publish: jest.fn(),
  unpublish: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
};

const mockSearchRepo = { search: jest.fn() };
const mockLookupRepo = {};
const mockBrandsRepo = { findById: jest.fn() };

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsReadRepository, useValue: mockReadRepo },
        { provide: ProductsWriteRepository, useValue: mockWriteRepo },
        { provide: ProductsSearchRepository, useValue: mockSearchRepo },
        { provide: ProductLookupRepository, useValue: mockLookupRepo },
        { provide: BrandsRepository, useValue: mockBrandsRepo },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), delete: jest.fn(), deleteByPattern: jest.fn(), clear: jest.fn(), stats: jest.fn() } },
      ],
    }).compile();
    service = module.get<ProductsService>(ProductsService);
  });

  describe('findBySlug', () => {
    it('returns product when found', async () => {
      const row = baseHydratedRow();
      mockReadRepo.findBySlug.mockResolvedValue(row);
      mockReadRepo.hydrateSingle.mockResolvedValue(row);
      const result = await service.findBySlug('test');
      expect(result).toBeInstanceOf(ProductEntity);
      expect(result.id).toBe(P1);
    });

    it('throws ProductNotFoundError when not found', async () => {
      mockReadRepo.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('list', () => {
    it('returns paginated results', async () => {
      const row = baseHydratedRow();
      mockReadRepo.findMany.mockResolvedValue({ rows: [row], total: 1 });
      mockReadRepo.batchHydrate.mockResolvedValue([row]);
      const query = { filters: {}, sort: { by: ProductSortField.CreatedAt, order: SortOrder.Desc }, pagination: { page: 1, limit: 20, total: 0 } };
      const result = await service.list(query);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('uses cursor pagination when cursor provided', async () => {
      const row = baseHydratedRow();
      mockReadRepo.findManyCursor.mockResolvedValue({ rows: [row], nextCursor: 'next-cursor', total: 5 });
      mockReadRepo.batchHydrate.mockResolvedValue([row]);
      const query = { filters: {}, sort: { by: ProductSortField.CreatedAt, order: SortOrder.Desc }, pagination: { page: 1, limit: 20, total: 0 }, cursor: 'some-cursor' };
      const result = await service.list(query);
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('next-cursor');
      expect(mockReadRepo.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const validInput = { brandId: B1, name: 'New', slug: 'new', upc: '123456789012' };

    it('creates a product with publish', async () => {
      const brandRow = { id: B1, name: 'Brand', slug: 'brand' };
      const productRow = baseHydratedRow({ upc: '123456789012' });
      mockBrandsRepo.findById.mockResolvedValue(brandRow);
      mockReadRepo.existsByBrandSlug.mockResolvedValue(false);
      mockReadRepo.existsByUpc.mockResolvedValue(false);
      mockWriteRepo.create.mockResolvedValue(productRow);
      mockWriteRepo.publish.mockResolvedValue(undefined);
      mockReadRepo.hydrateSingle.mockResolvedValue(productRow);

      const result = await service.create({ ...validInput, publishImmediately: true });
      expect(result.id).toBe(P1);
      expect(mockWriteRepo.publish).toHaveBeenCalledWith(P1);
    });

    it('throws BrandNotFoundError when brand missing', async () => {
      mockBrandsRepo.findById.mockResolvedValue(null);
      await expect(service.create(validInput)).rejects.toThrow(BrandNotFoundError);
    });

    it('throws ProductSlugCollisionError on slug conflict', async () => {
      mockBrandsRepo.findById.mockResolvedValue({ id: B1 });
      mockReadRepo.existsByBrandSlug.mockResolvedValue(true);
      await expect(service.create(validInput)).rejects.toThrow(ProductSlugCollisionError);
    });
  });

  describe('update', () => {
    it('updates and returns updated product', async () => {
      const existing = baseHydratedRow({ upc: '123456789012' });
      const updated = baseHydratedRow({ upc: '123456789012', name: 'Updated' });
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockWriteRepo.update.mockResolvedValue(undefined);
      mockReadRepo.findById.mockResolvedValueOnce(updated);
      mockReadRepo.hydrateSingle.mockResolvedValue(updated);

      const result = await service.update(P1, { name: 'Updated' });
      expect(result).toBeInstanceOf(ProductEntity);
    });

    it('checks UPC collision on change', async () => {
      const existing = baseHydratedRow({ upc: '123456789012' });
      mockReadRepo.findById.mockResolvedValue(existing);
      mockReadRepo.existsByUpc.mockResolvedValue(true);
      await expect(service.update(P1, { upc: '987654321098' })).rejects.toThrow(ProductUpcCollisionError);
    });

    it('throws ProductNotFoundError when missing', async () => {
      mockReadRepo.findById.mockResolvedValue(null);
      await expect(service.update(u('missing'), {})).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('publish / unpublish', () => {
    it('publishes a product', async () => {
      const existing = baseHydratedRow();
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockWriteRepo.publish.mockResolvedValue(undefined);
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockReadRepo.hydrateSingle.mockResolvedValue(existing);
      const result = await service.publish(P1);
      expect(result).toBeInstanceOf(ProductEntity);
    });

    it('unpublishes a product', async () => {
      const existing = baseHydratedRow();
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockWriteRepo.unpublish.mockResolvedValue(undefined);
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockReadRepo.hydrateSingle.mockResolvedValue(existing);
      const result = await service.unpublish(P1);
      expect(result).toBeInstanceOf(ProductEntity);
    });
  });

  describe('softDelete / restore', () => {
    it('soft deletes a product', async () => {
      mockReadRepo.findById.mockResolvedValue(baseHydratedRow());
      mockWriteRepo.softDelete.mockResolvedValue(undefined);
      await expect(service.softDelete(P1)).resolves.toBeUndefined();
    });

    it('restores a product', async () => {
      const existing = baseHydratedRow();
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockWriteRepo.restore.mockResolvedValue(undefined);
      mockReadRepo.findById.mockResolvedValueOnce(existing);
      mockReadRepo.hydrateSingle.mockResolvedValue(existing);
      const result = await service.restore(P1);
      expect(result).toBeInstanceOf(ProductEntity);
    });
  });

  describe('buildQueryFromDto', () => {
    it('builds a ProductQuery from flat params', () => {
      const query = service.buildQueryFromDto({ page: 2, limit: 10, sortBy: 'name', brandId: 'b1', q: 'test' });
      expect(query.filters.q).toBe('test');
      expect(query.filters.brandId).toBe('b1');
      expect(query.pagination.page).toBe(2);
    });

    it('uses defaults for missing fields', () => {
      const query = service.buildQueryFromDto({});
      expect(query.pagination.page).toBe(1);
      expect(query.pagination.limit).toBe(20);
      expect(query.sort.by).toBe(ProductSortField.PublishedAt);
    });
  });
});
