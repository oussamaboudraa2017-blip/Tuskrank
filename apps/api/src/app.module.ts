import { Module } from '@nestjs/common';
import { AppConfigModule } from '@config';
import { CommonModule } from '@common';
import { DatabaseModule } from '@database';
import { AuthModule } from '@modules/auth';
import { HealthModule } from '@modules/health';
import { ProductsModule } from '@modules/products';
import { SearchModule } from '@modules/search';
import { IngredientsModule } from '@modules/ingredients';
import { BrandsModule } from '@modules/brands';
import { ImportModule } from '@modules/import';
import { ScoringModule } from '@modules/scoring';

/**
 * Top-level feature graph.
 *
 * `CommonModule` provides cross-cutting concerns
 * (logger, throttler, exception filter, interceptors, guards, middleware).
 *
 * Domain modules:
 *   - AuthModule        (Sprint 2A)
 *   - HealthModule      (Sprint 2A)
 *   - ProductsModule    (Sprint 2B)
 *   - SearchModule      (Sprint 3)
 *   - IngredientsModule (Sprint 2C)
 *   - BrandsModule      (Sprint 2D)
 *   - ImportModule      (Sprint 2E)
 *   - ScoringModule     (Sprint 2G)
 */
@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    ProductsModule,
    SearchModule,
    IngredientsModule,
    BrandsModule,
    ImportModule,
    ScoringModule,
  ],
})
export class AppModule {}
