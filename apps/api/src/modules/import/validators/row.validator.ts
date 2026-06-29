import type { RawImportRow, RowValidationResult, RowValidationError, RowValidationWarning } from '../types';
import { IMPORT_BOUNDS } from '../constants';

/* ------------------------------------------------------------------
 * Brand validation
 * ------------------------------------------------------------------ */

export function validateBrandRow(row: RawImportRow, rowIndex: number): RowValidationResult {
  const errors: RowValidationError[] = [];
  const warnings: RowValidationWarning[] = [];

  // Required: name
  const name = toString(row.name);
  if (!name || name.length === 0) {
    errors.push({ field: 'name', code: 'REQUIRED', message: 'name is required' });
  } else if (name.length > IMPORT_BOUNDS.nameMaxLength) {
    errors.push({ field: 'name', code: 'MAX_LENGTH', message: `name must be <= ${IMPORT_BOUNDS.nameMaxLength} characters` });
  }

  // Optional: manufacturer
  const manufacturer = toString(row.manufacturer);
  if (manufacturer && manufacturer.length > 200) {
    errors.push({ field: 'manufacturer', code: 'MAX_LENGTH', message: 'manufacturer must be <= 200 characters' });
  }

  // Optional: country_code
  const countryCode = toString(row.country_code);
  if (countryCode && !IMPORT_BOUNDS.countryCodeRe.test(countryCode)) {
    errors.push({ field: 'country_code', code: 'INVALID_FORMAT', message: 'country_code must be 2-letter ISO-3166 alpha-2 (e.g., US, CA)' });
  }

  // Optional: website_url
  const websiteUrl = toString(row.website_url);
  if (websiteUrl && websiteUrl.length > IMPORT_BOUNDS.websiteUrlMaxLength) {
    errors.push({ field: 'website_url', code: 'MAX_LENGTH', message: 'website_url too long' });
  }

  // Optional: description
  const description = toString(row.description);
  if (description && description.length > IMPORT_BOUNDS.descriptionMaxLength) {
    warnings.push({ field: 'description', code: 'TRUNCATED', message: `description truncated from ${description.length} to ${IMPORT_BOUNDS.descriptionMaxLength} characters` });
  }

  // Optional: logo_image_url
  const logoImageUrl = toString(row.logo_image_url);
  if (logoImageUrl && logoImageUrl.length > IMPORT_BOUNDS.logoImageUrlMaxLength) {
    warnings.push({ field: 'logo_image_url', code: 'TRUNCATED', message: 'logo_image_url too long, may be truncated' });
  }

  return { rowIndex, valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------
 * Product validation
 * ------------------------------------------------------------------ */

export function validateProductRow(row: RawImportRow, rowIndex: number): RowValidationResult {
  const errors: RowValidationError[] = [];
  const warnings: RowValidationWarning[] = [];

  // Required: brand_name
  const brandName = toString(row.brand_name);
  if (!brandName || brandName.length === 0) {
    errors.push({ field: 'brand_name', code: 'REQUIRED', message: 'brand_name is required' });
  }

  // Required: name
  const name = toString(row.name);
  if (!name || name.length === 0) {
    errors.push({ field: 'name', code: 'REQUIRED', message: 'name is required' });
  } else if (name.length > IMPORT_BOUNDS.nameMaxLength) {
    errors.push({ field: 'name', code: 'MAX_LENGTH', message: `name must be <= ${IMPORT_BOUNDS.nameMaxLength} characters` });
  }

  // Optional: upc
  const upc = toString(row.upc);
  if (upc) {
    const cleaned = upc.replace(/[\s-]/g, '');
    if (!IMPORT_BOUNDS.upcRe.test(cleaned)) {
      errors.push({ field: 'upc', code: 'INVALID_FORMAT', message: 'upc must be 8-14 digits' });
    } else if (!IMPORT_BOUNDS.upcExactLengths.includes(cleaned.length as 8 | 12 | 13 | 14)) {
      errors.push({ field: 'upc', code: 'INVALID_LENGTH', message: 'upc must be exactly 8, 12, 13, or 14 digits' });
    }
  }

  // Optional: package_size_grams
  const packageSizeGrams = toNumber(row.package_size_grams);
  if (packageSizeGrams !== null && packageSizeGrams <= 0) {
    errors.push({ field: 'package_size_grams', code: 'INVALID_VALUE', message: 'package_size_grams must be > 0' });
  } else if (packageSizeGrams !== null && packageSizeGrams > IMPORT_BOUNDS.packageSizeMaxGrams) {
    warnings.push({ field: 'package_size_grams', code: 'OUT_OF_RANGE', message: `package_size_grams ${packageSizeGrams} seems unusually large` });
  }

  // Optional: food_form
  const foodForm = toString(row.food_form);
  const validFoodForms = ['kibble', 'wet', 'raw', 'freeze-dried', 'dehydrated', 'soft', 'topper', 'mixer', 'treat', 'supplement'];
  if (foodForm && !validFoodForms.includes(foodForm.toLowerCase())) {
    warnings.push({ field: 'food_form', code: 'UNKNOWN_VALUE', message: `unknown food_form '${foodForm}', will be ignored` });
  }

  // Optional: primary_protein_source
  const proteinSource = toString(row.primary_protein_source);
  const validProteinSources = ['chicken', 'beef', 'lamb', 'salmon', 'tuna', 'turkey', 'duck', 'rabbit', 'venison', 'white-fish', 'egg', 'pea', 'lentil', 'soy', 'plant', 'insect'];
  if (proteinSource && !validProteinSources.includes(proteinSource.toLowerCase())) {
    warnings.push({ field: 'primary_protein_source', code: 'UNKNOWN_VALUE', message: `unknown protein_source '${proteinSource}', will be ignored` });
  }

  // Optional: nutrient percentages
  for (const field of ['protein_pct', 'fat_pct', 'fiber_pct', 'ash_pct', 'kcal_per_100g', 'moisture_pct', 'omega3_pct', 'omega6_pct', 'calcium_pct', 'phosphorus_pct']) {
    const val = toNumber(row[field]);
    if (val !== null && (val < 0 || val > IMPORT_BOUNDS.percentageMax)) {
      warnings.push({ field, code: 'OUT_OF_RANGE', message: `${field} value ${val} is outside expected range (0-100)` });
    }
  }

  // Optional: is_active
  // No validation needed — normalizeBoolean handles it

  return { rowIndex, valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------
 * Ingredient validation
 * ------------------------------------------------------------------ */

export function validateIngredientRow(row: RawImportRow, rowIndex: number): RowValidationResult {
  const errors: RowValidationError[] = [];
  const warnings: RowValidationWarning[] = [];

  // Required: name
  const name = toString(row.name);
  if (!name || name.length === 0) {
    errors.push({ field: 'name', code: 'REQUIRED', message: 'name is required' });
  } else if (name.length > IMPORT_BOUNDS.nameMaxLength) {
    errors.push({ field: 'name', code: 'MAX_LENGTH', message: `name must be <= ${IMPORT_BOUNDS.nameMaxLength} characters` });
  }

  // Optional: inci_name
  const inciName = toString(row.inci_name);
  if (inciName && inciName.length > IMPORT_BOUNDS.nameMaxLength) {
    warnings.push({ field: 'inci_name', code: 'TRUNCATED', message: 'inci_name too long' });
  }

  // Optional: canonical_name
  const canonicalName = toString(row.canonical_name);
  if (canonicalName && canonicalName.length > IMPORT_BOUNDS.nameMaxLength) {
    warnings.push({ field: 'canonical_name', code: 'TRUNCATED', message: 'canonical_name too long' });
  }

  // Optional: category
  const category = toString(row.category);
  const validCategories = ['animal-protein', 'plant-protein', 'fat-and-oil', 'carbohydrate', 'fiber', 'fruit', 'vegetable', 'additive', 'contested', 'other'];
  if (category && !validCategories.includes(category.toLowerCase())) {
    warnings.push({ field: 'category', code: 'UNKNOWN_VALUE', message: `unknown category '${category}', will be ignored` });
  }

  // Optional: description
  const description = toString(row.description);
  if (description && description.length > IMPORT_BOUNDS.descriptionMaxLength) {
    warnings.push({ field: 'description', code: 'TRUNCATED', message: 'description too long' });
  }

  // Optional booleans — no validation needed, normalizeBoolean handles them

  return { rowIndex, valid: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------ */

function toString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value !== 'string') return null;
  const str = value.trim().replace(/,/g, '');
  if (str === '') return null;
  const num = Number(str);
  return Number.isNaN(num) ? null : num;
}
