import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import {
  SearchQueryDto,
  GlobalSearchQueryDto,
  AutocompleteQueryDto,
} from './dto';
import { Public } from '@common/decorators';
import { okResponse } from '@common/dto';
import { SearchEntityType } from './enums';

/**
 * Search controller — public search endpoints.
 *
 * Endpoints:
 *   GET /api/v1/search/products        — entity-specific product search
 *   GET /api/v1/search/brands          — entity-specific brand search
 *   GET /api/v1/search/ingredients     — entity-specific ingredient search
 *   GET /api/v1/search/global          — multi-entity global search
 *   GET /api/v1/search/autocomplete    — prefix autocomplete
 *   GET /api/v1/search/synonyms/:term  — synonym expansion
 *   GET /api/v1/search/trending        — trending searches
 *   GET /api/v1/search/popular         — popular searches
 *   GET /api/v1/search/lookup/:type/:slug — slug lookup
 */
@ApiTags('search')
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /* ================================================================
   * Entity-specific search
   * ================================================================ */

  @Get('products')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search products by query.' })
  async searchProducts(@Query() query: SearchQueryDto) {
    const result = await this.searchService.searchProducts({
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      petType: query.petType,
      minScore: query.minScore,
      locale: query.locale,
    });
    return okResponse(result);
  }

  @Get('brands')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search brands by query.' })
  async searchBrands(@Query() query: SearchQueryDto) {
    const result = await this.searchService.searchBrands({
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      locale: query.locale,
    });
    return okResponse(result);
  }

  @Get('ingredients')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search ingredients by query.' })
  async searchIngredients(@Query() query: SearchQueryDto) {
    const result = await this.searchService.searchIngredients({
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      locale: query.locale,
    });
    return okResponse(result);
  }

  /* ================================================================
   * Global search
   * ================================================================ */

  @Get('global')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search across products, brands, and ingredients.' })
  async searchGlobal(@Query() query: GlobalSearchQueryDto) {
    const result = await this.searchService.searchGlobal({
      q: query.q,
      limit: query.limit,
      petType: query.petType,
      minScore: query.minScore,
      locale: query.locale,
      types: query.types,
    });
    return okResponse(result);
  }

  /* ================================================================
   * Slug lookup
   * ================================================================ */

  @Get('lookup/:type/:slug')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find an entity by its exact slug and type.' })
  async findBySlug(
    @Param('type') type: string,
    @Param('slug') slug: string,
  ) {
    const result = await this.searchService.findBySlug(
      type as SearchEntityType,
      slug,
    );
    return okResponse(result);
  }

  /* ================================================================
   * Autocomplete
   * ================================================================ */

  @Get('autocomplete')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autocomplete search prefix.' })
  async autocomplete(@Query() query: AutocompleteQueryDto) {
    const suggestions = await this.searchService.autocomplete({
      q: query.q,
      types: query.types,
      limit: query.limit,
      locale: query.locale,
    });
    return okResponse(suggestions);
  }

  /* ================================================================
   * Synonyms
   * ================================================================ */

  @Get('synonyms/:term')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expand a term using synonym mappings.' })
  async expandSynonyms(
    @Param('term') term: string,
    @Query('locale') locale?: string,
  ) {
    const synonyms = await this.searchService.expandSynonyms({
      q: term,
      locale,
    });
    return okResponse(synonyms);
  }

  /* ================================================================
   * Trending
   * ================================================================ */

  @Get('trending')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trending search terms.' })
  async getTrending(
    @Query('limit') limit?: number,
    @Query('locale') locale?: string,
  ) {
    const trending = await this.searchService.getTrending({
      limit,
      locale,
    });
    return okResponse(trending);
  }

  /* ================================================================
   * Popular
   * ================================================================ */

  @Get('popular')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get popular (frequently searched) terms.' })
  async getPopular(@Query('limit') limit?: number) {
    const popular = await this.searchService.getPopularSearches(limit);
    return okResponse(popular);
  }
}
