import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { APP_CONSTANTS } from '../constants/app.constants';

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

/**
 * Query contract for any paginated endpoint.
 * Endpoint DTOs extend this with their own filters and projections.
 */
export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = APP_CONSTANTS.PAGINATION.DEFAULT_PAGE;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(APP_CONSTANTS.PAGINATION.MAX_LIMIT)
  @IsOptional()
  limit: number = APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT;

  @IsOptional()
  sortBy?: string;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.Desc;
}

export interface PaginationLinks {
  self: string;
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
}

export interface PaginatedResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  sortBy?: string | null;
  sortOrder?: SortOrder | null;
  links?: PaginationLinks;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedResponseMeta;
}

/**
 * Compute the basic meta fields for a paginated response. URL-aware
 * pagination link assembly happens in the API layer.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
  sortBy?: string,
  sortOrder?: SortOrder,
): PaginatedResponseMeta {
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const hasPrev = page > 1 && page <= totalPages;
  const hasNext = page < totalPages;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    sortBy: sortBy ?? null,
    sortOrder: sortOrder ?? null,
  };
}
