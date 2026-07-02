import type { RawImportRow, ParseResult } from '../types';
import { ImportParsingFailedError } from '../errors';

/**
 * Parse a CSV string into structured rows.
 *
 * Handles:
 * - Quoted fields (double quotes)
 * - Commas inside quoted fields
 * - Newlines inside quoted fields
 * - Escaped quotes ("")
 * - Leading/trailing whitespace trimming
 * - Empty rows (skipped)
 * - Boolean values: true/false/yes/no/1/0
 */
export function parseCsv(content: string): ParseResult {
  const lines = splitCsvLines(content);
  if (lines.length < 2) {
    throw new ImportParsingFailedError('CSV must contain a header row and at least one data row');
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  if (headers.length === 0) {
    throw new ImportParsingFailedError('CSV has no headers');
  }

  const rows: RawImportRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') continue;

    try {
      const values = parseCsvLine(line);
      const row: RawImportRow = {};
      for (let j = 0; j < headers.length; j++) {
        const raw = values[j]?.trim() ?? '';
        row[headers[j]] = parseCsvValue(raw);
      }
      rows.push(row);
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (errors.length > 0 && rows.length === 0) {
    throw new ImportParsingFailedError(errors.join('; '));
  }

  return { rows, totalRows: rows.length, headers };
}

/**
 * Split CSV content into lines, respecting quoted fields.
 */
function splitCsvLines(content: string): string[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (ch === '"') {
      if (inQuotes && i + 1 < content.length && content[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else if (ch === '\r' && !inQuotes) {
      // skip \r, handle \r\n
    } else {
      current += ch;
    }
  }

  if (current.trim() !== '') {
    lines.push(current);
  }

  return lines;
}

/**
 * Parse a single CSV line into field values.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }

  fields.push(current);
  return fields;
}

/**
 * Parse a raw CSV value into an appropriate JS type.
 */
function parseCsvValue(raw: string): string | number | boolean | null {
  if (raw === '' || raw === undefined) return null;

  // Boolean
  const lower = raw.toLowerCase();
  if (lower === 'true' || lower === 'yes' || lower === '1') return true;
  if (lower === 'false' || lower === 'no' || lower === '0') return false;

  // Number (only if it looks like a number)
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    const num = Number(raw);
    if (!Number.isNaN(num)) return num;
  }

  return raw;
}
