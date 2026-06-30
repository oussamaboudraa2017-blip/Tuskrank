import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsReadRepository, BrandsWriteRepository } from './brands.repository';

/**
 * Brands module — CRUD, search, featured, lifecycle transitions.
 *
 * Endpoints:
 *   GET    /api/v1/brands                              (public)
 *   GET    /api/v1/brands/featured                     (public)
 *   GET    /api/v1/brands/search?q=...                 (public)
 *   GET    /api/v1/brands/:slug                        (public)
 *   POST   /api/v1/brands                              (admin)
 *   PUT    /api/v1/brands/:brandId                     (admin)
 *   PATCH  /api/v1/brands/:brandId                     (admin)
 *   POST   /api/v1/brands/:brandId/activate            (admin)
 *   POST   /api/v1/brands/:brandId/deactivate          (admin)
 *   POST   /api/v1/brands/:brandId/soft-delete         (admin)
 *   POST   /api/v1/brands/:brandId/restore             (admin)
 */
@Module({
  imports: [DatabaseModule],
  controllers: [BrandsController],
  providers: [BrandsReadRepository, BrandsWriteRepository, BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
