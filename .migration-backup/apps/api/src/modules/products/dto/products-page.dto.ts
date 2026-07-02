import { ApiProperty } from '@nestjs/swagger';
import { ProductListItemDto } from './product-list-item.dto';

/**
 * Paginated list envelope returned by `GET /api/v1/products`.
 *
 * Sits on top of the global `PaginatedResponse<T>` shape — see
 * `common/dto/pagination.dto.ts` for the meta block (`page`,
 * `limit`, `total`, `links`, …). This DTO only carries the items.
 *
 * The actual envelope (`{ success, data, meta }`) is composed in the
 * controller via `paginatedResponse(...)` from `common/dto`.
 */
export class ProductsPage {
  @ApiProperty({
    description: 'List items on the current page.',
    type: () => [ProductListItemDto],
  })
  data!: ProductListItemDto[];
}
