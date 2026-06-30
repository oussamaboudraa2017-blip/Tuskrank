import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DatabaseService } from './database.service';

@Injectable()
export class TransactionHelper {
  constructor(private readonly db: DatabaseService) {}

  run<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  runIsolation<T>(
    fn: (client: PoolClient) => Promise<T>,
    isolation: 'SERIALIZABLE' | 'REPEATABLE READ' | 'READ COMMITTED' = 'READ COMMITTED',
  ): Promise<T> {
    return this.db.transactionIsolation(fn, isolation);
  }

  queryInTransaction<R extends QueryResultRow = QueryResultRow>(
    client: PoolClient,
    text: string,
    values: ReadonlyArray<unknown> = [],
  ): Promise<QueryResult<R>> {
    return client.query<R>(text, values as unknown[]);
  }
}
