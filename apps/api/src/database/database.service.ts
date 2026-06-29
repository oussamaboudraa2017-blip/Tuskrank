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
import { DatabaseUnavailableError } from '@common/errors/api-error';

export const PG_POOL = Symbol.for('tuskrank.pg_pool');

/**
 * Supabase Postgres connection provider.
 *
 * Uses the `pg` driver pointed at Supabase Postgres. In production
 * the connection string is the Supabase Pooler (port 6543 in
 * transaction mode); in development it is direct (port 5432 via
 * docker-compose).
 *
 * NOTE: Sprint 2A includes only the connection provider — no
 * business repositories yet.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private poolInstance?: Pool;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  /**
   * Lazily-initialised, cached pg.Pool. Pool construction is moved to
   * `onModuleInit` so callers can rely on `DatabaseService` being
   * ready to query by the time the first request lands.
   */
  private pool(): Pool {
    if (this.poolInstance) return this.poolInstance;
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
      min: this.config.get<number>('DATABASE_POOL_MIN', 2),
      max: this.config.get<number>('DATABASE_POOL_MAX', 10),
      statement_timeout: this.config.get<number>(
        'DATABASE_STATEMENT_TIMEOUT_MS',
        15000,
      ),
      query_timeout: this.config.get<number>('DATABASE_QUERY_TIMEOUT_MS', 10000),
      idleTimeoutMillis: 30_000,
      application_name: this.config.get<string>('APP_NAME', 'tuskrank-api'),
      connectionTimeoutMillis: 5_000,
    });
    pool.on('error', (err) => {
      this.logger.error('pg pool error', err.stack ?? err.message);
    });
    this.poolInstance = pool;
    return pool;
  }

  async onModuleInit(): Promise<void> {
    const env = this.config.get<AppEnvironment>(
      'NODE_ENV',
      AppEnvironment.Development,
    );
    if (env === AppEnvironment.Test) {
      // Skip warmup in tests; the pool is created lazily on first query.
      return;
    }
    const pool = this.pool();
    try {
      await pool.query('SELECT 1');
      this.logger.log('Database pool ready');
    } catch (err) {
      this.logger.warn(
        `Database warmup failed: ${(err as Error).message}. Will retry on first query.`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.poolInstance) return;
    await this.poolInstance.end().catch(() => void 0);
    this.poolInstance = undefined;
  }

  /**
   * Run a single query. Repositories MUST go through `query`.
   */
  async query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    const pool = this.pool();
    try {
      return await pool.query<R>(text, values as unknown[]);
    } catch (err) {
      throw this.translate(err as Error);
    }
  }

  /**
   * Run a function inside a single transaction. Either commits on
   * success or rolls back on error. Repositories that mutate should
   * always call `transaction`.
   */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const pool = this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const out = await fn(client);
      await client.query('COMMIT');
      return out;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => void 0);
      throw this.translate(err as Error);
    } finally {
      client.release();
    }
  }

  /** Health probe — SELECT 1 against the pool. */
  async healthcheck(): Promise<{ ok: boolean; latencyMs: number }> {
    const start = process.hrtime.bigint();
    try {
      await this.query('SELECT 1');
      const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      return { ok: true, latencyMs };
    } catch {
      return { ok: false, latencyMs: -1 };
    }
  }

  private translate(err: Error): Error {
    const code = (err as Error & { code?: string }).code;
    if (
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === '57P01' ||
      code === '08006' ||
      code === '08001'
    ) {
      return new DatabaseUnavailableError('Database is unavailable');
    }
    return err;
  }
}
