import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { okResponse, ApiSuccessResponseDto } from '../dto';

/**
 * Default envelope wrapper for handlers that don't paginate.
 *
 * Idempotent: if the handler already returned a `{ success:true, data, meta }`
 * envelope, this interceptor passes it through unchanged. Otherwise
 * it wraps the value via `okResponse`.
 */
@Injectable()
export class EnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccessResponseDto<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponseDto<T>> {
    return next.handle().pipe(
      map((data: T) => {
        if (isAlreadyEnveloped(data)) {
          return data as unknown as ApiSuccessResponseDto<T>;
        }
        const req = _ctx.switchToHttp().getRequest<{ id?: string; apiVersion?: string }>();
        return okResponse(data, {
          traceId: req?.id,
          apiVersion: req?.apiVersion,
        });
      }),
    );
  }
}

function isAlreadyEnveloped(value: unknown): value is { success: true; data: unknown; meta: unknown } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v['success'] === true &&
    'data' in v &&
    'meta' in v &&
    typeof v['meta'] === 'object' &&
    v['meta'] !== null
  );
}
