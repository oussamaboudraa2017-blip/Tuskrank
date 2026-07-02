import type { Uuid } from '@types';
import type { ProductImageSource } from '../enums';

/**
 * Read-only projection of a `product_images` row.
 *
 * "Read-only" is the contract: the products module does not write
 * images directly. The future brand-asset module owns create /
 * update / soft-delete and emits domain events.
 */
export interface ProductImage {
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
  readonly source: ProductImageSource;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
