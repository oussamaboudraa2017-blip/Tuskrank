/**
 * Branded UUID type. Prevents accidentally passing a non-UUID string
 * where a UUID is expected.
 */

export type Uuid = string & { readonly __brand: 'Uuid' };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is Uuid {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function asUuid(value: string): Uuid {
  if (!isUuid(value)) {
    throw new TypeError(`Invalid UUID: ${value}`);
  }
  return value;
}
