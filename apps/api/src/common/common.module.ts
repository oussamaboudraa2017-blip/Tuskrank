import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { RequestLoggingInterceptor } from './logger/request-logging.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { EnvelopeInterceptor } from './interceptors/envelope.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { LoggerCoreModule } from './logger/logger.module';
import { APP_CONSTANTS } from './constants/app.constants';

/**
 * Common cross-cutting module.
 *
 * Global providers:
 *   * exception filter             — uniform error envelope
 *   * request-id middleware        — first-touch request id assignment
 *   * request logging interceptor  — request-id propagation, latency
 *   * timeout interceptor         — per-route timeout via @TimeoutMs()
 *   * envelope interceptor        — idempotent envelope wrapping
 *   * throttler guard             — global rate limit (per-IP, in-memory)
 *   * Supabase auth guard         — JWT verification (use @Public() to opt out)
 *   * RolesGuard                   — opt-in via @UseGuards(RolesGuard)
 *
 * Guard order: Nest runs APP_GUARD entries in the order they are
 * registered. SupabaseAuthGuard is registered first, then
 * ThrottlerGuard. We want this: anonymous traffic is rejected
 * before we count it against a per-IP quota.
 */
@Global()
@Module({
  imports: [
    LoggerCoreModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        {
          ttl: cfg.get<number>('RATE_LIMIT_WINDOW_MS', 60_000),
          limit: cfg.get<number>('RATE_LIMIT_MAX', 120),
        },
      ],
    }),
  ],
  providers: [
    SupabaseAuthGuard,
    RolesGuard,
    RequestLoggingInterceptor,
    TimeoutInterceptor,
    EnvelopeInterceptor,
    GlobalExceptionFilter,
    {
      provide: APP_FILTER,
      useExisting: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useExisting: SupabaseAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: EnvelopeInterceptor,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
  ],
  exports: [
    LoggerCoreModule,
    SupabaseAuthGuard,
    RolesGuard,
    RequestLoggingInterceptor,
    EnvelopeInterceptor,
    TimeoutInterceptor,
    GlobalExceptionFilter,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

// Re-export constants for callers
export { APP_CONSTANTS };
