import {
  Controller,
  Get,
  HttpCode,
} from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '@database';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { HealthIndicator } from '@nestjs/terminus';
import { okResponse } from '@common/dto';
import { Public } from '@common/decorators';

const POSTGRES_HEALTH_BUDGET_MS = 1500;

@Injectable()
export class PostgresHealthIndicator extends HealthIndicator {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const probe = (async () => this.db.healthcheck())();
    const timeout = new Promise<{ ok: false; latencyMs: number }>((resolve) =>
      setTimeout(
        () => resolve({ ok: false, latencyMs: POSTGRES_HEALTH_BUDGET_MS }),
        POSTGRES_HEALTH_BUDGET_MS,
      ),
    );
    const { ok, latencyMs } = await Promise.race([probe, timeout]);
    const result = this.getStatus(key, ok, { latencyMs });
    if (!ok) {
      throw new Error('postgres_unreachable');
    }
    return result;
  }
}

@ApiTags('health')
@Public()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DatabaseService,
    private readonly postgres: PostgresHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly cfg: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Full liveness + readiness check.' })
  check() {
    return this.health.check([
      () =>
        this.memory.checkHeap(
          'memory_heap',
          this.cfg.get<number>('HEALTH_MEMORY_HEAP_THRESHOLD', 400),
        ),
      () =>
        this.memory.checkRSS(
          'memory_rss',
          this.cfg.get<number>('HEALTH_MEMORY_RSS_THRESHOLD', 512),
        ),
      () => this.postgres.pingCheck('postgres'),
    ]);
  }

  @Get('live')
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness check (process alive).' })
  live() {
    return okResponse<{ status: 'alive' }>({ status: 'alive' });
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness check (can serve traffic).' })
  ready() {
    return this.health.check([() => this.postgres.pingCheck('postgres')]);
  }
}
