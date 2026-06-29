import type { RawImportRow, NormalizedBrandRow, NormalizedProductRow, NormalizedIngredientRow } from '../types';
import { NormalizeScope } from '../enums';
import {
  slugify,
  normalizeBrandName,
  normalizeIngredientName,
  normalizeCanonicalName,
  normalizeUpc,
  normalizeCountryCode,
  normalizeUrl,
  normalizePackageSizeLabel,
  parsePackageSizeToGrams,
  normalizeList,
  normalizeNumeric,
  normalizeBoolean,
  normalizeText,
} from '../normalizers';

/* ------------------------------------------------------------------
 * Brand mapper: RawImportRow → NormalizedBrandRow
 * ------------------------------------------------------------------ */

export function mapBrandRow(row: RawImportRow): NormalizedBrandRow {
  const name = normalizeBrandName(String(row.name ?? ''));
  return {
    name,
    slug: slugify(name),
    manufacturer: normalizeText(String(row.manufacturer ?? ''), NormalizeScope.Full) || null,
    countryCode: row.country_code ? normalizeCountryCode(String(row.country_code)) : null,
    websiteUrl: row.website_url ? normalizeUrl(String(row.website_url)) : null,
    description: normalizeText(String(row.description ?? ''), NormalizeScope.Full) || null,
    logoImageUrl: row.logo_image_url ? normalizeUrl(String(row.logo_image_url)) : null,
    isActive: normalizeBoolean(row.is_active, true),
  };
}

/* ------------------------------------------------------------------
 * Product mapper: RawImportRow → NormalizedProductRow
 * ------------------------------------------------------------------ */

export function mapProductRow(row: RawImportRow): NormalizedProductRow {
  const name = normalizeText(String(row.name ?? ''), NormalizeScope.Full);
  const packageSizeLabel = row.package_size_label
    ? normalizePackageSizeLabel(String(row.package_size_label))
    : null;
  const packageSizeGramsFromLabel = packageSizeLabel ? parsePackageSizeToGrams(packageSizeLabel) : null;
  const packageSizeGramsFromField = row.package_size_grams != null && typeof row.package_size_grams !== 'boolean'
    ? normalizeNumeric(row.package_size_grams)
    : null;

  return {
    brandName: normalizeBrandName(String(row.brand_name ?? '')),
    name,
    slug: slugify(name),
    description: normalizeText(String(row.description ?? ''), NormalizeScope.Full) || null,
    upc: row.upc ? normalizeUpc(String(row.upc)) : null,
    sku: normalizeText(String(row.sku ?? ''), NormalizeScope.Light) || null,
    packageSizeGrams: packageSizeGramsFromField ?? packageSizeGramsFromLabel,
    packageSizeLabel,
    foodForm: normalizeText(String(row.food_form ?? ''), NormalizeScope.Full) || null,
    primaryProteinSource: normalizeText(String(row.primary_protein_source ?? ''), NormalizeScope.Full) || null,
    petTypes: normalizeList(String(row.pet_types ?? '')),
    lifeStages: normalizeList(String(row.life_stages ?? '')),
    breedSizes: normalizeList(String(row.breed_sizes ?? '')),
    categories: normalizeList(String(row.categories ?? '')),
    claims: normalizeList(String(row.claims ?? '')),
    tags: normalizeList(String(row.tags ?? '')),
    kcalPer100g: row.kcal_per_100g != null && typeof row.kcal_per_100g !== 'boolean' ? normalizeNumeric(row.kcal_per_100g) : null,
    moisturePct: row.moisture_pct != null && typeof row.moisture_pct !== 'boolean' ? normalizeNumeric(row.moisture_pct) : null,
    proteinPct: row.protein_pct != null && typeof row.protein_pct !== 'boolean' ? normalizeNumeric(row.protein_pct) : null,
    fatPct: row.fat_pct != null && typeof row.fat_pct !== 'boolean' ? normalizeNumeric(row.fat_pct) : null,
    fiberPct: row.fiber_pct != null && typeof row.fiber_pct !== 'boolean' ? normalizeNumeric(row.fiber_pct) : null,
    ashPct: row.ash_pct != null && typeof row.ash_pct !== 'boolean' ? normalizeNumeric(row.ash_pct) : null,
    omega3Pct: row.omega3_pct != null && typeof row.omega3_pct !== 'boolean' ? normalizeNumeric(row.omega3_pct) : null,
    omega6Pct: row.omega6_pct != null && typeof row.omega6_pct !== 'boolean' ? normalizeNumeric(row.omega6_pct) : null,
    calciumPct: row.calcium_pct != null && typeof row.calcium_pct !== 'boolean' ? normalizeNumeric(row.calcium_pct) : null,
    phosphorusPct: row.phosphorus_pct != null && typeof row.phosphorus_pct !== 'boolean' ? normalizeNumeric(row.phosphorus_pct) : null,
    imageUrl: row.image_url ? normalizeUrl(String(row.image_url)) : null,
    isActive: normalizeBoolean(row.is_active, true),
  };
}

/* ------------------------------------------------------------------
 * Ingredient mapper: RawImportRow → NormalizedIngredientRow
 * ------------------------------------------------------------------ */

export function mapIngredientRow(row: RawImportRow): NormalizedIngredientRow {
  const name = normalizeIngredientName(String(row.name ?? ''));
  const canonicalNameRaw = row.canonical_name
    ? normalizeCanonicalName(String(row.canonical_name))
    : normalizeCanonicalName(name);

  return {
    name,
    slug: slugify(name),
    inciName: normalizeText(String(row.inci_name ?? ''), NormalizeScope.Full) || null,
    canonicalName: canonicalNameRaw,
    category: normalizeText(String(row.category ?? ''), NormalizeScope.Full) || null,
    description: normalizeText(String(row.description ?? ''), NormalizeScope.Full) || null,
    isAnimalDerived: normalizeBoolean(row.is_animal_derived, false),
    isCommonAllergen: normalizeBoolean(row.is_common_allergen, false),
    isControversial: normalizeBoolean(row.is_controversial, false),
    isActive: normalizeBoolean(row.is_active, true),
  };
}
