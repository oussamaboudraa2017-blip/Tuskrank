/**
 * Module-private entity types. Mirrors `database/schema.sql` row shapes.
 *
 * No business logic lives here. Concrete repositories extend
 * `BaseRepository<T>` and use these types as row shapes.
 */

export * from './brand.entity';
export * from './food-form.entity';
export * from './nutrition-profile.entity';
export * from './product-ingredient.entity';
export * from './product-image.entity';
export * from './product.entity';
