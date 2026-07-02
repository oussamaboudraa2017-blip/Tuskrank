import { ImportEntityType, ImportFormat, DedupeStrategy, NormalizeScope } from '../enums';

/**
 * Constants for the Import module.
 */

export const IMPORT_BOUNDS = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  maxRowsPerImport: 10_000,
  maxBatchSize: 500,
  defaultBatchSize: 200,
  slugMinLength: 1,
  slugMaxLength: 200,
  nameMinLength: 1,
  nameMaxLength: 200,
  descriptionMaxLength: 8000,
  upcExactLengths: [8, 12, 13, 14] as const,
  upcRe: /^[0-9]{8,14}$/,
  slugRe: /^[a-z0-9-]+$/,
  countryCodeRe: /^[A-Z]{2}$/,
  websiteUrlMaxLength: 2048,
  logoImageUrlMaxLength: 2048,
  packageSizeMaxGrams: 100_000,
  nutrientAmountMax: 999_999.999999,
  percentageMax: 100,
} as const;

export const IMPORT_DEFAULTS = {
  format: ImportFormat.Csv,
  entityType: ImportEntityType.Products,
  dedupeStrategy: DedupeStrategy.Skip,
  normalizeScope: NormalizeScope.Full,
  batchSize: 200,
} as const;

/** CSV column headers expected per entity type. */
export const CSV_HEADERS: Record<ImportEntityType, readonly string[]> = {
  [ImportEntityType.Products]: [
    'brand_name',
    'name',
    'description',
    'upc',
    'sku',
    'package_size_grams',
    'package_size_label',
    'food_form',
    'primary_protein_source',
    'pet_types',
    'life_stages',
    'breed_sizes',
    'categories',
    'claims',
    'tags',
    'kcal_per_100g',
    'moisture_pct',
    'protein_pct',
    'fat_pct',
    'fiber_pct',
    'ash_pct',
    'omega3_pct',
    'omega6_pct',
    'calcium_pct',
    'phosphorus_pct',
    'image_url',
    'is_active',
  ],
  [ImportEntityType.Brands]: [
    'name',
    'manufacturer',
    'country_code',
    'website_url',
    'description',
    'logo_image_url',
    'is_active',
  ],
  [ImportEntityType.Ingredients]: [
    'name',
    'inci_name',
    'canonical_name',
    'category',
    'description',
    'is_animal_derived',
    'is_common_allergen',
    'is_controversial',
    'is_active',
  ],
};
