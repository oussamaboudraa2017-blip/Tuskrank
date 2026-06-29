/**
 * Wire / contract DTOs for the Products module.
 *
 * - `BrandSummaryDto` → `brand-summary.dto.ts`
 * - `ProductScoreSummaryDto` → `product-score-summary.dto.ts`
 * - `ProductListItemDto` → list row used by `GET /api/v1/products`
 * - `ProductDetailDto` (and the smaller shapes it composes) → `product-detail.dto.ts`
 * - `ProductIngredientsPanelDto` → `product-ingredients.dto.ts`
 * - `ProductsPage` → `products-page.dto.ts` (the list envelope payload)
 * - `CreateProductDto` → admin create
 * - `UpdateProductDto` → admin update
 * - `ListProductsQueryDto` → public list query params
 */

export * from './brand-summary.dto';
export * from './product-score-summary.dto';
export * from './product-list-item.dto';
export * from './product-detail.dto';
export * from './product-ingredients.dto';
export * from './products-page.dto';
export * from './create-product.dto';
export * from './update-product.dto';
export * from './list-products-query.dto';
