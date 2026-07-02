import { RankingSignal } from '../enums';
import {
  RankingStrategy,
  RankingContext,
} from '../interfaces/ranking-strategy.interface';
import { SEARCH_BOUNDS, DEFAULT_RANKING_WEIGHTS } from '../constants';

/**
 * Full-text search ranking strategy.
 * Uses PostgreSQL ts_rank() score from the search query.
 */
export class FullTextRanking implements RankingStrategy {
  readonly signal = RankingSignal.FullText;

  score(row: Record<string, unknown>, context: RankingContext): number {
    const raw = Number(row['fts_score'] ?? row['rank'] ?? 0);
    if (context.maxFtsScore === 0) return 0;
    return Math.min(raw / context.maxFtsScore, 1);
  }
}

/**
 * Trigram similarity ranking strategy.
 * Uses pg_trgm similarity score from the search query.
 */
export class TrigramRanking implements RankingStrategy {
  readonly signal = RankingSignal.Trigram;

  score(row: Record<string, unknown>, context: RankingContext): number {
    const raw = Number(row['similarity'] ?? row['trigram_score'] ?? 0);
    if (context.maxTrigramScore === 0) return 0;
    return Math.min(raw / context.maxTrigramScore, 1);
  }
}

/**
 * Entity score ranking strategy.
 * Uses the entity's own computed score (e.g., overall_score).
 */
export class EntityScoreRanking implements RankingStrategy {
  readonly signal = RankingSignal.EntityScore;

  score(row: Record<string, unknown>, context: RankingContext): number {
    const raw = Number(
      row['overall_score'] ?? row['score'] ?? row['entity_score'] ?? 0,
    );
    if (context.maxEntityScore === 0) return 0;
    return Math.min(raw / context.maxEntityScore, 1);
  }
}

/**
 * Recency ranking strategy.
 * Entities updated more recently score higher.
 */
export class RecencyRanking implements RankingStrategy {
  readonly signal = RankingSignal.Recency;

  score(row: Record<string, unknown>, context: RankingContext): number {
    const ts = row['updated_at'];
    if (!ts) return 0;
    const timestamp =
      typeof ts === 'string' ? new Date(ts).getTime() : Number(ts);
    if (context.maxTimestamp === 0) return 0;
    return Math.min(timestamp / context.maxTimestamp, 1);
  }
}

/**
 * Keyword match ranking strategy.
 * Boosts results matched via the search_keywords table.
 */
export class KeywordRanking implements RankingStrategy {
  readonly signal = RankingSignal.Keyword;

  score(row: Record<string, unknown>, _context: RankingContext): number {
    const matchedBy = String(row['matched_by'] ?? '');
    const isKeyword = matchedBy.includes('keyword');
    return isKeyword ? 1.0 : 0.0;
  }
}

/**
 * Popularity ranking strategy.
 * Uses search_logs frequency to rank popular queries.
 */
export class PopularityRanking implements RankingStrategy {
  readonly signal = RankingSignal.Popularity;

  score(row: Record<string, unknown>, context: RankingContext): number {
    const raw = Number(row['search_count'] ?? row['popularity'] ?? 0);
    if (context.maxSearchCount === 0) return 0;
    return Math.min(raw / context.maxSearchCount, 1);
  }
}

/**
 * RankingEngine — composes multiple ranking strategies into a final score.
 *
 * Usage:
 *   const engine = RankingEngine.createDefault();
 *   const scored = engine.rankRows(rows);
 */
export class RankingEngine {
  private readonly strategies: Map<RankingSignal, RankingStrategy>;
  private readonly weights: Record<RankingSignal, number>;

  constructor(
    strategies: RankingStrategy[],
    weights?: Partial<Record<RankingSignal, number>>,
  ) {
    this.strategies = new Map(
      strategies.map((s) => [s.signal, s]),
    );
    this.weights = { ...DEFAULT_RANKING_WEIGHTS, ...weights };
  }

  /**
   * Compute the ranking context from a set of raw rows.
   */
  buildContext(rows: Record<string, unknown>[]): RankingContext {
    return {
      maxFtsScore: Math.max(
        ...rows.map((r) => Number(r['fts_score'] ?? r['rank'] ?? 0)),
        0,
      ),
      maxTrigramScore: Math.max(
        ...rows.map((r) => Number(r['similarity'] ?? r['trigram_score'] ?? 0)),
        0,
      ),
      maxEntityScore: Math.max(
        ...rows.map((r) =>
          Number(r['overall_score'] ?? r['score'] ?? r['entity_score'] ?? 0),
        ),
        0,
      ),
      maxTimestamp: Math.max(
        ...rows.map((r) => {
          const ts = r['updated_at'];
          return typeof ts === 'string' ? new Date(ts).getTime() : Number(ts ?? 0);
        }),
        0,
      ),
      maxSearchCount: Math.max(
        ...rows.map((r) => Number(r['search_count'] ?? r['popularity'] ?? 0)),
        0,
      ),
    };
  }

  /**
   * Score a single row using all registered strategies.
   */
  scoreRow(
    row: Record<string, unknown>,
    context: RankingContext,
  ): number {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [signal, strategy] of this.strategies) {
      const weight = this.weights[signal] ?? 0;
      if (weight <= 0) continue;

      const signalScore = strategy.score(row, context);
      weightedSum += signalScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Score and sort rows by composite ranking.
   */
  rankRows(rows: Record<string, unknown>[]): {
    row: Record<string, unknown>;
    score: number;
  }[] {
    if (rows.length === 0) return [];

    const context = this.buildContext(rows);

    return rows
      .map((row) => ({
        row,
        score: this.scoreRow(row, context),
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Create a RankingEngine with all default strategies and weights.
   */
  static createDefault(): RankingEngine {
    return new RankingEngine([
      new FullTextRanking(),
      new TrigramRanking(),
      new EntityScoreRanking(),
      new KeywordRanking(),
      new RecencyRanking(),
      new PopularityRanking(),
    ]);
  }
}
