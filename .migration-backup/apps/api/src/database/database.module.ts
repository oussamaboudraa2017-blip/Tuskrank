import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { TransactionHelper } from './transaction.helper';
import { BaseRepository } from './base.repository';
import { CacheService } from '../shared/cache.service';

@Module({
  imports: [ConfigModule],
  providers: [DatabaseService, TransactionHelper, BaseRepository, CacheService],
  exports: [DatabaseService, TransactionHelper, BaseRepository, CacheService],
})
export class DatabaseModule {}
