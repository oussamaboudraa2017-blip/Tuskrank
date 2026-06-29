import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResponse, PaginatedResponseMeta } from './pagination.dto';

/**
 * Uniform success envelope for all API responses.
 *
 * Pattern intentionally separates `data` and `meta` so future
 * extensions (rate-limits, trace ids, timestamps) live in `meta` without
 * restructuring `data`.
 */
export interface ResponseMeta {
  /** Server time (ISO 8601). */
  timestamp: string;
  /** Stable trace id (same as `x-request-id` header). */
  traceId?: string;
  /** Service instance identifier (useful for multi-instance logs). */
  instanceId?: string;
  /** Optional API version that served the response. */
  apiVersion?: string;
}

export class ApiSuccessResponseDto<T> {
  @ApiProperty({ description: 'Boolean ok signal.', example: true })
  success: true = true as const;

  @ApiProperty({ description: 'Response payload.' })
  data!: T;

  @ApiProperty({ description: 'Top-level metadata.' })
  meta!: ResponseMeta;
}

export class ApiPaginatedResponseDto<T> {
  @ApiProperty({ description: 'Boolean ok signal.', example: true })
  success: true = true as const;

  @ApiProperty({ description: 'Items for the current page.' })
  data!: T[];

  @ApiProperty({ description: 'Pagination metadata.' })
  meta!: PaginatedResponseMeta & ResponseMeta;
}

/**
 * Helper to build a typed success response.
 */
export function okResponse<T>(data: T, meta: Partial<ResponseMeta> = {}): ApiSuccessResponseDto<T> {
  return {
    success: true as const,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function paginatedResponse<T>(
  response: PaginatedResponse<T>,
  meta: Partial<ResponseMeta> = {},
): Omit<ApiPaginatedResponseDto<T>, 'success'> {
  return {
    data: response.data,
    meta: {
      ...response.meta,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  } as Omit<ApiPaginatedResponseDto<T>, 'success'>;
}
