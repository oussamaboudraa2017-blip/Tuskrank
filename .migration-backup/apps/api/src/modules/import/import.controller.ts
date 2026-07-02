import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { ImportEntityType, ImportFormat, DedupeStrategy } from './enums';
import { Roles } from '@common/decorators';
import { okResponse } from '@common/dto';

/**
 * Multer file type — avoids depending on @types/multer at compile time.
 */
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

/**
 * Import controller — REST surface for data import.
 *
 * Endpoints:
 *   POST   /api/v1/import              (admin — run import pipeline via JSON body)
 *   POST   /api/v1/import/upload       (admin — run import pipeline via file upload, max 10MB)
 *   GET    /api/v1/import/jobs         (admin — list all jobs)
 *   GET    /api/v1/import/jobs/:jobId  (admin — get job detail)
 *   GET    /api/v1/import/jobs/:jobId/report (admin — get report)
 */
@ApiTags('import')
@Controller({ path: 'import', version: '1' })
export class ImportController {
  constructor(private readonly service: ImportService) {}

  /* ================================================================
   * Admin — Run import via JSON body
   * ================================================================ */

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run an import pipeline (admin, JSON body).' })
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
   * Admin — Run import via file upload (max 10 MB)
   * ================================================================ */

  @Post('upload')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Run an import pipeline via file upload (admin, max 10MB).' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'entityType'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'CSV or JSON file (max 10MB)' },
        entityType: { type: 'string', enum: ['products', 'brands', 'ingredients'] },
        dedupeStrategy: { type: 'string', enum: ['skip', 'overwrite', 'merge'], default: 'skip' },
      },
    },
  })
  async upload(
    @UploadedFile() file: UploadedFile,
    @Body('entityType') entityType: ImportEntityType,
    @Body('dedupeStrategy') dedupeStrategy?: DedupeStrategy,
  ) {
    const filename = file.originalname;
    const content = file.buffer.toString('utf-8');
    const format = (filename.endsWith('.json') ? 'json' : 'csv') as ImportFormat;
    const job = await this.service.import({
      entityType,
      format,
      content,
      filename,
      dedupeStrategy,
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