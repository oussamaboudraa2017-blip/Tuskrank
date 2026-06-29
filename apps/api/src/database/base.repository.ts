import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from './database.service';

const ALLOWED_TABLE_NAME = /^[a-z][a-z0-9_]*$/;

/**
 * Base class for every domain repository.
 *
 * Why a base class:
 *   * Single place to plug in transactional scoping.
 *   * Single place to plug in audit-write logic once (Sprint 5+).
 *   * Single place to standardize `actorId` propagation.
 *
 * Concrete repositories are simple:
 *
 *   @Injectable()
 *   class BrandsRepository extends BaseRepository<BrandRow> {
 *     protected override tableName = 'brands';
 *     listActive() {
 *       return this.query('select id, name, slug from brands where is_active = true');
 *     }
 *   }
 *
 * Sprint 2A: the base itself is delivered; no concrete business
 * repositories. The first concrete repository lands in Sprint 2B
 * (Products module).
 */
@Injectable()
export class BaseRepository<T extends QueryResultRow = QueryResultRow> {
  /**
   * Subclasses MUST override this with the table name. Set to
   * undefined so the subclass can never call `ping()` with an
   * unresolved identifier.
   */
  protected tableName?: string;

  constructor(protected readonly db: DatabaseService) {}

  /** Run a single, non-transactional query. */
  query<R extends QueryResultRow = T>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return this.db.query<R>(text, values);
  }

  /** Open a transaction and pass a client to the callback. */
  transaction<R>(fn: (client: PoolClient) => Promise<R>): Promise<R> {
    return this.db.transaction(fn);
  }

  /**
   * Convenience for INSERT/SELECT/UPDATE statements with RETURNING.
   */
  insertReturning<R extends QueryResultRow = T>(
    sql: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return this.query<R>(sql, values);
  }

  /**
   * Probe — runs `SELECT 1::int` against the database. The
   * subclass-set tableName is **not** used to avoid unsafe SQL
   * interpolation; use `db.healthcheck()` directly.
   */
  async ping(): Promise<boolean> {
    const r = await this.query('SELECT 1::int AS ok');
    return r.rows.length === 1 && r.rows[0].ok === 1;
  }

  /**
   * Optional structured accessor for read queries that bind a
   * `tableName` safely. Subclasses use this so `select * from ${table}`
   * is impossible. Reserved for future CRUD layer (Sprint 2B+).
   */
  protected validateTableName(name: string): string {
    if (!ALLOWED_TABLE_NAME.test(name)) {
      throw new Error(`Invalid table name (must match ${ALLOWED_TABLE_NAME}): ${name}`);
    }
    return name;
  }
}
