import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController, PostgresHealthIndicator } from './health.controller';
import { DatabaseModule } from '@database';

/**
 * Health module:
 *   * GET /api/v1/health         (liveness + readiness)
 *   * GET /api/v1/health/live    (liveness only — for kube livenessProbe)
 *   * GET /api/v1/health/ready   (readiness only — for kube readinessProbe)
 *
 * Postsgres probe runs through DatabaseService.healthcheck().
 */
@Module({
  imports: [TerminusModule, DatabaseModule],
  controllers: [HealthController],
  providers: [PostgresHealthIndicator],
  exports: [PostgresHealthIndicator],
})
export class HealthModule {}
