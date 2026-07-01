import { asUuid } from '@types';
import type { Uuid } from '@types';

/**
 * Parse and validate a string as a branded Uuid.
 * Throws if the value is not a valid UUID.
 *
 * @param value  - The raw string (e.g. from a request param or DTO).
 * @param paramName - Name used in the error message for context.
 */
export function parseUuid(value: string, paramName = 'id'): Uuid {
  try {
    return asUuid(value);
  } catch {
    throw new TypeError(`Invalid ${paramName}: must be a valid UUID`);
  }
}