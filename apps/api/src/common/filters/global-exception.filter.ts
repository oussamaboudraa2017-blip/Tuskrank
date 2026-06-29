import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { APP_CONSTANTS } from '../constants/app.constants';
import {
  ApiError,
  toApiErrorPayload,
} from '../errors/api-error';

/**
 * Global exception filter.
 *
 * Converts every thrown value into the { success:false, error:{code,...} }
 * envelope. The implementation is intentionally deterministic and
 * never echoes implementation detail (no stack traces in production).
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string }>();
    const res = ctx.getResponse<Response>();
    const traceId = req.id;

    const { status, payload } = this.normalize(exception, traceId);

    if (status >= 500) {
      this.logger.error(
        `[${payload.code}] ${payload.message} trace=${traceId}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${payload.code}] ${payload.message} trace=${traceId}`,
      );
    }

    res.status(status).json({
      success: false,
      error: payload,
      meta: {
        timestamp: new Date().toISOString(),
        traceId,
      },
    });
  }

  private normalize(
    exception: unknown,
    traceId?: string,
  ): { status: number; payload: ReturnType<typeof toApiErrorPayload> } {
    if (exception instanceof ApiError) {
      return { status: exception.httpStatus, payload: toApiErrorPayload(exception, traceId) };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return {
          status,
          payload: {
            code: this.codeForStatus(status),
            message: response,
            traceId,
          },
        };
      }
      const body = response as Record<string, unknown> | undefined;
      return {
        status,
        payload: {
          code:
            (typeof body?.error === 'string' && (body.error as string)) ||
            this.codeForStatus(status),
          message:
            (Array.isArray(body?.message)
              ? (body.message as string[]).join('; ')
              : (body?.message as string)) || exception.message,
          details:
            (body?.details as Record<string, unknown> | undefined) ?? undefined,
          traceId,
        },
      };
    }
    // Unknown error — do not leak stack traces or implementation details.
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: APP_CONSTANTS.ERROR_CODES.INTERNAL,
        message: 'Internal server error',
        traceId,
      },
    };
  }

  private codeForStatus(status: number): string {
    if (status === HttpStatus.BAD_REQUEST) return APP_CONSTANTS.ERROR_CODES.VALIDATION;
    if (status === HttpStatus.UNAUTHORIZED) return APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED;
    if (status === HttpStatus.FORBIDDEN) return APP_CONSTANTS.ERROR_CODES.FORBIDDEN;
    if (status === HttpStatus.NOT_FOUND) return APP_CONSTANTS.ERROR_CODES.NOT_FOUND;
    if (status === HttpStatus.CONFLICT) return APP_CONSTANTS.ERROR_CODES.CONFLICT;
    if (status === HttpStatus.UNPROCESSABLE_ENTITY)
      return APP_CONSTANTS.ERROR_CODES.UNPROCESSABLE;
    if (status === HttpStatus.TOO_MANY_REQUESTS) return APP_CONSTANTS.ERROR_CODES.RATE_LIMITED;
    if (status === HttpStatus.REQUEST_TIMEOUT) return APP_CONSTANTS.ERROR_CODES.TIMEOUT;
    if (status === HttpStatus.PAYLOAD_TOO_LARGE) return APP_CONSTANTS.ERROR_CODES.PAYLOAD_TOO_LARGE;
    if (status === HttpStatus.SERVICE_UNAVAILABLE)
      return APP_CONSTANTS.ERROR_CODES.DATABASE_UNAVAILABLE;
    if (status === HttpStatus.BAD_GATEWAY) return APP_CONSTANTS.ERROR_CODES.UPSTREAM_FAILURE;
    return APP_CONSTANTS.ERROR_CODES.INTERNAL;
  }
}
