import type { Uuid } from '@types';

/**
 * Internal representation of a row in the `brands` table.
 *
 * Mirrors `database/schema.sql` (`brands`):
 *   id              uuid PRIMARY KEY
 *   name            text NOT NULL
 *   slug            text NOT NULL UNIQUE
 *   manufacturer    text NULL
 *   country_code    char(2) NULL
 *   website_url     text NULL
 *   description     text NULL
 *   logo_image_url  text NULL
 *   is_active       boolean NOT NULL DEFAULT true
 *   created_at      timestamptz NOT NULL DEFAULT now()
 *   updated_at      timestamptz NOT NULL DEFAULT now()
 *   deleted_at      timestamptz NULL
 *
 * Service-layer / repository-layer type. NOT exposed on the wire.
 * Wire shape lives in `dto/brand.dto.ts`.
 */
export interface BrandEntity {
  readonly id: Uuid;
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
  readonly description: string | null;
  readonly logoImageUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
