import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto, BrandListQueryDto } from './dto';
import { AdminGuard } from '@common/guards';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/decorators';
import { okResponse, paginatedResponse, buildPaginationMeta } from '@common/dto';
import type { Uuid } from '@types';

@ApiTags('brands')
@Controller({ path: 'brands', version: '1' })
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List brands with pagination and filters.' })
  @ApiResponse({ status: 200, description: 'Paginated list of brands.' })
  async list(@Query() query: BrandListQueryDto) {
    const brandQuery = this.service.buildQueryFromDto({
      page: query.page,
      limit: query.limit,
      q: query.q,
      countryCode: query.countryCode,
      isActive: query.isActive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    const { items, total } = await this.service.list(brandQuery);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const meta = buildPaginationMeta(page, limit, total, brandQuery.sort.by, brandQuery.sort.order);
    return paginatedResponse({ data: items.map((i) => BrandResponseDto.fromDomain(i as any)), meta });
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured brands.' })
  async featured(@Query('limit') limit?: number) {
    const items = await this.service.findFeatured(limit ?? 10);
    return okResponse(items.map((i) => BrandResponseDto.fromDomain(i as any)));
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search brands by name or manufacturer.' })
  async search(@Query('q') q: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const { items, total } = await this.service.search({ q, page, limit });
    const meta = buildPaginationMeta(page ?? 1, limit ?? 20, total);
    return paginatedResponse({ data: items.map((i) => BrandResponseDto.fromDomain(i as any)), meta });
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get brand by slug.' })
  async findBySlug(@Param('slug') slug: string) {
    const brand = await this.service.findBySlug(slug);
    return okResponse(BrandResponseDto.fromDomain(brand as any));
  }

  @Post()
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new brand (admin only).' })
  @ApiResponse({ status: 201, description: 'Brand created.' })
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.service.create({
      name: dto.name,
      slug: dto.slug,
      manufacturer: dto.manufacturer,
      countryCode: dto.countryCode,
      websiteUrl: dto.websiteUrl,
      description: dto.description,
      logoImageUrl: dto.logoImageUrl,
      isActive: dto.isActive,
    });
    return okResponse(BrandResponseDto.fromDomain(brand as any));
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a brand (admin only).' })
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    const brand = await this.service.update(id as unknown as Uuid, {
      name: dto.name,
      slug: dto.slug,
      manufacturer: dto.manufacturer,
      countryCode: dto.countryCode,
      websiteUrl: dto.websiteUrl,
      description: dto.description,
      logoImageUrl: dto.logoImageUrl,
      isActive: dto.isActive,
    });
    return okResponse(BrandResponseDto.fromDomain(brand as any));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a brand (admin only).' })
  async softDelete(@Param('id') id: string) {
    await this.service.softDelete(id as unknown as Uuid);
    return okResponse({ deleted: true });
  }

  @Post(':id/restore')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted brand (admin only).' })
  async restore(@Param('id') id: string) {
    const brand = await this.service.restore(id as unknown as Uuid);
    return okResponse(BrandResponseDto.fromDomain(brand as any));
  }

  @Post(':id/activate')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a brand (admin only).' })
  async activate(@Param('id') id: string) {
    const brand = await this.service.activate(id as unknown as Uuid);
    return okResponse(BrandResponseDto.fromDomain(brand as any));
  }

  @Post(':id/deactivate')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a brand (admin only).' })
  async deactivate(@Param('id') id: string) {
    const brand = await this.service.deactivate(id as unknown as Uuid);
    return okResponse(BrandResponseDto.fromDomain(brand as any));
  }
}
