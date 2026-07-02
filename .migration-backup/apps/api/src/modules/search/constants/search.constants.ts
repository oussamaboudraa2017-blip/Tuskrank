import { RankingSignal } from '../enums';

/**
 * Search module constants.
 */

export const SEARCH_BOUNDS = {
  queryMinLength: 1,
  queryMaxLength: 500,
  autocompleteMinLength: 2,
  defaultLimit: 10,
  maxLimit: 50,
  autocompleteMaxLimit: 20,
  searchTimeoutMs: 15_000,
  trigramMinSimilarity: 0.1,
  trigramDefaultSimilarity: 0.3,
  maxSynonymDepth: 2,
  maxResultsPerPage: 100,
  snippetMaxLength: 200,
} as const;

/**
 * Default ranking weights for multi-signal scoring.
 * Weights are normalized to sum to 1.0.
 */
export const DEFAULT_RANKING_WEIGHTS: Record<RankingSignal, number> = {
  [RankingSignal.FullText]: 0.35,
  [RankingSignal.Trigram]: 0.20,
  [RankingSignal.EntityScore]: 0.20,
  [RankingSignal.Keyword]: 0.15,
  [RankingSignal.Recency]: 0.05,
  [RankingSignal.Popularity]: 0.05,
};

/**
 * Ranking weights (alias used by service layer).
 */
export const SEARCH_RANKING_WEIGHTS = {
  fullText: DEFAULT_RANKING_WEIGHTS[RankingSignal.FullText],
  trigram: DEFAULT_RANKING_WEIGHTS[RankingSignal.Trigram],
  entityScore: DEFAULT_RANKING_WEIGHTS[RankingSignal.EntityScore],
  recency: DEFAULT_RANKING_WEIGHTS[RankingSignal.Recency],
  keyword: DEFAULT_RANKING_WEIGHTS[RankingSignal.Keyword],
  popularity: DEFAULT_RANKING_WEIGHTS[RankingSignal.Popularity],
} as const;

/**
 * Search analytics constants.
 */
export const SEARCH_ANALYTICS = {
  trendingWindowHours: 24,
  trendingMinCount: 3,
  popularSearchMinCount: 5,
  analyticsRetentionDays: 90,
} as const;
