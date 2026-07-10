/**
 * Products domain — single entry point.
 *
 * Structure:
 *   - `enums/`         Closed value sets (PetType, SortField, …).
 *   - `constants/`    SQL-derived bounds, frozen lookup lists, defaults.
 *   - `types/`         Read-side aggregates (Product, Brand, ProductImage, …).
 *   - `value-objects/` Pure immutable value types (ProductSlug, Score, …).
 *   - `errors/`        Domain errors mapped to the API error envelope.
 *   - `interfaces/`    Filter / sort / search contracts.
 *   - `validation/`    Zod schemas (CreateProduct, ListProducts, …).
 *   - `product.entity.ts` Aggregate root.
 *   - `mapping/`       DTO ↔ entity ↔ DB mappers (Task 3).
 *   - `repositories/`  Repository interfaces (Task 3).
 */

export * as Enums from './enums';
export * as Constants from './constants';
export * as Types from './types';
export * as ValueObjects from './value-objects';
export * as Errors from './errors';
export * as Interfaces from './interfaces';
export * as Validation from './validation';
export * as Mapping from './mapping';
export * as Repositories from './repositories';
export { ProductEntity } from './product.entity';
export type { ProductConstructionInput } from './product.entity';
