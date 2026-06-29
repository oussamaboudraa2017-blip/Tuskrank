import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, timeout } from 'rxjs';
import { RequestTimeoutException } from '../errors/api-error';

const DEFAULT_TIMEOUT_MS = 10_000;
const MIN_TIMEOUT_MS = 100;
const MAX_TIMEOUT_MS = 5 * 60_000;

/**
 * Per-route timeout interceptor.
 *
 * Reads timeout from `@TimeoutMs(ms)` decorator metadata (via the
 * reflector). Falls back to a default of 10s.
 *
 *   @TimeoutMs(500)
 *   @Get('heavy')
 *   heavy() { ... }
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const decorated = this.reflector.getAllAndOverride<number | undefined>(
      TIMEOUT_MS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    const ms = this.sanitise(decorated ?? DEFAULT_TIMEOUT_MS);

    return next.handle().pipe(
      timeout(ms),
      catchError((err: unknown) => {
        if (err && (err as { name?: string }).name === 'TimeoutError') {
          throw new RequestTimeoutException(`Request exceeded ${ms}ms`, {
            timeoutMs: ms,
          });
        }
        throw err;
      }),
    );
  }

  private sanitise(raw: number): number {
    if (typeof raw !== 'number' || Number.isNaN(raw) || raw <= 0) {
      return DEFAULT_TIMEOUT_MS;
    }
    return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, raw));
  }
}

export const TIMEOUT_MS_KEY = 'request:timeout_ms';
