/**
 * Domain enums for the Import module.
 */

/** Supported import file formats. */
export enum ImportFormat {
  Csv = 'csv',
  Json = 'json',
}

/** Supported import entity types. */
export enum ImportEntityType {
  Products = 'products',
  Brands = 'brands',
  Ingredients = 'ingredients',
}

/** Import job lifecycle states. */
export enum ImportJobStatus {
  Pending = 'pending',
  Parsing = 'parsing',
  Validating = 'validating',
  Normalizing = 'normalizing',
  Deduplicating = 'deduplicating',
  Saving = 'saving',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/** Per-row processing status. */
export enum ImportRowStatus {
  Pending = 'pending',
  Imported = 'imported',
  Updated = 'updated',
  Skipped = 'skipped',
  Failed = 'failed',
}

/** Deduplication strategy. */
export enum DedupeStrategy {
  /** Skip rows that match existing records (by slug, UPC, etc.). */
  Skip = 'skip',
  /** Overwrite existing records with new data. */
  Overwrite = 'overwrite',
  /** Merge new data into existing records (non-null fields win). */
  Merge = 'merge',
}

/** Normalization scope. */
export enum NormalizeScope {
  /** Full normalization: slug, trim, lowercase, collapse whitespace. */
  Full = 'full',
  /** Light normalization: trim and collapse whitespace only. */
  Light = 'light',
  /** No normalization. */
  None = 'none',
}
