import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from './database.service';

const ALLOWED_TABLE_NAME = /^[a-z][a-z0-9_]*$/;
const ALLOWED_COLUMN_NAME = /^[a-z][a-z0-9_]*$/;
const ALLOWED_ORDER_DIR = /^(asc|desc|ASC|DESC)$/;

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export type QueryRunner = Pick<DatabaseService, 'query' | 'transaction'>;

@Injectable()
export class BaseRepository<T extends QueryResultRow = QueryResultRow> {
  protected tableName?: string;

  constructor(protected readonly db: DatabaseService) {}

  /** Central execute method — all queries go through this. */
  protected async execute<R extends QueryResultRow = T>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return this.db.query<R>(text, values);
  }

  /** Backward-compat query alias. Subclasses can use either. */
  query<R extends QueryResultRow = T>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return this.execute<R>(text, values);
  }

  /** Run a query within a transaction. */
  protected async executeTx<R>(
    fn: (client: PoolClient) => Promise<R>,
  ): Promise<R> {
    return this.db.transaction(fn);
  }

  /** Safe table name validation. */
  protected table(name: string): string {
    if (!ALLOWED_TABLE_NAME.test(name)) {
      throw new Error(`Invalid table name: ${name}`);
    }
    return name;
  }

  /** Safe column name validation. */
  protected col(name: string): string {
    if (!ALLOWED_COLUMN_NAME.test(name)) {
      throw new Error(`Invalid column name: ${name}`);
    }
    return name;
  }

  /** Safe ORDER BY direction. */
  protected dir(d: string): 'asc' | 'desc' {
    return ALLOWED_ORDER_DIR.test(d) ? (d.toLowerCase() as 'asc' | 'desc') : 'desc';
  }

  /** Build a safe ORDER BY clause. */
  protected orderBy(sortBy?: string, sortOrder?: string): string {
    if (!sortBy) return '';
    return `ORDER BY ${this.col(sortBy)} ${this.dir(sortOrder ?? 'desc')}`;
  }

  /** Build LIMIT/OFFSET clause. */
  protected paginate(page: number, limit: number): string {
    const offset = (page - 1) * limit;
    return `LIMIT ${Math.min(limit, 100)} OFFSET ${Math.max(0, offset)}`;
  }

  /** Build a pagination CTE that returns total count alongside data. */
  protected paginatedQuery(
    selectCols: string,
    fromClause: string,
    whereClause: string,
    orderClause: string,
    page: number,
    limit: number,
  ): { text: string; values: unknown[] } {
    const offset = (page - 1) * limit;
    const text = `
      WITH _count AS (
        SELECT COUNT(*) AS total FROM ${fromClause} ${whereClause}
      )
      SELECT ${selectCols}, _count.total AS _total
      FROM ${fromClause}, _count
      ${whereClause}
      ${orderClause}
      LIMIT $1 OFFSET $2
    `;
    return { text, values: [limit, offset] };
  }

  /** Extract pagination meta from a paginated query result. */
  protected buildMeta<TData>(
    data: TData[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResult<TData> {
    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1 && page <= totalPages,
      },
    };
  }

  /** Execute and return all rows. */
  protected async executeThenAll<R extends QueryResultRow = T>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<R[]> {
    const result = await this.execute<R>(text, values);
    return result.rows;
  }

  /** Execute and return first row or null. */
  protected async executeThenOne<R extends QueryResultRow = T>(
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<R | null> {
    const result = await this.execute<R>(text, values);
    return result.rows[0] ?? null;
  }

  /** Batch insert multiple rows in a single statement. */
  protected async batchInsert<R extends QueryResultRow = T>(
    table: string,
    rows: Record<string, unknown>[],
    returning = '*',
  ): Promise<R[]> {
    if (rows.length === 0) return [];

    const keys = Object.keys(rows[0]);
    const cols = keys.map((k) => this.col(k)).join(', ');

    const valueStrings: string[] = [];
    const flatValues: unknown[] = [];
    rows.forEach((row, rowIdx) => {
      const placeholders = keys.map((_, colIdx) => {
        const idx = rowIdx * keys.length + colIdx + 1;
        return `$${idx}`;
      });
      valueStrings.push(`(${placeholders.join(', ')})`);
      keys.forEach((k) => flatValues.push(row[k]));
    });

    const result = await this.execute<R>(
      `INSERT INTO ${this.table(table)} (${cols}) VALUES ${valueStrings.join(', ')} RETURNING ${returning}`,
      flatValues,
    );
    return result.rows;
  }

  async ping(): Promise<boolean> {
    const result = await this.execute('SELECT 1::int AS ok');
    return result.rows.length === 1 && result.rows[0].ok === 1;
  }
}
