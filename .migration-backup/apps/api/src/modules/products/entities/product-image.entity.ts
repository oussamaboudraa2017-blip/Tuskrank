import type { Uuid } from '@types';

/**
 * Internal representation of a row in the `product_images` table.
 *
 * Mirrors `database/schema.sql` (`product_images`):
 *   id           uuid PRIMARY KEY
 *   product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE
 *   storage_path text NOT NULL
 *   public_url   text NOT NULL
 *   alt_text     text NULL
 *   width_px     integer NULL
 *   height_px    integer NULL
 * bytes           bigint NULL
 * mime_type       text NULL
 *   sort_order   integer NOT NULL DEFAULT 0
 *   is_primary   boolean NOT NULL DEFAULT false
 *   created_at, updated_at, deleted_at
 */
export interface ProductImageEntity {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly storagePath: string;
  readonly publicUrl: string;
  readonly altText: string | null;
  readonly widthPx: number | null;
  readonly heightPx: number | null;
  readonly bytes: number | null;
  readonly mimeType: string | null;
  readonly sortOrder: number;
  readonly isPrimary: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}
