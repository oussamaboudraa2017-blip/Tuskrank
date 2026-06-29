import type { RawImportRow, ParseResult } from '../types';
import { ImportParsingFailedError } from '../errors';

/**
 * Parse a JSON string into structured rows.
 *
 * Supports:
 * - Array of objects: `[{ "name": "..." }, ...]`
 * - Object with a rows/data/items key: `{ "rows": [...] }`
 * - Single object (wrapped into array): `{ "name": "..." }`
 */
export function parseJson(content: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new ImportParsingFailedError('invalid JSON syntax');
  }

  let items: Record<string, unknown>[];

  if (Array.isArray(parsed)) {
    items = parsed as Record<string, unknown>[];
  } else if (typeof parsed === 'object' && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    // Check for wrapper keys
    for (const key of ['rows', 'data', 'items', 'records', 'entries']) {
      if (Array.isArray(obj[key])) {
        items = obj[key] as Record<string, unknown>[];
        break;
      }
    }
    if (!items!) {
      // Single object — wrap in array
      items = [obj];
    }
  } else {
    throw new ImportParsingFailedError('JSON must be an array of objects or an object with a rows/data/items key');
  }

  if (items.length === 0) {
    throw new ImportParsingFailedError('JSON contains no data rows');
  }

  // Collect all unique headers
  const headerSet = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) {
      headerSet.add(key.toLowerCase());
    }
  }
  const headers = Array.from(headerSet);

  // Normalize rows
  const rows: RawImportRow[] = items.map((item) => {
    const row: RawImportRow = {};
    for (const header of headers) {
      const raw = item[header] ?? item[Object.keys(item).find((k) => k.toLowerCase() === header) ?? ''];
      row[header] = normalizeJsonValue(raw);
    }
    return row;
  });

  return { rows, totalRows: rows.length, headers };
}

/**
 * Normalize a JSON value to a consistent JS type.
 */
function normalizeJsonValue(value: unknown): string | number | boolean | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    // Boolean
    const lower = trimmed.toLowerCase();
    if (lower === 'true' || lower === 'yes') return true;
    if (lower === 'false' || lower === 'no') return false;

    // Number
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) return num;
    }

    return trimmed;
  }

  // Objects/arrays → JSON string
  return JSON.stringify(value);
}
