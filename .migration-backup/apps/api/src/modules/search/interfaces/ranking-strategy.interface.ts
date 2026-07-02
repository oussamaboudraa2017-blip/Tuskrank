import { RankingSignal } from '../enums';

/**
 * A single weighted ranking signal.
 */
export interface WeightedSignal {
  signal: RankingSignal;
  weight: number;
}

/**
 * RankingStrategy — composes a final score from multiple signals.
 *
 * Each strategy implementation reads its signal value from a raw DB row
 * and returns a normalized [0, 1] score. The RankingEngine multiplies
 * each signal score by its weight and sums them.
 */
export interface RankingStrategy {
  /** The signal this strategy computes. */
  readonly signal: RankingSignal;

  /**
   * Extract and normalize the signal value from a raw search row.
   * Returns a value in [0, 1] where 1 is best.
   */
  score(row: Record<string, unknown>, context: RankingContext): number;
}

/**
 * Context provided to ranking strategies for cross-signal normalization.
 */
export interface RankingContext {
  /** Maximum FTS score in the result set (for normalization). */
  maxFtsScore: number;
  /** Maximum trigram score in the result set. */
  maxTrigramScore: number;
  /** Maximum entity score in the result set. */
  maxEntityScore: number;
  /** Most recent updated_at in the result set (epoch ms). */
  maxTimestamp: number;
  /** Maximum search count in the result set (for popularity). */
  maxSearchCount: number;
}

export { RankingSignal };
