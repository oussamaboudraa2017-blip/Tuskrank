import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRepository } from './search.repository';

/**
 * Search module — full-text search, autocomplete, synonyms, trending.
 *
 * Uses PostgreSQL FTS + pg_trgm for ranking. The `SearchProvider`
 * interface allows swapping to Elasticsearch / Meilisearch later
 * without changing the service or controller layer.
 *
 * Endpoints (all public, opt-out from SupabaseAuthGuard):
 *   GET /api/v1/search/products
 *   GET /api/v1/search/brands
 *   GET /api/v1/search/ingredients
 *   GET /api/v1/search/global
 *   GET /api/v1/search/autocomplete
 *   GET /api/v1/search/synonyms/:term
 *   GET /api/v1/search/trending
 */
@Module({
  imports: [DatabaseModule],
  controllers: [SearchController],
  providers: [SearchRepository, SearchService],
  exports: [SearchService],
})
export class SearchModule {}
