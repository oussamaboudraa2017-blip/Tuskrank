import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { CommonModule } from '@common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import {
  ProductsRepository,
  ProductImagesRepository,
  NutritionProfilesRepository,
  ProductIngredientsRepository,
} from './repositories/products.repository';
import { BrandsRepository } from './repositories/brands.repository';

/**
 * Products module — Sprint 2B Task 3 (CRUD + queries).
 *
 * Composes:
 *   - `DatabaseModule`  — owns the pg.Pool, BaseRepository, TransactionHelper.
 *   - `CommonModule`    — global exception filter, request-id middleware,
 *                          interceptors, `SupabaseAuthGuard`, throttler,
 *                          error envelope helpers.
 *   - `ProductsService`  — business orchestration (CRUD, lifecycle).
 *   - 5 repositories    — extending `BaseRepository<T>` from `@database`.
 *   - `ProductsController` — Swagger-tagged, version `1`. Full REST surface.
 */
@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsRepository,
    ProductImagesRepository,
    NutritionProfilesRepository,
    ProductIngredientsRepository,
    BrandsRepository,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
