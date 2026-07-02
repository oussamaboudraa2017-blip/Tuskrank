import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ImportRepository } from './import.repository';

/**
 * Import module — data platform foundation.
 *
 * Pipeline: Parse → Validate → Normalize → Deduplicate → Save → Report
 *
 * Supports: CSV, JSON import of products, brands, ingredients.
 *
 * Endpoints:
 *   POST   /api/v1/import              (admin — run import)
 *   GET    /api/v1/import/jobs         (admin — list jobs)
 *   GET    /api/v1/import/jobs/:jobId  (admin — get job)
 *   GET    /api/v1/import/jobs/:jobId/report (admin — get report)
 */
@Module({
  imports: [DatabaseModule],
  controllers: [ImportController],
  providers: [ImportRepository, ImportService],
  exports: [ImportService],
})
export class ImportModule {}
