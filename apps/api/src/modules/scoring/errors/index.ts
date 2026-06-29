/**
 * Scoring-specific error classes.
 */

export class ScoringError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ScoringError';
  }
}

export class ProductNotScorableError extends ScoringError {
  constructor(productId: string) {
    super(
      `Product ${productId} is not scorable (inactive or unpublished).`,
      'PRODUCT_NOT_SCORABLE',
      422,
    );
    this.name = 'ProductNotScorableError';
  }
}

export class InsufficientDataError extends ScoringError {
  constructor(productId: string, missing: string[]) {
    super(
      `Insufficient data to score product ${productId}. Missing: ${missing.join(', ')}.`,
      'INSUFFICIENT_DATA',
      422,
    );
    this.name = 'InsufficientDataError';
  }
}

export class InvalidWeightConfigError extends ScoringError {
  constructor(message: string) {
    super(message, 'INVALID_WEIGHT_CONFIG', 400);
    this.name = 'InvalidWeightConfigError';
  }
}
