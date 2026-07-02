import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Request, Response } from 'express';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total') private readonly requestCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds') private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const route = req.route?.path ?? req.path ?? 'unknown';
    const method = req.method;

    const endTimer = this.requestDuration.startTimer({ method, route });

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          this.requestCounter.inc({ method, route, status: String(res.statusCode) });
          endTimer();
        },
        error: (_err: Error) => {
          const res = context.switchToHttp().getResponse<Response>();
          this.requestCounter.inc({ method, route, status: String(res.statusCode ?? 500) });
          endTimer();
        },
      }),
    );
  }
}
