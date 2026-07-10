import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

const SENSITIVE_FIELDS = new Set(['password', 'authorization', 'cookie', 'token', 'secret', 'creditCard']);

function redactSensitive(body: unknown): string {
  if (!body || typeof body !== 'object') return JSON.stringify(body);
  const obj = { ...body as Record<string, unknown> };
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      obj[key] = '[REDACTED]';
    }
  }
  return JSON.stringify(obj);
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = (req as any).user ?? {};
    const userId = user.id ?? 'anonymous';
    const userEmail = user.email ?? '';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';
    const path = req.route?.path ?? req.path;
    const body = redactSensitive(req.body);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const entry = {
            userId,
            userEmail,
            method,
            path,
            body,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString(),
            ip,
          };
          this.logger.log(entry, 'AuditLog');
        },
        error: (_err: Error) => {
          const res = context.switchToHttp().getResponse<Response>();
          const entry = {
            userId,
            userEmail,
            method,
            path,
            body,
            statusCode: res.statusCode ?? 500,
            timestamp: new Date().toISOString(),
            ip,
          };
          this.logger.log(entry, 'AuditLog');
        },
      }),
    );
  }
}
