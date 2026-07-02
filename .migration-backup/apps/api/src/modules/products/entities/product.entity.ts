import type { Uuid } from '@types';
import type { BrandEntity } from './brand.entity';
import type { FoodFormEntity, ProteinSourceEntity } from './food-form.entity';

/**
 * Internal representation of a row in the `products` table.
 *
 * Mirrors `database/schema.sql` (`products`):
 *   id                          uuid PRIMARY KEY
 *   brand_id                    uuid NOT NULL REFERENCES brands(id) ON DELETE RESTRICT
 *   name                        text NOT NULL
 *   slug                        text NOT NULL  (UNIQUE per brand_id)
 *   description                 text NULL
 *   upc                         text NULL
 *   sku                         text NULL
 *   package_size_grams          numeric(10,2) NULL
 *   package_size_label          text NULL
 *   food_form_id                uuid NULL  REFERENCES food_forms(id) ON DELETE RESTRICT
 *   primary_protein_source_id   uuid NULL  REFERENCES protein_sources(id) ON DELETE RESTRICT
 *   is_active                   boolean NOT NULL DEFAULT true
 *   published_at                timestamptz NULL
 *   created_at                  timestamptz NOT NULL DEFAULT now()
 *   updated_at                  timestamptz NOT NULL DEFAULT now()
 *   deleted_at                  timestamptz NULL
 *
 * Service-layer / repository-layer type. NOT exposed on the wire.
 * The list-row shape lives in `dto/product-list-item.dto.ts` and the
 * detail shape lives in `dto/product-detail.dto.ts`.
 *
 * `brand`, `foodForm`, `primaryProteinSource` are *resolved* entities when
 * the row is joined. They are nullable at the SQL level but, in the
 * Products domain, we always load a product with its brand attached.
 * The nullable fields reflect weak FK semantics (RESTRICT) plus a
 * soft-deleted flag on the lookup tables.
 */
export interface ProductEntity {
  readonly id: Uuid;
  readonly brandId: Uuid;
  readonly brand?: BrandEntity | undefined;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly upc: string | null;
  readonly sku: string | null;
  readonly packageSizeGrams: string | null;
  readonly packageSizeLabel: string | null;
  readonly foodFormId: Uuid | null;
  readonly foodForm?: FoodFormEntity | null | undefined;
  readonly primaryProteinSourceId: Uuid | null;
  readonly primaryProteinSource?: ProteinSourceEntity | null | undefined;
  readonly isActive: boolean;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
