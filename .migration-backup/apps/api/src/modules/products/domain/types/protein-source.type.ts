import type { Uuid } from '@types';
import type { ProteinOrigin } from '../enums';

/** Slug-only projection of a `protein_sources` row. */
export interface ProteinSource {
  readonly id: Uuid;
  readonly slug: string;
  readonly name: string;
  readonly origin: ProteinOrigin | null;
  readonly isActive: boolean;
}
