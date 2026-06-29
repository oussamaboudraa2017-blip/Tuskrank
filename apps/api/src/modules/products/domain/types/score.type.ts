import type { Uuid } from '@types';

/**
 * Scoring aggregate.
 *
 * `current` is the active product_scores row; the full `history` is
 * kept on the entity so the domain can answer "score over time"
 * questions without crossing the service boundary.
 */
export interface ProductScore {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly overall: number;
  readonly quality: number | null;
  readonly safety: number | null;
  readonly nutrition: number | null;
  readonly transparency: number | null;
  readonly grade: string | null;
  readonly scoringVersion: string;
  readonly isCurrent: boolean;
  readonly updatedAt: Date;
}

export interface ProductScoreHistoryEntry {
  readonly id: Uuid;
  readonly productId: Uuid;
  readonly overall: number;
  readonly quality: number | null;
  readonly safety: number | null;
  readonly nutrition: number | null;
  readonly transparency: number | null;
  readonly scoringVersion: string;
  readonly computedAt: Date;
  readonly triggeredBy: string | null;
  readonly notes: string | null;
}

export type ProductScoreHistory = ReadonlyArray<ProductScoreHistoryEntry>;
