import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';

const makeItem = (overrides = {}) => ({
  id: 'p1', entityType: 'product' as const, name: 'Premium Dog Food', slug: 'premium-dog-food',
  score: 0.85, matchedBy: 'full_text', snippet: null,
  brandName: 'Brand', brandSlug: 'brand',
  overallScore: 80, grade: 'B', imageUrl: null,
  ...overrides,
});

const mockRepo = {
  searchProducts: jest.fn(),
  searchBrands: jest.fn(),
  searchIngredients: jest.fn(),
  searchGlobal: jest.fn(),
  getTrending: jest.fn(),
  logSearch: jest.fn(),
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: SearchRepository, useValue: mockRepo },
      ],
    }).compile();
    service = module.get<SearchService>(SearchService);
  });

  describe('searchProducts', () => {
    it('returns ranked search results', async () => {
      const items = [makeItem()];
      mockRepo.searchProducts.mockResolvedValue({ items, total: 1 });

      const result = await service.searchProducts({ q: 'dog food', limit: 20, offset: 0 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('throws for empty query', async () => {
      await expect(service.searchProducts({ q: '' })).rejects.toThrow('Query is too short');
    });
  });

  describe('searchBrands', () => {
    it('returns brand results', async () => {
      const items = [makeItem({ id: 'b1', entityType: 'brand', name: 'Acme Pets', slug: 'acme-pets' })];
      mockRepo.searchBrands.mockResolvedValue({ items, total: 1 });

      const result = await service.searchBrands({ q: 'acme', limit: 10, offset: 0 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('searchIngredients', () => {
    it('returns ingredient results', async () => {
      const items = [makeItem({ id: 'i1', entityType: 'ingredient', name: 'Chicken Meal', slug: 'chicken-meal' })];
      mockRepo.searchIngredients.mockResolvedValue({ items, total: 1 });

      const result = await service.searchIngredients({ q: 'chicken', limit: 10, offset: 0 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('searchGlobal', () => {
    it('returns aggregated results across entity types', async () => {
      const results = {
        query: 'test', total: 3,
        products: [makeItem()],
        brands: [makeItem({ id: 'b1', entityType: 'brand' })],
        ingredients: [makeItem({ id: 'i1', entityType: 'ingredient' })],
        strategies: ['full_text'], latencyMs: 5,
      };
      mockRepo.searchGlobal.mockResolvedValue(results);

      const result = await service.searchGlobal({ q: 'test', limit: 5 });
      expect(result.products).toHaveLength(1);
      expect(result.brands).toHaveLength(1);
      expect(result.ingredients).toHaveLength(1);
    });

    it('throws for empty query', async () => {
      await expect(service.searchGlobal({ q: '' })).rejects.toThrow('Query is too short');
    });
  });

  describe('getTrending', () => {
    it('returns trending searches', async () => {
      const trending = [
        { normalized: 'dog food', totalCount: 100, latestWindowEnd: new Date() },
      ];
      mockRepo.getTrending.mockResolvedValue(trending);
      const result = await service.getTrending();
      expect(result).toHaveLength(1);
    });
  });
});
