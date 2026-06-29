import { NormalizeScope } from '../enums';

/* ------------------------------------------------------------------
 * Core normalization utilities
 * ------------------------------------------------------------------ */

/**
 * Generate a URL-safe slug from text.
 * Matches the database `fn_generate_slug()` behavior.
 *
 * Examples:
 *   "Royal Canin"            → "royal-canin"
 *   "Blue Buffalo Life!"     → "blue-buffalo-life"
 *   "  Hello   World  "      → "hello-world"
 *   "cat's Meow™"            → "cats-meow"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalize text: trim, collapse whitespace, lowercase.
 * Matches the database `fn_normalize_keyword()` behavior.
 */
export function normalizeText(text: string, scope: NormalizeScope = NormalizeScope.Full): string {
  if (scope === NormalizeScope.None) return text;

  let result = text.trim();

  if (scope === NormalizeScope.Full) {
    // Collapse multiple whitespace to single space
    result = result.replace(/\s+/g, ' ');
    // Lowercase
    result = result.toLowerCase();
  }

  return result;
}

/**
 * Normalize a brand name for display.
 * Trims, collapses whitespace, title-cases common patterns.
 *
 * Examples:
 *   "royal canin"     → "Royal Canin"
 *   "blue  buffalo"   → "Blue Buffalo"
 */
export function normalizeBrandName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Normalize an ingredient name.
 * Trims, collapses whitespace, title-cases.
 *
 * Examples:
 *   "chicken meal"    → "Chicken Meal"
 *   "  omega 3  fat"  → "Omega 3 Fat"
 */
export function normalizeIngredientName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Normalize a canonical ingredient name (lowercase, trimmed).
 * Used for deduplication matching.
 *
 * Examples:
 *   "Chicken Meal"    → "chicken meal"
 *   "  OMEGA 3  "     → "omega 3"
 */
export function normalizeCanonicalName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalize a UPC code: strip spaces, dashes, lowercase.
 *
 * Examples:
 *   "0-123456-789012" → "0123456789012"
 *   "123 456 789"     → "123456789"
 */
export function normalizeUpc(upc: string): string {
  return upc
    .replace(/[\s-]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Normalize a country code: uppercase, trim.
 *
 * Examples:
 *   "us"   → "US"
 *   " ca " → "CA"
 */
export function normalizeCountryCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Normalize a URL: trim, lowercase protocol and host.
 *
 * Examples:
 *   "  HTTPS://Example.COM/path  " → "https://example.com/path"
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url.trim();
  }
}

/**
 * Normalize a package size label: trim, collapse whitespace.
 *
 * Examples:
 *   "  5 lb "    → "5 lb"
 *   "2.5  kg"    → "2.5 kg"
 */
export function normalizePackageSizeLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ');
}

/**
 * Parse a package size label into grams.
 *
 * Supported units: g, kg, oz, lb, lbs
 *
 * Examples:
 *   "5 lb"    → 2267.96
 *   "2.5 kg"  → 2500
 *   "16 oz"   → 453.59
 *   "500 g"   → 500
 */
export function parsePackageSizeToGrams(label: string): number | null {
  const match = label.trim().match(/^([\d.]+)\s*(g|kg|oz|lb|lbs?)$/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  if (Number.isNaN(value) || value <= 0) return null;

  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'g': return value;
    case 'kg': return value * 1000;
    case 'oz': return value * 28.3495;
    case 'lb':
    case 'lbs': return value * 453.592;
    default: return null;
  }
}

/**
 * Normalize a comma-separated list of tags/categories/claims.
 *
 * Examples:
 *   "grain-free, high protein" → ["grain-free", "high protein"]
 *   "a;b;c"                    → ["a", "b", "c"]
 */
export function normalizeList(value: string | null | undefined): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') {
    return value
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter((s) => s.length > 0);
  }
  return [];
}

/**
 * Normalize a numeric string: trim, remove commas, parse.
 *
 * Examples:
 *   "1,234.56"  → 1234.56
 *   "  42  "    → 42
 *   ""          → null
 */
export function normalizeNumeric(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;

  const cleaned = String(value).trim().replace(/,/g, '');
  if (cleaned === '') return null;

  const num = Number(cleaned);
  return Number.isNaN(num) ? null : num;
}

/**
 * Normalize a boolean-like value.
 *
 * Examples:
 *   true / "true" / "yes" / "1" / 1  → true
 *   false / "false" / "no" / "0" / 0 → false
 *   null / undefined / ""             → defaultValue
 */
export function normalizeBoolean(
  value: string | number | boolean | null | undefined,
  defaultValue = false,
): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;

  const str = String(value).trim().toLowerCase();
  if (str === '' || str === 'null' || str === 'undefined') return defaultValue;
  if (str === 'true' || str === 'yes' || str === '1') return true;
  if (str === 'false' || str === 'no' || str === '0') return false;

  return defaultValue;
}
