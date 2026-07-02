import { Test, TestingModule } from '@nestjs/testing';
import { IngredientsService } from './ingredients.service';
import { IngredientsReadRepository, IngredientsWriteRepository } from './ingredients.repository';
import { IngredientNotFoundError, IngredientSlugCollisionError, IngredientCanonicalNameCollisionError, IngredientCategorySlugCollisionError, IngredientCategoryMaxDepthError, IngredientCategoryHasChildrenError, IngredientInvalidLifecycleTransitionError } from './domain/errors';
import type { Uuid } from '@types';
import { CacheService } from '@shared';

const u = (id: string) => id as unknown as Uuid;
const I1 = u('i1');
const C1 = u('c1');
const P1 = u('p1');

const makeRow = (overrides = {}) => ({
  id: I1, name: 'Ingredient', slug: 'ingredient', inci_name: null,
  category_id: null, canonical_name: 'Ingredient', description: null,
  is_animal_derived: false, is_common_allergen: false, is_controversial: false,
  is_active: true, created_at: new Date(), updated_at: new Date(),
  deleted_at: null, overall_score: null, score_grade: null,
  food_form_slug: null, food_form_name: null,
  ...overrides,
});

const makeCategoryRow = (overrides = {}) => ({
  id: C1, name: 'Cat', slug: 'cat', description: null, parent_id: null,
  sort_order: 0, is_active: true, created_at: new Date(),
  updated_at: new Date(), deleted_at: null,
  ...overrides,
});

const mockReadRepo = {
  findBySlug: jest.fn(),
  findById: jest.fn(),
  findMany: jest.fn(),
  search: jest.fn(),
  count: jest.fn(),
  findCategoryById: jest.fn(),
  findCategoryBySlug: jest.fn(),
  findCategories: jest.fn(),
  findRelatedProducts: jest.fn(),
  findReferences: jest.fn(),
  findScoreHistory: jest.fn(),
  existsBySlug: jest.fn(),
  existsByCanonicalName: jest.fn(),
  existsByCategorySlug: jest.fn(),
  getCategoryDepth: jest.fn(),
  countCategoryChildren: jest.fn(),
  countCategoryIngredients: jest.fn(),
};

const mockWriteRepo = {
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  softDeleteCategory: jest.fn(),
  createScore: jest.fn(),
};

describe('IngredientsService', () => {
  let service: IngredientsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngredientsService,
        { provide: IngredientsReadRepository, useValue: mockReadRepo },
        { provide: IngredientsWriteRepository, useValue: mockWriteRepo },
        { provide: CacheService, useValue: { get: jest.fn(), set: jest.fn(), delete: jest.fn(), deleteByPattern: jest.fn(), clear: jest.fn(), stats: jest.fn() } },
      ],
    }).compile();
    service = module.get<IngredientsService>(IngredientsService);
  });

  describe('read methods', () => {
    it('findBySlug returns ingredient', async () => {
      mockReadRepo.findBySlug.mockResolvedValue(makeRow());
      const result = await service.findBySlug('ingredient');
      expect(result.id).toBe(I1);
    });

    it('findBySlug throws on missing', async () => {
      mockReadRepo.findBySlug.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toThrow(IngredientNotFoundError);
    });

    it('findById returns ingredient', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow());
      const result = await service.findById(I1);
      expect(result.id).toBe(I1);
    });

    it('findById throws on missing', async () => {
      mockReadRepo.findById.mockResolvedValue(null);
      await expect(service.findById(u('missing'))).rejects.toThrow(IngredientNotFoundError);
    });

    it('list returns paginated results', async () => {
      mockReadRepo.findMany.mockResolvedValue([makeRow()]);
      mockReadRepo.count.mockResolvedValue(1);
      const result = await service.list({ filters: {}, sort: { by: 'name' as any, order: 'asc' as any }, pagination: { page: 1, limit: 20, total: 0 } });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('create', () => {
    it('creates ingredient with auto-slug', async () => {
      mockReadRepo.existsBySlug.mockResolvedValue(false);
      mockReadRepo.existsByCanonicalName.mockResolvedValue(false);
      mockWriteRepo.create.mockImplementation(async (data: any) => makeRow({ slug: data.slug, name: data.name }));
      const result = await service.create({ name: 'Ingredient', canonicalName: 'Ingredient' });
      expect(result.id).toBe(I1);
      expect(result.slug).toBe('ingredient');
    });

    it('throws on slug conflict', async () => {
      mockReadRepo.existsBySlug.mockResolvedValue(true);
      await expect(service.create({ name: 'Test', canonicalName: 'Test' })).rejects.toThrow(IngredientSlugCollisionError);
    });

    it('throws on name conflict', async () => {
      mockReadRepo.existsBySlug.mockResolvedValue(false);
      mockReadRepo.existsByCanonicalName.mockResolvedValue(true);
      await expect(service.create({ name: 'Test', canonicalName: 'Test' })).rejects.toThrow(IngredientCanonicalNameCollisionError);
    });
  });

  describe('update', () => {
    it('updates and returns ingredient', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow());
      mockWriteRepo.update.mockResolvedValue(makeRow({ name: 'Updated' }));
      const result = await service.update(I1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('checks slug collision on change', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow({ slug: 'original' }));
      mockReadRepo.existsBySlug.mockResolvedValue(true);
      await expect(service.update(I1, { slug: 'taken' })).rejects.toThrow(IngredientSlugCollisionError);
    });

    it('throws when missing', async () => {
      mockReadRepo.findById.mockResolvedValue(null);
      await expect(service.update(u('missing'), {})).rejects.toThrow(IngredientNotFoundError);
    });
  });

  describe('lifecycle', () => {
    it('soft deletes ingredient', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow());
      mockWriteRepo.softDelete.mockResolvedValue(undefined);
      await expect(service.softDelete(I1)).resolves.toBeUndefined();
    });

    it('restores deleted ingredient', async () => {
      mockReadRepo.findById
        .mockResolvedValueOnce(makeRow({ deleted_at: new Date() }))
        .mockResolvedValueOnce(makeRow({ deleted_at: null }));
      mockWriteRepo.restore.mockResolvedValue(undefined);
      const result = await service.restore(I1);
      expect(result.deletedAt).toBeNull();
    });

    it('throws on double restore', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow({ deleted_at: null }));
      await expect(service.restore(I1)).rejects.toThrow(IngredientInvalidLifecycleTransitionError);
    });

    it('activates an inactive ingredient', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow({ is_active: false }));
      mockWriteRepo.update.mockResolvedValue(makeRow({ is_active: true }));
      const result = await service.activate(I1);
      expect(result.isActive).toBe(true);
    });

    it('returns early if already active', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow({ is_active: true }));
      const result = await service.activate(I1);
      expect(mockWriteRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('categories', () => {
    it('creates a category with depth check', async () => {
      mockReadRepo.existsByCategorySlug.mockResolvedValue(false);
      mockReadRepo.getCategoryDepth.mockResolvedValue(1);
      mockWriteRepo.createCategory.mockResolvedValue(makeCategoryRow({ parent_id: P1 }));
      const result = await service.createCategory({ name: 'Cat', parentId: P1 });
      expect(result.id).toBe(C1);
    });

    it('throws max depth error', async () => {
      mockReadRepo.existsByCategorySlug.mockResolvedValue(false);
      mockReadRepo.getCategoryDepth.mockResolvedValue(10);
      await expect(service.createCategory({ name: 'Cat', parentId: P1 })).rejects.toThrow(IngredientCategoryMaxDepthError);
    });

    it('throws slug collision on category create', async () => {
      mockReadRepo.existsByCategorySlug.mockResolvedValue(true);
      await expect(service.createCategory({ name: 'Cat' })).rejects.toThrow(IngredientCategorySlugCollisionError);
    });

    it('soft deletes category with checks', async () => {
      mockReadRepo.findCategoryById.mockResolvedValue(makeCategoryRow());
      mockReadRepo.countCategoryChildren.mockResolvedValue(0);
      mockReadRepo.countCategoryIngredients.mockResolvedValue(0);
      mockWriteRepo.softDeleteCategory.mockResolvedValue(undefined);
      await expect(service.softDeleteCategory(C1)).resolves.toBeUndefined();
    });

    it('throws on category with children', async () => {
      mockReadRepo.findCategoryById.mockResolvedValue(makeCategoryRow());
      mockReadRepo.countCategoryChildren.mockResolvedValue(2);
      await expect(service.softDeleteCategory(C1)).rejects.toThrow(IngredientCategoryHasChildrenError);
    });

    it('lists categories as tree', async () => {
      mockReadRepo.findCategories.mockResolvedValue([
        makeCategoryRow({ parent_id: null }),
        makeCategoryRow({ id: u('c2'), name: 'Child', slug: 'child', parent_id: C1, sort_order: 1 }),
      ]);
      const result = await service.listCategories();
      expect(result).toHaveLength(1);
      expect(result[0].children).toHaveLength(1);
    });
  });

  describe('related data', () => {
    it('finds related products', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow());
      mockReadRepo.findRelatedProducts.mockResolvedValue([{ product_id: P1, product_name: 'Product', ingredient_name: 'Ing', weight_grams: 10 }]);
      const result = await service.findRelatedProducts(I1);
      expect(result).toHaveLength(1);
    });

    it('finds references', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow());
      mockReadRepo.findReferences.mockResolvedValue([{ id: u('r1'), title: 'Ref', source_url: 'https://example.com', source_type: 'study' }]);
      const result = await service.findReferences(I1);
      expect(result).toHaveLength(1);
    });
  });

  describe('createScore', () => {
    it('creates a score for existing ingredient', async () => {
      mockReadRepo.findById.mockResolvedValue(makeRow());
      mockWriteRepo.createScore.mockResolvedValue({ id: u('s1'), ingredient_id: I1, score: 85, grade: 'B', reasoning: null, scoring_version: '1.0', is_current: true, created_at: new Date() });
      const result = await service.createScore(I1, { score: 85, grade: 'B', scoringVersion: '1.0' });
      expect(result.id).toBe(u('s1'));
    });
  });
});
