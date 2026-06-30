import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Uuid } from '@types';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductListItemDto } from './dto/product-list-item.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { ProductMapper } from './domain/mapping/product.mapper';
import { Public, Roles } from '@common/decorators';
import { okResponse, paginatedResponse, buildPaginationMeta } from '@common/dto';

/**
 * Products controller — full REST surface for Sprint 2B Task 3.
 *
 * Endpoints:
 *   GET    /api/v1/products                              (public — paginated list)
 *   GET    /api/v1/products/:slug                        (public — detail)
 *   POST   /api/v1/products                              (admin — create)
 *   PATCH  /api/v1/products/:productId                   (admin — update)
 *   POST   /api/v1/products/:productId/publish           (admin)
 *   POST   /api/v1/products/:productId/unpublish         (admin)
 *   POST   /api/v1/products/:productId/soft-delete       (admin)
 *   POST   /api/v1/products/:productId/restore           (admin)
 */
@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  /* ================================================================
   * Public — List
   * ================================================================ */

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products (paginated, filterable, sortable).' })
  async list(@Query() query: ListProductsQueryDto) {
    const productQuery = this.service.buildQueryFromDto({
      page: query.page,
      limit: query.limit,
      q: query.q,
      brandId: query.brandId,
      petType: query.petType,
      lifeStage: query.lifeStage,
      breedSize: query.breedSize,
      foodForm: query.foodForm,
      proteinOrigin: query.proteinOrigin,
      minScore: query.minScore,
      maxScore: query.maxScore,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      isPublished: true,
      isActive: true,
    });

    const { items, total } = await this.service.list(productQuery);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const listItems = items.map((p) => ProductMapper.domainToListItem(p));
    const meta = buildPaginationMeta(page, limit, total, productQuery.sort.by, productQuery.sort.order);

    return paginatedResponse({ data: listItems, meta });
  }

  /* ================================================================
   * Public — Detail by slug
   * ================================================================ */

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get product detail by slug.' })
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.service.findBySlug(slug);
    const detail = ProductMapper.domainToDetail(product);
    return okResponse(detail);
  }

  /* ================================================================
   * Admin — Create
   * ================================================================ */

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (admin).' })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.service.create({
      brandId: dto.brandId as Uuid,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      upc: dto.upc,
      sku: dto.sku,
      packageSizeGrams: dto.packageSizeGrams,
      packageSizeLabel: dto.packageSizeLabel,
      foodFormId: dto.foodFormId as Uuid | null,
      primaryProteinSourceId: dto.primaryProteinSourceId as Uuid | null,
      isActive: dto.isActive,
      publishImmediately: dto.publishImmediately,
    });
    const detail = ProductMapper.domainToDetail(product);
    return okResponse(detail);
  }

  /* ================================================================
   * Admin — Update
   * ================================================================ */

  @Patch(':productId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a product (admin).' })
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    const product = await this.service.update(productId as Uuid, {
      name: dto.name,
      description: dto.description,
      upc: dto.upc,
      sku: dto.sku,
      packageSizeGrams: dto.packageSizeGrams,
      packageSizeLabel: dto.packageSizeLabel,
      foodFormId: dto.foodFormId as Uuid | null,
      primaryProteinSourceId: dto.primaryProteinSourceId as Uuid | null,
      isActive: dto.isActive,
    });
    const detail = ProductMapper.domainToDetail(product);
    return okResponse(detail);
  }

  /* ================================================================
   * Admin — Lifecycle transitions
   * ================================================================ */

  @Post(':productId/publish')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a product (admin).' })
  async publish(@Param('productId') productId: string) {
    const product = await this.service.publish(productId as Uuid);
    const detail = ProductMapper.domainToDetail(product);
    return okResponse(detail);
  }

  @Post(':productId/unpublish')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish a product (admin).' })
  async unpublish(@Param('productId') productId: string) {
    const product = await this.service.unpublish(productId as Uuid);
    const detail = ProductMapper.domainToDetail(product);
    return okResponse(detail);
  }

  @Post(':productId/soft-delete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a product (admin).' })
  async softDelete(@Param('productId') productId: string) {
    await this.service.softDelete(productId as Uuid);
    return okResponse({ deleted: true });
  }

  @Post(':productId/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted product (admin).' })
  async restore(@Param('productId') productId: string) {
    const product = await this.service.restore(productId as Uuid);
    const detail = ProductMapper.domainToDetail(product);
    return okResponse(detail);
  }
}
