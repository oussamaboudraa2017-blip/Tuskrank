import type { ImportFormat, ImportEntityType, ImportJobStatus, ImportRowStatus, DedupeStrategy } from '../enums';

/**
 * Raw row from CSV/JSON before any processing.
 */
export type RawImportRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Normalized row after normalization step.
 */
export interface NormalizedBrandRow {
  readonly name: string;
  readonly slug: string;
  readonly manufacturer: string | null;
  readonly countryCode: string | null;
  readonly websiteUrl: string | null;
  readonly description: string | null;
  readonly logoImageUrl: string | null;
  readonly isActive: boolean;
}

export interface NormalizedProductRow {
  readonly brandName: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly upc: string | null;
  readonly sku: string | null;
  readonly packageSizeGrams: number | null;
  readonly packageSizeLabel: string | null;
  readonly foodForm: string | null;
  readonly primaryProteinSource: string | null;
  readonly petTypes: readonly string[];
  readonly lifeStages: readonly string[];
  readonly breedSizes: readonly string[];
  readonly categories: readonly string[];
  readonly claims: readonly string[];
  readonly tags: readonly string[];
  readonly kcalPer100g: number | null;
  readonly moisturePct: number | null;
  readonly proteinPct: number | null;
  readonly fatPct: number | null;
  readonly fiberPct: number | null;
  readonly ashPct: number | null;
  readonly omega3Pct: number | null;
  readonly omega6Pct: number | null;
  readonly calciumPct: number | null;
  readonly phosphorusPct: number | null;
  readonly imageUrl: string | null;
  readonly isActive: boolean;
}

export interface NormalizedIngredientRow {
  readonly name: string;
  readonly slug: string;
  readonly inciName: string | null;
  readonly canonicalName: string;
  readonly category: string | null;
  readonly description: string | null;
  readonly isAnimalDerived: boolean;
  readonly isCommonAllergen: boolean;
  readonly isControversial: boolean;
  readonly isActive: boolean;
}

export type NormalizedRow = NormalizedBrandRow | NormalizedProductRow | NormalizedIngredientRow;

/**
 * Validation result for a single row.
 */
export interface RowValidationResult {
  readonly rowIndex: number;
  readonly valid: boolean;
  readonly errors: readonly RowValidationError[];
  readonly warnings: readonly RowValidationWarning[];
}

export interface RowValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export interface RowValidationWarning {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

/**
 * Per-row import result.
 */
export interface ImportRowResult {
  readonly rowIndex: number;
  readonly status: ImportRowStatus;
  readonly entityId?: string;
  readonly entitySlug?: string;
  readonly errors?: readonly RowValidationError[];
}

/**
 * Import job definition.
 */
export interface ImportJob {
  readonly id: string;
  readonly entityType: ImportEntityType;
  readonly format: ImportFormat;
  readonly dedupeStrategy: DedupeStrategy;
  readonly status: ImportJobStatus;
  readonly filename: string;
  readonly totalRows: number;
  readonly processedRows: number;
  readonly results: ImportJobResults;
  readonly startedAt: Date;
  readonly completedAt: Date | null;
  readonly durationMs: number | null;
  readonly errors: readonly string[];
}

/**
 * Aggregated results for an import job.
 */
export interface ImportJobResults {
  readonly imported: number;
  readonly updated: number;
  readonly skipped: number;
  readonly failed: number;
  readonly rowResults: readonly ImportRowResult[];
}

/**
 * Import report (human-readable summary).
 */
export interface ImportReport {
  readonly jobId: string;
  readonly entityType: ImportEntityType;
  readonly filename: string;
  readonly totalRows: number;
  readonly imported: number;
  readonly updated: number;
  readonly skipped: number;
  readonly failed: number;
  readonly durationMs: number;
  readonly startedAt: Date;
  readonly completedAt: Date;
  readonly errors: readonly ImportReportError[];
  readonly warnings: readonly ImportReportWarning[];
}

export interface ImportReportError {
  readonly rowIndex: number;
  readonly field: string;
  readonly message: string;
}

export interface ImportReportWarning {
  readonly rowIndex: number;
  readonly field: string;
  readonly message: string;
}

/**
 * Parser output.
 */
export interface ParseResult {
  readonly rows: readonly RawImportRow[];
  readonly totalRows: number;
  readonly headers: readonly string[];
}

/**
 * Import pipeline context (threaded through all stages).
 */
export interface ImportContext {
  readonly jobId: string;
  readonly entityType: ImportEntityType;
  readonly format: ImportFormat;
  readonly dedupeStrategy: DedupeStrategy;
  readonly filename: string;
  rawRows: RawImportRow[];
  normalizedRows: NormalizedRow[];
  validatedRows: RowValidationResult[];
  deduplicatedRows: NormalizedRow[];
  savedResults: ImportRowResult[];
  errors: string[];
}
