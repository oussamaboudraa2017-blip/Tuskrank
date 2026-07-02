import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto, UpdateIngredientDto, IngredientResponseDto, IngredientListQueryDto } from './dto';
import { AdminGuard } from '@common/guards';
import { Throttle } from '@nestjs/throttler';
import { Public } from '@common/decorators';
import { okResponse, paginatedResponse, buildPaginationMeta } from '@common/dto';
import type { Uuid } from '@types';

@ApiTags('ingredients')
@Controller({ path: 'ingredients', version: '1' })
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List ingredients with pagination and filters.' })
  async list(@Query() query: IngredientListQueryDto) {
    const ingredientQuery = this.service.buildQueryFromDto({
      page: query.page,
      limit: query.limit,
      q: query.q,
      categoryId: query.categoryId,
      isAnimalDerived: query.isAnimalDerived,
      isCommonAllergen: query.isCommonAllergen,
      isControversial: query.isControversial,
      isActive: query.isActive,
      minScore: query.minScore,
      maxScore: query.maxScore,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    const { items, total } = await this.service.list(ingredientQuery);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const meta = buildPaginationMeta(page, limit, total, ingredientQuery.sort.by, ingredientQuery.sort.order);
    return paginatedResponse({ data: items.map((i) => IngredientResponseDto.fromDomain(i as any)), meta });
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List ingredient categories (tree).' })
  async listCategories() {
    const tree = await this.service.listCategories();
    return okResponse(tree);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search ingredients by name.' })
  async search(@Query('q') q: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    const { items, total } = await this.service.search({ q, page, limit });
    const meta = buildPaginationMeta(page ?? 1, limit ?? 20, total);
    return paginatedResponse({ data: items.map((i) => IngredientResponseDto.fromDomain(i as any)), meta });
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get ingredient detail by slug.' })
  async findBySlug(@Param('slug') slug: string) {
    const ingredient = await this.service.findBySlug(slug);
    return okResponse(IngredientResponseDto.fromDomain(ingredient as any));
  }

  @Get(':id/products')
  @Public()
  @ApiOperation({ summary: 'Get products containing this ingredient.' })
  async findRelatedProducts(@Param('id') id: string, @Query('limit') limit?: number, @Query('offset') offset?: number) {
    const entries = await this.service.findRelatedProducts(id as unknown as Uuid, { limit, offset });
    return okResponse(entries);
  }

  @Get(':id/references')
  @Public()
  @ApiOperation({ summary: 'Get scientific references for an ingredient.' })
  async findReferences(@Param('id') id: string) {
    const refs = await this.service.findReferences(id as unknown as Uuid);
    return okResponse(refs);
  }

  @Get(':id/scores/history')
  @Public()
  @ApiOperation({ summary: 'Get score history for an ingredient.' })
  async findScoreHistory(@Param('id') id: string) {
    const history = await this.service.findScoreHistory(id as unknown as Uuid);
    return okResponse(history);
  }

  @Post()
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an ingredient (admin only).' })
  async create(@Body() dto: CreateIngredientDto) {
    const ingredient = await this.service.create({
      name: dto.name,
      slug: dto.slug,
      inciName: dto.inciName,
      categoryId: dto.categoryId as Uuid | undefined,
      canonicalName: dto.canonicalName,
      description: dto.description,
      isAnimalDerived: dto.isAnimalDerived,
      isCommonAllergen: dto.isCommonAllergen,
      isControversial: dto.isControversial,
      isActive: dto.isActive,
    });
    return okResponse(IngredientResponseDto.fromDomain(ingredient as any));
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an ingredient (admin only).' })
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    const ingredient = await this.service.update(id as unknown as Uuid, {
      name: dto.name,
      slug: dto.slug,
      inciName: dto.inciName,
      categoryId: dto.categoryId as Uuid | undefined,
      canonicalName: dto.canonicalName,
      description: dto.description,
      isAnimalDerived: dto.isAnimalDerived,
      isCommonAllergen: dto.isCommonAllergen,
      isControversial: dto.isControversial,
      isActive: dto.isActive,
    });
    return okResponse(IngredientResponseDto.fromDomain(ingredient as any));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete an ingredient (admin only).' })
  async softDelete(@Param('id') id: string) {
    await this.service.softDelete(id as unknown as Uuid);
    return okResponse({ deleted: true });
  }

  @Post(':id/restore')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restore a soft-deleted ingredient (admin only).' })
  async restore(@Param('id') id: string) {
    const ingredient = await this.service.restore(id as unknown as Uuid);
    return okResponse(IngredientResponseDto.fromDomain(ingredient as any));
  }

  @Post(':id/activate')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate an ingredient (admin only).' })
  async activate(@Param('id') id: string) {
    const ingredient = await this.service.activate(id as unknown as Uuid);
    return okResponse(IngredientResponseDto.fromDomain(ingredient as any));
  }

  @Post(':id/deactivate')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an ingredient (admin only).' })
  async deactivate(@Param('id') id: string) {
    const ingredient = await this.service.deactivate(id as unknown as Uuid);
    return okResponse(IngredientResponseDto.fromDomain(ingredient as any));
  }

  @Post(':id/scores')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a score for an ingredient (admin only).' })
  async createScore(
    @Param('id') id: string,
    @Body() dto: { score: number; grade: string; reasoning?: string; scoringVersion: string },
  ) {
    const score = await this.service.createScore(id as unknown as Uuid, dto);
    return okResponse(score);
  }
}
