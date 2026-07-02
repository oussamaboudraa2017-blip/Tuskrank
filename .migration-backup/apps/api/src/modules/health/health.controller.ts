import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '@database';
import { CacheService } from '@shared';
import { okResponse } from '@common/dto';
import { Public } from '@common/decorators';

@ApiTags('health')
@Public()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly cache: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Full health check (DB, cache, memory).' })
  async check() {
    const [dbStatus, cacheStats] = await Promise.all([
      this.db.healthcheck(),
      Promise.resolve(this.cache.stats()),
    ]);
    const mem = process.memoryUsage();
    return okResponse({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      cache: cacheStats,
      memory: {
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        rssMb: Math.round(mem.rss / 1024 / 1024),
      },
    });
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check.' })
  live() {
    return okResponse({ status: 'alive' });
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (DB reachable).' })
  async ready() {
    const dbStatus = await this.db.healthcheck();
    return okResponse({ status: dbStatus.ok ? 'ok' : 'degraded', database: dbStatus });
  }
}
