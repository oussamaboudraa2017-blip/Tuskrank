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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Uuid } from '@types';
import { IngredientsService } from './ingredients.service';
import {
  ListIngredientsQueryDto,
  SearchIngredientsQueryDto,
  CreateIngredientDto,
  UpdateIngredientDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateScoreDto,
} from './dto';
import { IngredientMapper } from './domain/mapping';
import { Public, Roles } from '@common/decorators';
import { okResponse, paginatedResponse, buildPaginationMeta } from '@common/dto';

/**
 * Ingredients controller — REST surface for Sprint 2C.
 *
 * Endpoints:
 *   GET    /api/v1/ingredients                              (public — paginated list)
 *   GET    /api/v1/ingredients/search?q=...                 (public — search)
 *   GET    /api/v1/ingredients/:slug                        (public — detail)
 *   POST   /api/v1/ingredients                              (admin — create)
 *   PATCH  /api/v1/ingredients/:ingredientId                (admin — update)
 *   POST   /api/v1/ingredients/:ingredientId/activate       (admin)
 *   POST   /api/v1/ingredients/:ingredientId/deactivate     (admin)
 *   POST   /api/v1/ingredients/:ingredientId/soft-delete    (admin)
 *   POST   /api/v1/ingredients/:ingredientId/restore        (admin)
 *   GET    /api/v1/ingredients/:ingredientId/products       (public — related products)
 *   GET    /api/v1/ingredients/:ingredientId/references     (public — scientific refs)
 *   GET    /api/v1/ingredients/categories                   (public — category tree)
 *   POST   /api/v1/ingredients/categories                   (admin — create category)
 *   PATCH  /api/v1/ingredients/categories/:categoryId       (admin — update category)
 *   POST   /api/v1/ingredients/categories/:categoryId/soft-delete (admin)
 *   POST   /api/v1/ingredients/:ingredientId/scores         (admin — create score)
 *   GET    /api/v1/ingredients/:ingredientId/scores/history  (public — score history)
 */
@ApiTags('ingredients')
@Controller({ path: 'ingredients', version: '1' })
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  /* ================================================================
   * Public — List
   * ================================================================ */

  @Get()
  @Public()
  @ApiOperation({ summary: 'List ingredients (paginated, filterable, sortable).' })
  async list(@Query() query: ListIngredientsQueryDto) {
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

    const listItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      canonicalName: i.canonicalName,
      isAnimalDerived: i.isAnimalDerived,
      isCommonAllergen: i.isCommonAllergen,
      isControversial: i.isControversial,
      isActive: i.isActive,
      categoryName: i.categoryName,
      categorySlug: i.categorySlug,
      score: i.score,
      grade: i.grade,
      productCount: i.productCount,
    }));

    const meta = buildPaginationMeta(page, limit, total, ingredientQuery.sort.by, ingredientQuery.sort.order);
    return paginatedResponse({ data: listItems, meta });
  }

  /* ================================================================
   * Public — Search
   * ================================================================ */

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search ingredients by name.' })
  async search(@Query() query: SearchIngredientsQueryDto) {
    const { items, total } = await this.service.search({
      q: query.q,
      page: query.page,
      limit: query.limit,
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const listItems = items.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      canonicalName: i.canonicalName,
      isAnimalDerived: i.isAnimalDerived,
      isCommonAllergen: i.isCommonAllergen,
      isControversial: i.isControversial,
      isActive: i.isActive,
      categoryName: i.categoryName,
      categorySlug: i.categorySlug,
      score: i.score,
      grade: i.grade,
      productCount: i.productCount,
    }));

    const meta = buildPaginationMeta(page, limit, total);
    return paginatedResponse({ data: listItems, meta });
  }

  /* ================================================================
   * Public — Detail by slug
   * ================================================================ */

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get ingredient detail by slug.' })
  async findBySlug(@Param('slug') slug: string) {
    const ingredient = await this.service.findBySlug(slug);
    const detail = this.toDetailDto(ingredient);
    return okResponse(detail);
  }

  /* ================================================================
   * Public — Related products
   * ================================================================ */

  @Get(':ingredientId/products')
  @Public()
  @ApiOperation({ summary: 'Get products containing this ingredient.' })
  async findRelatedProducts(
    @Param('ingredientId') ingredientId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const entries = await this.service.findRelatedProducts(ingredientId as Uuid, { limit, offset });
    return okResponse(entries);
  }

  /* ================================================================
   * Public — References
   * ================================================================ */

  @Get(':ingredientId/references')
  @Public()
  @ApiOperation({ summary: 'Get scientific references for an ingredient.' })
  async findReferences(@Param('ingredientId') ingredientId: string) {
    const refs = await this.service.findReferences(ingredientId as Uuid);
    return okResponse(refs);
  }

  /* ================================================================
   * Public — Score history
   * ================================================================ */

  @Get(':ingredientId/scores/history')
  @Public()
  @ApiOperation({ summary: 'Get score history for an ingredient.' })
  async findScoreHistory(@Param('ingredientId') ingredientId: string) {
    const history = await this.service.findScoreHistory(ingredientId as Uuid);
    return okResponse(history);
  }

  /* ================================================================
   * Admin — Create
   * ================================================================ */

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new ingredient (admin).' })
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
    const detail = this.toDetailDto(ingredient);
    return okResponse(detail);
  }

  /* ================================================================
   * Admin — Update
   * ================================================================ */

  @Patch(':ingredientId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update an ingredient (admin).' })
  async update(
    @Param('ingredientId') ingredientId: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    const ingredient = await this.service.update(ingredientId as Uuid, {
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
    const detail = this.toDetailDto(ingredient);
    return okResponse(detail);
  }

  /* ================================================================
   * Admin — Lifecycle transitions
   * ================================================================ */

  @Post(':ingredientId/activate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate an ingredient (admin).' })
  async activate(@Param('ingredientId') ingredientId: string) {
    const ingredient = await this.service.activate(ingredientId as Uuid);
    const detail = this.toDetailDto(ingredient);
    return okResponse(detail);
  }

  @Post(':ingredientId/deactivate')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an ingredient (admin).' })
  async deactivate(@Param('ingredientId') ingredientId: string) {
    const ingredient = await this.service.deactivate(ingredientId as Uuid);
    const detail = this.toDetailDto(ingredient);
    return okResponse(detail);
  }

  @Post(':ingredientId/soft-delete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an ingredient (admin).' })
  async softDelete(@Param('ingredientId') ingredientId: string) {
    await this.service.softDelete(ingredientId as Uuid);
    return okResponse({ deleted: true });
  }

  @Post(':ingredientId/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft-deleted ingredient (admin).' })
  async restore(@Param('ingredientId') ingredientId: string) {
    const ingredient = await this.service.restore(ingredientId as Uuid);
    const detail = this.toDetailDto(ingredient);
    return okResponse(detail);
  }

  /* ================================================================
   * Public — Categories
   * ================================================================ */

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'List ingredient categories (tree).' })
  async listCategories() {
    const tree = await this.service.listCategories();
    return okResponse(tree);
  }

  /* ================================================================
   * Admin — Category CRUD
   * ================================================================ */

  @Post('categories')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an ingredient category (admin).' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.service.createCategory({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      parentId: dto.parentId as Uuid | undefined,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    return okResponse(category);
  }

  @Patch('categories/:categoryId')
  @Roles('admin')
  @ApiOperation({ summary: 'Update an ingredient category (admin).' })
  async updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.service.updateCategory(categoryId as Uuid, {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      parentId: dto.parentId as Uuid | undefined,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });
    return okResponse(category);
  }

  @Post('categories/:categoryId/soft-delete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an ingredient category (admin).' })
  async softDeleteCategory(@Param('categoryId') categoryId: string) {
    await this.service.softDeleteCategory(categoryId as Uuid);
    return okResponse({ deleted: true });
  }

  /* ================================================================
   * Admin — Score
   * ================================================================ */

  @Post(':ingredientId/scores')
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a score for an ingredient (admin).' })
  async createScore(
    @Param('ingredientId') ingredientId: string,
    @Body() dto: CreateScoreDto,
  ) {
    const score = await this.service.createScore(ingredientId as Uuid, {
      score: dto.score,
      grade: dto.grade,
      reasoning: dto.reasoning,
      scoringVersion: dto.scoringVersion,
    });
    return okResponse(score);
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  private toDetailDto(ingredient: ReturnType<typeof IngredientMapper.rowToIngredient>) {
    return {
      id: ingredient.id,
      name: ingredient.name,
      slug: ingredient.slug,
      inciName: ingredient.inciName,
      categoryId: ingredient.categoryId,
      canonicalName: ingredient.canonicalName,
      description: ingredient.description,
      isAnimalDerived: ingredient.isAnimalDerived,
      isCommonAllergen: ingredient.isCommonAllergen,
      isControversial: ingredient.isControversial,
      isActive: ingredient.isActive,
      createdAt: ingredient.createdAt,
      updatedAt: ingredient.updatedAt,
      categoryName: ingredient.category?.name ?? null,
      categorySlug: ingredient.category?.slug ?? null,
      score: ingredient.currentScore?.score ?? null,
      grade: ingredient.currentScore?.grade ?? null,
      productCount: ingredient.productCount ?? 0,
    };
  }
}
