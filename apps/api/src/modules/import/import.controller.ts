import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { ImportEntityType, ImportFormat, DedupeStrategy } from './enums';
import { Roles } from '@common/decorators';
import { okResponse } from '@common/dto';

/**
 * Import controller — REST surface for data import.
 *
 * NOTE: This sprint creates the infrastructure only. File upload
 * via multipart/form-data will be wired when the frontend import
 * UI is built. For now, the pipeline accepts raw content in the body.
 *
 * Endpoints:
 *   POST   /api/v1/import              (admin — run import pipeline)
 *   GET    /api/v1/import/jobs         (admin — list all jobs)
 *   GET    /api/v1/import/jobs/:jobId  (admin — get job detail)
 *   GET    /api/v1/import/jobs/:jobId/report (admin — get report)
 */
@ApiTags('import')
@Controller({ path: 'import', version: '1' })
export class ImportController {
  constructor(private readonly service: ImportService) {}

  /* ================================================================
   * Admin — Run import
   * ================================================================ */

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run an import pipeline (admin).' })
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['entityType', 'format', 'content', 'filename'],
      properties: {
        entityType: { type: 'string', enum: ['products', 'brands', 'ingredients'] },
        format: { type: 'string', enum: ['csv', 'json'] },
        content: { type: 'string', description: 'File content as string' },
        filename: { type: 'string', description: 'Original filename' },
        dedupeStrategy: { type: 'string', enum: ['skip', 'overwrite', 'merge'], default: 'skip' },
      },
    },
  })
  async import(@Body() body: {
    entityType: ImportEntityType;
    format: ImportFormat;
    content: string;
    filename: string;
    dedupeStrategy?: DedupeStrategy;
  }) {
    const job = await this.service.import({
      entityType: body.entityType,
      format: body.format,
      content: body.content,
      filename: body.filename,
      dedupeStrategy: body.dedupeStrategy,
    });
    return okResponse(job);
  }

  /* ================================================================
   * Admin — List jobs
   * ================================================================ */

  @Get('jobs')
  @Roles('admin')
  @ApiOperation({ summary: 'List all import jobs (admin).' })
  listJobs() {
    const jobs = this.service.listJobs();
    return okResponse(jobs);
  }

  /* ================================================================
   * Admin — Get job detail
   * ================================================================ */

  @Get('jobs/:jobId')
  @Roles('admin')
  @ApiOperation({ summary: 'Get import job detail (admin).' })
  getJob(@Param('jobId') jobId: string) {
    const job = this.service.getJob(jobId);
    return okResponse(job);
  }

  /* ================================================================
   * Admin — Get report
   * ================================================================ */

  @Get('jobs/:jobId/report')
  @Roles('admin')
  @ApiOperation({ summary: 'Get import report (admin).' })
  getReport(@Param('jobId') jobId: string) {
    const report = this.service.getReport(jobId);
    return okResponse(report);
  }
}
