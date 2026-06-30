import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { BrandsReadRepository, BrandsWriteRepository } from './brands.repository';
import { BrandNotFoundError, BrandSlugCollisionError, BrandHasProductsError, BrandInvalidLifecycleTransitionError } from './domain/errors';
import type { Uuid } from '@types';

const u = (id: string) => id as unknown as Uuid;
const B1 = u('b1');

const brandRow = (overrides = {}) => ({
  id: B1, name: 'Brand', slug: 'brand', is_active: true,
  created_at: new Date(), updated_at: new Date(), deleted_at: null,
  manufacturer: null, country_code: null, website_url: null,
  description: null, logo_image_url: null,
  product_count: null, avg_overall_score: null,
  avg_quality_score: null, avg_safety_score: null,
  avg_nutrition_score: null, avg_transparency_score: null,
  open_recall_count: null,
  ...overrides,
});

const mockReadRepo = {
  findBySlug: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  search: jest.fn(),
  findFeatured: jest.fn(),
  count: jest.fn(),
  existsBySlug: jest.fn(),
  countProducts: jest.fn(),
};

const mockWriteRepo = {
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
};

describe('BrandsService', () => {
  let service: BrandsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: BrandsReadRepository, useValue: mockReadRepo },
        { provide: BrandsWriteRepository, useValue: mockWriteRepo },
      ],
    }).compile();
    service = module.get<BrandsService>(BrandsService);
  });

  describe('findBySlug', () => {
    it('returns brand when found', async () => {
      mockReadRepo.findBySlug.mockResolvedValue(brandRow());
      const result = await service.findBySlug('brand');
      expect(result.id).toBe(B1);
    });

    it('throws BrandNotFoundError when not found', async () => {
      mockReadRepo.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(BrandNotFoundError);
    });
  });

  describe('findById', () => {
    it('returns brand when found', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow());
      const result = await service.findById(B1);
      expect(result.id).toBe(B1);
    });

    it('throws BrandNotFoundError when not found', async () => {
      mockReadRepo.findById.mockResolvedValue(null);
      await expect(service.findById(u('missing'))).rejects.toThrow(BrandNotFoundError);
    });
  });

  describe('list', () => {
    it('returns paginated brands with total', async () => {
      const rows = [brandRow({ product_count: 5, avg_overall_score: 80 })];
      mockReadRepo.findMany.mockResolvedValue(rows);
      mockReadRepo.count.mockResolvedValue(1);
      const query = { filters: {}, sort: { by: 'created_at' as any, order: 'desc' as any }, pagination: { page: 1, limit: 20, total: 0 } };
      const result = await service.list(query);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('search', () => {
    it('returns search results', async () => {
      mockReadRepo.search.mockResolvedValue({ items: [brandRow()], total: 1 });
      const result = await service.search({ q: 'test' });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('creates a brand with auto-slug', async () => {
      mockReadRepo.existsBySlug.mockResolvedValue(false);
      mockWriteRepo.create.mockImplementation(async (data: any) => brandRow({ slug: data.slug, name: data.name }));
      const result = await service.create({ name: 'My Brand' });
      expect(result.id).toBe(B1);
      expect(result.slug).toBe('my-brand');
    });

    it('throws BrandSlugCollisionError on conflict', async () => {
      mockReadRepo.existsBySlug.mockResolvedValue(true);
      await expect(service.create({ name: 'Brand', slug: 'taken' })).rejects.toThrow(BrandSlugCollisionError);
    });
  });

  describe('update', () => {
    it('updates and returns brand', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow());
      mockWriteRepo.update.mockResolvedValue(brandRow({ name: 'Updated' }));
      const result = await service.update(B1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('checks slug collision on rename', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow());
      mockReadRepo.existsBySlug.mockResolvedValue(true);
      await expect(service.update(B1, { slug: 'taken' })).rejects.toThrow(BrandSlugCollisionError);
    });

    it('throws BrandNotFoundError when missing', async () => {
      mockReadRepo.findById.mockResolvedValue(null);
      await expect(service.update(u('missing'), {})).rejects.toThrow(BrandNotFoundError);
    });
  });

  describe('activation / deactivation', () => {
    it('activates an inactive brand', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow({ is_active: false }));
      mockWriteRepo.update.mockResolvedValue(brandRow({ is_active: true }));
      const result = await service.activate(B1);
      expect(result.isActive).toBe(true);
    });

    it('returns early if already active', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow({ is_active: true }));
      const result = await service.activate(B1);
      expect(result.isActive).toBe(true);
      expect(mockWriteRepo.update).not.toHaveBeenCalled();
    });

    it('deactivates an active brand', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow({ is_active: true }));
      mockWriteRepo.update.mockResolvedValue(brandRow({ is_active: false }));
      const result = await service.deactivate(B1);
      expect(result.isActive).toBe(false);
    });
  });

  describe('softDelete / restore', () => {
    it('soft deletes a brand with no products', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow());
      mockReadRepo.countProducts.mockResolvedValue(0);
      mockWriteRepo.softDelete.mockResolvedValue(undefined);
      await expect(service.softDelete(B1)).resolves.toBeUndefined();
    });

    it('throws BrandHasProductsError when brand has products', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow());
      mockReadRepo.countProducts.mockResolvedValue(5);
      await expect(service.softDelete(B1)).rejects.toThrow(BrandHasProductsError);
    });

    it('restores a deleted brand', async () => {
      mockReadRepo.findById
        .mockResolvedValueOnce(brandRow({ deleted_at: new Date() }))
        .mockResolvedValueOnce(brandRow({ deleted_at: null }));
      mockWriteRepo.restore.mockResolvedValue(undefined);
      const result = await service.restore(B1);
      expect(result.deletedAt).toBeNull();
    });

    it('throws on double restore', async () => {
      mockReadRepo.findById.mockResolvedValue(brandRow({ deleted_at: null }));
      await expect(service.restore(B1)).rejects.toThrow(BrandInvalidLifecycleTransitionError);
    });
  });
});
