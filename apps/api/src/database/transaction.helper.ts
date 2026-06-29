import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from './database.service';

/**
 * Convenience wrapper around `DatabaseService.transaction()`.
 *
 * Repositories that need ad-hoc transactions (without taking the
 * repository's own transaction lifecycle) can inject this helper.
 *
 *   await this.transactions.run(async (client) => { ... });
 */
@Injectable()
export class TransactionHelper {
  constructor(private readonly db: DatabaseService) {}

  run<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  /** Convenience for a single query inside an open transaction. */
  queryInTransaction<R extends QueryResultRow = QueryResultRow>(
    client: PoolClient,
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return client.query<R>(text, values as unknown[]);
  }
}
