import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { CommonModule } from '@common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import {
  ProductsReadRepository,
  ProductsWriteRepository,
  ProductsSearchRepository,
  ProductLookupRepository,
} from './repositories/products.repository';
import { BrandsRepository } from './repositories/brands.repository';

@Module({
  imports: [CommonModule, DatabaseModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsReadRepository,
    ProductsWriteRepository,
    ProductsSearchRepository,
    ProductLookupRepository,
    BrandsRepository,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
