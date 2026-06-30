import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringRepository } from './repositories/scoring.repository';
import type { ProductScoringInput } from './types';

const mockRepo = {
  getProductScoringInput: jest.fn(),
  getCurrentScore: jest.fn(),
  getProductIdsForBulk: jest.fn(),
  saveProductScore: jest.fn(),
  saveScoreHistory: jest.fn(),
};

const mockInput: ProductScoringInput = {
  productId: 'p1',
  name: 'Test Product',
  isActive: true,
  isPublished: true,
  ingredients: [
    { id: 'i1', name: 'Chicken', isAnimalDerived: true, isControversial: false, isAllergen: false, safetyScore: 80, category: 'Protein' },
  ],
  nutrition: { kcal: 350, proteinPercent: 30, fatPercent: 15, fiberPercent: 5, ashPercent: 6, moisturePercent: 10 },
  brand: { id: 'b1', name: 'Test Brand', countryCode: 'US', certifications: ['USDA Organic'] },
  claims: ['Grain-Free'],
  tags: ['Premium'],
  scientificReferences: [{ id: 'r1', url: 'https://example.com', evidenceType: 'clinical' }],
  hasUpc: true,
  hasSku: false,
  packageSizeGrams: 1500,
  foodForm: 'dry',
};

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        { provide: ScoringRepository, useValue: mockRepo },
      ],
    }).compile();
    service = module.get<ScoringService>(ScoringService);
  });

  describe('scoreProduct', () => {
    it('computes and persists score', async () => {
      mockRepo.getProductScoringInput.mockResolvedValue(mockInput);
      mockRepo.saveProductScore.mockResolvedValue(undefined);
      mockRepo.saveScoreHistory.mockResolvedValue(undefined);

      const result = await service.scoreProduct('p1');
      expect(result.productId).toBe('p1');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(mockRepo.saveProductScore).toHaveBeenCalled();
      expect(mockRepo.saveScoreHistory).toHaveBeenCalled();
    });

    it('throws NotFoundException when product missing', async () => {
      mockRepo.getProductScoringInput.mockResolvedValue(null);
      await expect(service.scoreProduct('missing')).rejects.toThrow(NotFoundException);
    });

    it('persists even with empty ingredients', async () => {
      const emptyInput = { ...mockInput, ingredients: [] };
      mockRepo.getProductScoringInput.mockResolvedValue(emptyInput);
      mockRepo.saveProductScore.mockResolvedValue(undefined);
      mockRepo.saveScoreHistory.mockResolvedValue(undefined);

      const result = await service.scoreProduct('p1', undefined, 'scheduled');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(mockRepo.saveProductScore).toHaveBeenCalled();
    });

    it('handles persistence failure gracefully', async () => {
      mockRepo.getProductScoringInput.mockResolvedValue(mockInput);
      mockRepo.saveProductScore.mockRejectedValue(new Error('DB down'));

      const result = await service.scoreProduct('p1');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.warnings.some((w: any) => w.code === 'PERSISTENCE_FAILED')).toBe(true);
    });
  });

  describe('getCurrentScore', () => {
    it('returns current score from repo', async () => {
      const score = { id: 's1', overallScore: 85, qualityScore: 80, safetyScore: 90, nutritionScore: 75, transparencyScore: 85, scoringVersion: '1.0', createdAt: new Date().toISOString() };
      mockRepo.getCurrentScore.mockResolvedValue(score);
      const result = await service.getCurrentScore('p1');
      expect(result?.overallScore).toBe(85);
    });

    it('returns null when no score exists', async () => {
      mockRepo.getCurrentScore.mockResolvedValue(null);
      const result = await service.getCurrentScore('p1');
      expect(result).toBeNull();
    });
  });

  describe('bulkScore', () => {
    it('scores multiple products', async () => {
      mockRepo.getProductScoringInput
        .mockResolvedValueOnce(mockInput)
        .mockResolvedValueOnce(mockInput);
      mockRepo.saveProductScore.mockResolvedValue(undefined);
      mockRepo.saveScoreHistory.mockResolvedValue(undefined);

      const result = await service.bulkScore(['p1', 'p2']);
      expect(result.scored).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('handles individual failures', async () => {
      mockRepo.getProductScoringInput
        .mockResolvedValueOnce(mockInput)
        .mockResolvedValueOnce(null);
      mockRepo.saveProductScore.mockResolvedValue(undefined);
      mockRepo.saveScoreHistory.mockResolvedValue(undefined);

      const result = await service.bulkScore(['p1', 'missing']);
      expect(result.scored).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('previewScore', () => {
    it('computes score without persisting', async () => {
      mockRepo.getProductScoringInput.mockResolvedValue(mockInput);
      const result = await service.previewScore('p1');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(mockRepo.saveProductScore).not.toHaveBeenCalled();
    });

    it('throws on missing product', async () => {
      mockRepo.getProductScoringInput.mockResolvedValue(null);
      await expect(service.previewScore('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
