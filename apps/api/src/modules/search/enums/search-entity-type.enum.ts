/**
 * Entity types that can be searched.
 *
 * Mirrors the `ck_search_keywords_entity` CHECK constraint
 * in `database/schema.sql` (`search_keywords.entity_type`).
 */
export enum SearchEntityType {
  Product = 'product',
  Brand = 'brand',
  Ingredient = 'ingredient',
  General = 'general',
}
