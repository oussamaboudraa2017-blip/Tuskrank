import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { APP_CONSTANTS } from '../constants/app.constants';

/**
 * Lightweight middleware that ensures every request has a stable
 * request id. The id is read from the inbound header (gateway-
 * provided) or generated otherwise. The same id is later used by
 * the RequestLoggingInterceptor and emitted on the response so
 * callers can correlate end-to-end.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    if (req.id) {
      res.setHeader(APP_CONSTANTS.HEADERS.REQUEST_ID, req.id);
      next();
      return;
    }
    const incoming = req.headers[APP_CONSTANTS.HEADERS.REQUEST_ID];
    const requestId =
      (Array.isArray(incoming) ? incoming[0] : incoming)?.toString() ||
      randomUUID();
    req.id = requestId;
    res.setHeader(APP_CONSTANTS.HEADERS.REQUEST_ID, requestId);
    next();
  }
}
