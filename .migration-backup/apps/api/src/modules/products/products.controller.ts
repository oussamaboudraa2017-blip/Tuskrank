import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductResponseDto, ProductListQueryDto } from './dto';
import { AdminGuard } from '@common/guards';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/decorators';
import { okResponse, paginatedResponse, buildPaginationMeta } from '@common/dto';
import { parseUuid } from '@common/utils/parse-uuid';

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List products (paginated, filterable, cursor-based).' })
  async list(@Query() query: ProductListQueryDto) {
    const productQuery = this.service.buildQueryFromDto({
      page: query.page,
      limit: query.limit,
      cursor: query.cursor,
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
      sortOrder: query.sortOrder as 'asc' | 'desc' | undefined,
      isPublished: query.isPublished,
      isActive: query.isActive,
    });
    const { items, total, nextCursor } = await this.service.list(productQuery);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const meta = buildPaginationMeta(page, limit, total, productQuery.sort?.by, productQuery.sort?.order);
    return paginatedResponse({
      data: items.map((p) => ProductResponseDto.fromDomain(p)),
      meta: { ...meta, ...(nextCursor ? { nextCursor } : {}) },
    });
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured products.' })
  async featured(@Query('limit') limit?: number, @Query('petType') petType?: string) {
    const items = await this.service.findFeatured({ page: 1, limit: limit ?? 10 }, { petType });
    return okResponse(items.map((p) => ProductResponseDto.fromDomain(p)));
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search products.' })
  async search(@Query('q') q: string) {
    const items = await this.service.search({ q });
    return okResponse(items.map((p) => ProductResponseDto.fromDomain(p)));
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get product detail by slug.' })
  async findBySlug(@Param('slug') slug: string) {
    const product = await this.service.findBySlug(slug);
    return okResponse(ProductResponseDto.fromDomain(product));
  }

  @Post()
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (admin only).' })
  async create(@Body() dto: CreateProductDto) {
    const product = await this.service.create({
      brandId: parseUuid(dto.brandId, 'brandId'),
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      upc: dto.upc,
      sku: dto.sku,
      packageSizeGrams: dto.packageSizeGrams,
      packageSizeLabel: dto.packageSizeLabel,
      foodFormId: dto.foodFormId ? parseUuid(dto.foodFormId, 'foodFormId') : null,
      primaryProteinSourceId: dto.primaryProteinSourceId ? parseUuid(dto.primaryProteinSourceId, 'primaryProteinSourceId') : null,
      isActive: dto.isActive,
      publishImmediately: dto.publishImmediately,
    });
    return okResponse(ProductResponseDto.fromDomain(product));
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (admin only).' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.service.update(parseUuid(id, 'id'), {
      name: dto.name,
      description: dto.description,
      upc: dto.upc,
      sku: dto.sku,
      packageSizeGrams: dto.packageSizeGrams,
      packageSizeLabel: dto.packageSizeLabel,
      foodFormId: dto.foodFormId ? parseUuid(dto.foodFormId, 'foodFormId') : null,
      primaryProteinSourceId: dto.primaryProteinSourceId ? parseUuid(dto.primaryProteinSourceId, 'primaryProteinSourceId') : null,
      isActive: dto.isActive,
    });
    return okResponse(ProductResponseDto.fromDomain(product));
  }

  @Post(':id/publish')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a product (admin only).' })
  async publish(@Param('id') id: string) {
    const product = await this.service.publish(parseUuid(id, 'id'));
    return okResponse(ProductResponseDto.fromDomain(product));
  }

  @Post(':id/unpublish')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unpublish a product (admin only).' })
  async unpublish(@Param('id') id: string) {
    const product = await this.service.unpublish(parseUuid(id, 'id'));
    return okResponse(ProductResponseDto.fromDomain(product));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a product (admin only).' })
  async softDelete(@Param('id') id: string) {
    await this.service.softDelete(parseUuid(id, 'id'));
    return okResponse({ deleted: true });
  }

  @Post(':id/restore')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a product (admin only).' })
  async restore(@Param('id') id: string) {
    const product = await this.service.restore(parseUuid(id, 'id'));
    return okResponse(ProductResponseDto.fromDomain(product));
  }
}