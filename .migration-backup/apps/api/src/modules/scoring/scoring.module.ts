import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database';
import { ScoringController } from './scoring.controller';
import { ScoringService } from './scoring.service';
import { ScoringRepository } from './repositories/scoring.repository';
import { ScoringEngineProvider } from './scoring.engine.provider';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [ScoringController],
  providers: [ScoringRepository, ScoringEngineProvider, ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
