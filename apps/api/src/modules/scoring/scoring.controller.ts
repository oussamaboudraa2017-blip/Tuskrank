import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ScoringService } from './scoring.service';
import { ScoreProductDto, BulkScoreDto } from './dto';
import { Public } from '@common/decorators';
import { okResponse } from '@common/dto';
import { ScoringConfig } from './types';

/**
 * Scoring controller — product scoring endpoints.
 *
 * Endpoints:
 *   POST /api/v1/scoring/score        — score a single product
 *   POST /api/v1/scoring/bulk         — score multiple products
 *   POST /api/v1/scoring/preview      — preview score (no persistence)
 *   GET  /api/v1/scoring/current      — get current score from DB
 *   GET  /api/v1/scoring/score-all    — trigger scoring for all products (admin)
 */
@ApiTags('scoring')
@Controller({ path: 'scoring', version: '1' })
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  /* ================================================================
   * Score a single product
   * ================================================================ */

  @Post('score')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compute and persist a score for a single product.' })
  async scoreProduct(@Body() dto: ScoreProductDto) {
    const config = this.buildConfig(dto);
    const result = await this.scoringService.scoreProduct(
      dto.productId,
      config,
      'manual',
    );
    return okResponse(result);
  }

  /* ================================================================
   * Bulk scoring
   * ================================================================ */

  @Post('bulk')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Score multiple products in a batch.' })
  async bulkScore(@Body() dto: BulkScoreDto) {
    const config: ScoringConfig = {
      weights: dto.weights as ScoringConfig['weights'],
      includeReasoning: dto.includeReasoning,
    };
    const result = await this.scoringService.bulkScore(
      dto.productIds,
      config,
      'manual',
    );
    return okResponse(result);
  }

  /* ================================================================
   * Preview (no persistence)
   * ================================================================ */

  @Post('preview')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Preview a score without persisting it.' })
  async previewScore(@Body() dto: ScoreProductDto) {
    const config = this.buildConfig(dto);
    const result = await this.scoringService.previewScore(
      dto.productId,
      config,
    );
    return okResponse(result);
  }

  /* ================================================================
   * Get current score
   * ================================================================ */

  @Get('current')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the current score for a product from the database.' })
  async getCurrentScore(@Query('productId') productId: string) {
    const score = await this.scoringService.getCurrentScore(productId);
    return okResponse(score);
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  private buildConfig(dto: ScoreProductDto): ScoringConfig {
    const weights: Record<string, number> = {};

    if (dto.ingredientQualityWeight !== undefined) {
      weights['ingredient_quality'] = dto.ingredientQualityWeight;
    }
    if (dto.transparencyWeight !== undefined) {
      weights['transparency'] = dto.transparencyWeight;
    }
    if (dto.nutritionalBalanceWeight !== undefined) {
      weights['nutritional_balance'] = dto.nutritionalBalanceWeight;
    }
    if (dto.processingLevelWeight !== undefined) {
      weights['processing_level'] = dto.processingLevelWeight;
    }
    if (dto.scientificEvidenceWeight !== undefined) {
      weights['scientific_evidence'] = dto.scientificEvidenceWeight;
    }
    if (dto.controversialIngredientsWeight !== undefined) {
      weights['controversial_ingredients'] = dto.controversialIngredientsWeight;
    }
    if (dto.labelTransparencyWeight !== undefined) {
      weights['label_transparency'] = dto.labelTransparencyWeight;
    }

    return {
      weights: Object.keys(weights).length > 0 ? weights as ScoringConfig['weights'] : undefined,
      includeReasoning: dto.includeReasoning,
    };
  }
}
