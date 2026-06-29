import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { TransactionHelper } from './transaction.helper';
import { BaseRepository } from './base.repository';

/**
 * Database module:
 *   * owns the pg Pool lifecycle,
 *   * exposes `DatabaseService` (provider + healthcheck),
 *   * exposes `TransactionHelper` for repository code,
 *   * exports `BaseRepository` as the canonical building block.
 *
 * Sprint 2A does NOT define business repositories. Each domain
 * module (Products, Search, Scoring, AI, Admin) creates its own
 * `extends BaseRepository<...>` inside its module folder.
 */
@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, TransactionHelper, BaseRepository],
  exports: [DatabaseService, TransactionHelper, BaseRepository],
})
export class DatabaseModule {}
