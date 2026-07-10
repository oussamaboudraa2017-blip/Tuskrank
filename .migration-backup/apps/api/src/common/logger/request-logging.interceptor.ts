import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * NestJS interceptor: times each HTTP request and emits `x-request-time-ms`
 * on the response. Request id is owned by `RequestIdMiddleware`; this
 * interceptor only annotates latency.
 *
 * Logging itself is delegated to `nestjs-pino` (see `logger.config.ts`).
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request & { id?: string }>();
    const res = http.getResponse<Response>();

    const requestId = req.id;

    const start = process.hrtime.bigint();
    return new Observable((subscriber) => {
      next.handle().subscribe({
        next: (value) => subscriber.next(value),
        error: (err) => {
          this.finalize(res, start);
          subscriber.error(err);
        },
        complete: () => {
          this.finalize(res, start);
          subscriber.complete();
        },
      });
    });
    // Reference unused vars so future additions compile clean.
    void requestId;
    void req;
  }

  private finalize(res: Response, start: bigint): void {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    res.setHeader(
      APP_CONSTANTS.HEADERS.REQUEST_TOTAL_TIME_MS,
      elapsedMs.toFixed(2),
    );
  }
}
