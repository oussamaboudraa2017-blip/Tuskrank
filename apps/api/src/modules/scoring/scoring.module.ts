import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { ScoringRepository } from './repositories/scoring.repository';

/**
 * Scoring module — product scoring engine.
 *
 * Uses Strategy Pattern with 7 independent scoring categories:
 *   1. Ingredient Quality (35%)
 *   2. Transparency (20%)
 *   3. Nutritional Balance (15%)
 *   4. Processing Level (10%)
 *   5. Scientific Evidence (10%)
 *   6. Controversial Ingredients (5%)
 *   7. Label Transparency (5%)
 *
 * Endpoints:
 *   POST /api/v1/scoring/score        — score a single product
 *   POST /api/v1/scoring/bulk         — score multiple products
 *   POST /api/v1/scoring/preview      — preview score (no persistence)
 *   GET  /api/v1/scoring/current      — get current score from DB
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ScoringController],
  providers: [ScoringRepository, ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
