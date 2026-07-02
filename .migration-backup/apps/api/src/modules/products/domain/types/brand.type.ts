import type { Uuid } from '@types';

/**
 * Brand aggregate (read-side).
 *
 * The full brand domain (with audits, certifications, transparency
 * reports) lives in the future `brands` module; this is a slim
 * read projection for product-context use. Mutable brand lifecycle
 * (create / update / soft-delete) is the responsibility of the
 * Brands module.
 */
export interface Brand {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
  readonly description: string | null;
  readonly logoImageUrl: string | null;
  readonly isActive: boolean;
}
