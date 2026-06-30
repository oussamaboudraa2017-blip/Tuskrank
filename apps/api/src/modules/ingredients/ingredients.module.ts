import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { CommonModule } from '@common';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { IngredientsReadRepository, IngredientsWriteRepository } from './ingredients.repository';

/**
 * Ingredients module — CRUD, categories, scores, related products.
 *
 * Endpoints:
 *   GET    /api/v1/ingredients                              (public)
 *   GET    /api/v1/ingredients/search?q=...                 (public)
 *   GET    /api/v1/ingredients/:slug                        (public)
 *   POST   /api/v1/ingredients                              (admin)
 *   PATCH  /api/v1/ingredients/:ingredientId                (admin)
 *   POST   /api/v1/ingredients/:ingredientId/activate       (admin)
 *   POST   /api/v1/ingredients/:ingredientId/deactivate     (admin)
 *   POST   /api/v1/ingredients/:ingredientId/soft-delete    (admin)
 *   POST   /api/v1/ingredients/:ingredientId/restore        (admin)
 *   GET    /api/v1/ingredients/:ingredientId/products       (public)
 *   GET    /api/v1/ingredients/:ingredientId/references     (public)
 *   GET    /api/v1/ingredients/categories                   (public)
 *   POST   /api/v1/ingredients/categories                   (admin)
 *   PATCH  /api/v1/ingredients/categories/:categoryId       (admin)
 *   POST   /api/v1/ingredients/categories/:categoryId/soft-delete (admin)
 *   POST   /api/v1/ingredients/:ingredientId/scores         (admin)
 *   GET    /api/v1/ingredients/:ingredientId/scores/history  (public)
 */
@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [IngredientsController],
  providers: [IngredientsReadRepository, IngredientsWriteRepository, IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
