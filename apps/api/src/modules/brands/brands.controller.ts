import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Uuid } from '@types';
import { BrandsService } from './brands.service';
import {
  ListBrandsQueryDto,
  SearchBrandsQueryDto,
  CreateBrandDto,
  UpdateBrandDto,
  PatchBrandDto,
} from './dto';
import { Public, Roles } from '@common/decorators';
import { okResponse, paginatedResponse, buildPaginationMeta } from '@common/dto';

/**
 * Brands controller — REST surface for Sprint 2D.
 *
 * Endpoints:
 *   GET    /api/v1/brands                              (public — paginated list)
 *   GET    /api/v1/brands/featured                     (public — top brands)
 *   GET    /api/v1/brands/search?q=...                 (public — search)
 *   GET    /api/v1/brands/:slug                        (public — detail)
 *   POST   /api/v1/brands                              (admin — create)
 *   PUT    /api/v1/brands/:brandId                     (admin — full update)
 *   PATCH  /api/v1/brands/:brandId                     (admin — partial update)
 *   POST   /api/v1/brands/:brandId/activate            (admin)
 *   POST   /api/v1/brands/:brandId/deactivate          (admin)
 *   POST   /api/v1/brands/:brandId/soft-delete         (admin)
 *   POST   /api/v1/brands/:brandId/restore             (admin)
 */
@ApiTags('brands')
@Controller({ path: 'brands', version: '1' })
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  /* ================================================================
   * Public — List
   * ================================================================ */

  @Get()
  @Public()
  @ApiOperation({ summary: 'List brands (paginated, filterable, sortable).' })
  async list(@Query() query: ListBrandsQueryDto) {
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
    return paginatedResponse({ data: items, meta });
  }

  /* ================================================================
   * Public — Featured
   * ================================================================ */

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get top brands ranked by product count and score.' })
  async featured(@Query('limit') limit?: number) {
    const brands = await this.service.findFeatured(limit ?? 10);
    return okResponse(brands);
  }

  /* ================================================================
   * Public — Search
   * ================================================================ */

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search brands by name or manufacturer.' })
  async search(@Query() query: SearchBrandsQueryDto) {
    const { items, total } = await this.service.search({
      q: query.q,
      countryCode: query.countryCode,
      page: query.page,
      limit: query.limit,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const meta = buildPaginationMeta(page, limit, total);
    return paginatedResponse({ data: items, meta });
  }

  /* ================================================================
   * Public — Detail by slug
   * ================================================================ */

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get brand detail by slug.' })
  async findBySlug(@Param('slug') slug: string) {
    const brand = await this.service.findBySlug(slug);
    return okResponse(brand);
  }

  /* ================================================================
   * Admin — Create
   * ================================================================ */

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new brand (admin).' })
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
    return okResponse(brand);
  }

  /* ================================================================
   * Admin — Full update (PUT)
   * ================================================================ */

  @Put(':brandId')
  @Roles('admin')
  @ApiOperation({ summary: 'Full update of a brand (admin).' })
  async update(
    @Param('brandId') brandId: string,
    @Body() dto: UpdateBrandDto,
  ) {
    const brand = await this.service.update(brandId as Uuid, {
      name: dto.name,
      slug: dto.slug,
      manufacturer: dto.manufacturer,
      countryCode: dto.countryCode,
      websiteUrl: dto.websiteUrl,
      description: dto.description,
      logoImageUrl: dto.logoImageUrl,
      isActive: dto.isActive,
    });
    return okResponse(brand);
  }

  /* ================================================================
   * Admin — Partial update (PATCH)
   * ================================================================ */

  @Patch(':brandId')
  @Roles('admin')
  @ApiOperation({ summary: 'Partial update of a brand (admin).' })
  async patch(
    @Param('brandId') brandId: string,
    @Body() dto: PatchBrandDto,
  ) {
    const brand = await this.service.update(brandId as Uuid, {
      name: dto.name,
      slug: dto.slug,
      manufacturer: dto.manufacturer,
      countryCode: dto.countryCode,
      websiteUrl: dto.websiteUrl,
      description: dto.description,
      logoImageUrl: dto.logoImageUrl,
      isActive: dto.isActive,
    });
    return okResponse(brand);
  }

  /* ================================================================
   * Admin — Lifecycle transitions
   * ================================================================ */

  @Post(':brandId/activate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate a brand (admin).' })
  async activate(@Param('brandId') brandId: string) {
    const brand = await this.service.activate(brandId as Uuid);
    return okResponse(brand);
  }

  @Post(':brandId/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a brand (admin).' })
  async deactivate(@Param('brandId') brandId: string) {
    const brand = await this.service.deactivate(brandId as Uuid);
    return okResponse(brand);
  }

  @Post(':brandId/soft-delete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a brand (admin).' })
  async softDelete(@Param('brandId') brandId: string) {
    await this.service.softDelete(brandId as Uuid);
    return okResponse({ deleted: true });
  }

  @Post(':brandId/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted brand (admin).' })
  async restore(@Param('brandId') brandId: string) {
    const brand = await this.service.restore(brandId as Uuid);
    return okResponse(brand);
  }
}
