import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { AppEnvironment } from '@common/enums';
import {
  ConflictError,
  DatabaseUnavailableError,
  RequestTimeoutException,
  UnprocessableEntityError,
  ValidationError,
} from '@common/errors/api-error';
import { PinoLogger } from 'nestjs-pino';

export const PG_POOL = Symbol.for('tuskrank.pg_pool');

interface PoolConfig {
  min: number;
  max: number;
  statementTimeoutMs: number;
  queryTimeoutMs: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 200;
const DB_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  '57P01',
  '08006',
  '08001',
  '08003',
  '08004',
  '08007',
  '53300',
]);
const DB_RETRYABLE_CODES = new Set([
  '40001',
  '40P01',
  '55P03',
  '53000',
  '53100',
  '53200',
  '57014',
]);

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private poolInstance: Pool | null = null;
  private readonly poolConfig: PoolConfig;

  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    this.poolConfig = {
      min: this.config.get<number>('DATABASE_POOL_MIN', 2),
      max: this.config.get<number>('DATABASE_POOL_MAX', 20),
      statementTimeoutMs: this.config.get<number>('DATABASE_STATEMENT_TIMEOUT_MS', 30_000),
      queryTimeoutMs: this.config.get<number>('DATABASE_QUERY_TIMEOUT_MS', 15_000),
      idleTimeoutMs: 30_000,
      connectionTimeoutMs: 5_000,
      retryAttempts: this.config.get<number>('DATABASE_RETRY_ATTEMPTS', MAX_RETRY_ATTEMPTS),
      retryDelayMs: this.config.get<number>('DATABASE_RETRY_DELAY_MS', RETRY_DELAY_MS),
    };
  }

  private createPool(): Pool {
    const env = this.config.get<AppEnvironment>('NODE_ENV', AppEnvironment.Development);
    const url = this.config.get<string>('DATABASE_URL');

    if (!url && env !== AppEnvironment.Test) {
      throw new Error('DATABASE_URL is not configured');
    }

    const pool = new Pool({
      connectionString: url ?? 'postgres://postgres:postgres@127.0.0.1:5432/tuskrank',
      ssl: this.config.get<boolean>('DATABASE_SSL', false)
        ? { rejectUnauthorized: false }
        : false,
      min: this.poolConfig.min,
      max: this.poolConfig.max,
      statement_timeout: this.poolConfig.statementTimeoutMs,
      query_timeout: this.poolConfig.queryTimeoutMs,
      idleTimeoutMillis: this.poolConfig.idleTimeoutMs,
      application_name: this.config.get<string>('APP_NAME', 'tuskrank-api'),
      connectionTimeoutMillis: this.poolConfig.connectionTimeoutMs,
    });

    pool.on('error', (err: Error) => {
      this.logger.error({ msg: 'pg pool error', err: err.stack ?? err.message });
    });

    pool.on('connect', () => {
      this.logger.log('pg client connected to pool');
    });

    return pool;
  }

  async onModuleInit(): Promise<void> {
    const env = this.config.get<AppEnvironment>('NODE_ENV', AppEnvironment.Development);
    if (env === AppEnvironment.Test) return;

    this.poolInstance = this.createPool();
    try {
      await this.poolInstance.query('SELECT 1');
      this.logger.log({ msg: 'Database pool ready', config: this.poolConfig });
    } catch (err) {
      this.logger.warn({
        msg: `Database warmup failed: ${(err as Error).message}. Will retry on first query.`,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.poolInstance) return;
    await this.poolInstance.end().catch(() => void 0);
    this.poolInstance = null;
  }

  private getPool(): Pool {
    if (!this.poolInstance) {
      this.poolInstance = this.createPool();
    }
    return this.poolInstance;
  }

  async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return this.executeWithRetry<R>((pool) => pool.query<R>(text, values as unknown[]));
  }

  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => void 0);
      throw this.translateError(err as Error);
    } finally {
      client.release(true);
    }
  }

  async transactionIsolation<T>(
    fn: (client: PoolClient) => Promise<T>,
    isolation: 'SERIALIZABLE' | 'REPEATABLE READ' | 'READ COMMITTED' = 'READ COMMITTED',
  ): Promise<T> {
    const pool = this.getPool();
    const client = await pool.connect();
    try {
      await client.query(`BEGIN ISOLATION LEVEL ${isolation}`);
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => void 0);
      throw this.translateError(err as Error);
    } finally {
      client.release(true);
    }
  }

  async healthcheck(): Promise<{
    ok: boolean;
    latencyMs: number;
    poolSize: number;
    idleCount: number;
    waitingCount: number;
  }> {
    const start = process.hrtime.bigint();
    try {
      await this.query('SELECT 1');
      const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const pool = this.poolInstance;
      return {
        ok: true,
        latencyMs,
        poolSize: pool?.totalCount ?? 0,
        idleCount: pool?.idleCount ?? 0,
        waitingCount: pool?.waitingCount ?? 0,
      };
    } catch {
      return { ok: false, latencyMs: -1, poolSize: 0, idleCount: 0, waitingCount: 0 };
    }
  }

  private async executeWithRetry<R extends QueryResultRow>(
    fn: (pool: Pool) => Promise<QueryResult<R>>,
    attempt = 1,
  ): Promise<QueryResult<R>> {
    const pool = this.getPool();
    try {
      return await fn(pool);
    } catch (err) {
      const pgErr = err as Error & { code?: string };
      const shouldRetry =
        attempt < this.poolConfig.retryAttempts &&
        (DB_RETRYABLE_CODES.has(pgErr.code ?? '') ||
          pgErr.message?.includes('timeout') ||
          pgErr.message?.includes('concurrent'));

      if (shouldRetry) {
        const delay = Math.min(this.poolConfig.retryDelayMs * Math.pow(2, attempt - 1), 2000);
        this.logger.warn({
          msg: `Query retry ${attempt}/${this.poolConfig.retryAttempts} after ${delay}ms`,
          code: pgErr.code,
          attempt,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.executeWithRetry<R>(fn, attempt + 1);
      }

      throw this.translateError(pgErr);
    }
  }

  translateError(err: Error): Error {
    const pgErr = err as Error & { code?: string; constraint?: string; detail?: string };
    const code = pgErr.code;

    if (!code) return err;

    if (DB_UNAVAILABLE_CODES.has(code)) {
      return new DatabaseUnavailableError('Database is unavailable');
    }

    switch (code) {
      case '23505':
        return new ConflictError(pgErr.detail ?? 'Duplicate key violation', {
          constraint: pgErr.constraint,
        });
      case '23503':
        return new ConflictError(pgErr.detail ?? 'Foreign key violation');
      case '23514':
        return new UnprocessableEntityError('Check constraint violation', {
          constraint: pgErr.constraint,
        });
      case '22P02':
        return new ValidationError('Invalid input syntax');
      case '42P01':
        this.logger.error({ msg: 'Missing table', err: err.message });
        return new UnprocessableEntityError('Database schema error');
      case '57014':
        return new RequestTimeoutException('Query cancelled due to statement timeout');
      default:
        return err;
    }
  }
}
