import { Module } from '@nestjs/common';
import { AppConfigModule } from '@config';
import { CommonModule } from '@common';
import { DatabaseModule } from '@database';
import { AuthModule } from '@modules/auth';
import { HealthModule } from '@modules/health';

/**
 * Top-level feature graph.
 *
 * `CommonModule` provides cross-cutting concerns
 * (logger, throttler, exception filter, interceptors, guards, middleware).
 *
 * Domain modules (Products, Search, Scoring, AI, Admin) land in
 * Sprints 2B+.
 */
@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
  ],
})
export class AppModule {}
