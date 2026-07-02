/**
 * Wire / contract interfaces for the Products module.
 *
 * These types describe what reaches the controller boundary — they
 * are inputs to (and outputs from) the upcoming `ListProductsQueryDto`
 * (admin form DTO) and the upcoming `ListProductsResponseDto`. They
 * remain loose on purpose; validation happens at the DTO.
 */

export * from './list-products.sort';
export * from './list-products.filters';
export * from './list-products.params';
