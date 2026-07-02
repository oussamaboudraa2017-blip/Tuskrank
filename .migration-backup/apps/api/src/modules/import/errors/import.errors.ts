import { ApiError } from '@common/errors/api-error';

/**
 * Import-specific error codes.
 */
export const IMPORT_ERROR_CODES = {
  FILE_TOO_LARGE: 'IMPORT_FILE_TOO_LARGE',
  INVALID_FORMAT: 'IMPORT_INVALID_FORMAT',
  INVALID_ENTITY_TYPE: 'IMPORT_INVALID_ENTITY_TYPE',
  PARSING_FAILED: 'IMPORT_PARSING_FAILED',
  VALIDATION_FAILED: 'IMPORT_VALIDATION_FAILED',
  ALL_ROWS_FAILED: 'IMPORT_ALL_ROWS_FAILED',
  JOB_NOT_FOUND: 'IMPORT_JOB_NOT_FOUND',
  JOB_ALREADY_RUNNING: 'IMPORT_JOB_ALREADY_RUNNING',
  DUPLICATE_SLUG: 'IMPORT_DUPLICATE_SLUG',
  DUPLICATE_UPC: 'IMPORT_DUPLICATE_UPC',
  DUPLICATE_SKU: 'IMPORT_DUPLICATE_SKU',
  MISSING_REQUIRED_FIELD: 'IMPORT_MISSING_REQUIRED_FIELD',
  INVALID_FIELD_VALUE: 'IMPORT_INVALID_FIELD_VALUE',
  BRAND_NOT_FOUND: 'IMPORT_BRAND_NOT_FOUND',
  CATEGORY_NOT_FOUND: 'IMPORT_CATEGORY_NOT_FOUND',
  NORMALIZATION_FAILED: 'IMPORT_NORMALIZATION_FAILED',
  SAVE_FAILED: 'IMPORT_SAVE_FAILED',
} as const;

export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[keyof typeof IMPORT_ERROR_CODES];

/* ------------------------------------------------------------------
 * Base
 * ------------------------------------------------------------------ */

export class ImportError extends ApiError {
  constructor(code: string, message: string, httpStatus: number, details?: Record<string, unknown>) {
    super(code, message, httpStatus, details);
  }
}

/* ------------------------------------------------------------------
 * File errors
 * ------------------------------------------------------------------ */

export class ImportFileTooLargeError extends ImportError {
  constructor(maxBytes: number) {
    super(IMPORT_ERROR_CODES.FILE_TOO_LARGE, `file exceeds maximum size of ${maxBytes} bytes`, 413);
  }
}

export class ImportInvalidFormatError extends ImportError {
  constructor(format: string) {
    super(IMPORT_ERROR_CODES.INVALID_FORMAT, `unsupported import format '${format}'`, 400, { format });
  }
}

export class ImportInvalidEntityTypeError extends ImportError {
  constructor(entityType: string) {
    super(IMPORT_ERROR_CODES.INVALID_ENTITY_TYPE, `unsupported entity type '${entityType}'`, 400, { entityType });
  }
}

/* ------------------------------------------------------------------
 * Parsing errors
 * ------------------------------------------------------------------ */

export class ImportParsingFailedError extends ImportError {
  constructor(reason: string) {
    super(IMPORT_ERROR_CODES.PARSING_FAILED, `parsing failed: ${reason}`, 422, { reason });
  }
}

/* ------------------------------------------------------------------
 * Validation errors
 * ------------------------------------------------------------------ */

export class ImportValidationFailedError extends ImportError {
  constructor(failedCount: number, totalCount: number) {
    super(IMPORT_ERROR_CODES.VALIDATION_FAILED, `${failedCount} of ${totalCount} rows failed validation`, 422, { failedCount, totalCount });
  }
}

export class ImportAllRowsFailedError extends ImportError {
  constructor(totalCount: number) {
    super(IMPORT_ERROR_CODES.ALL_ROWS_FAILED, `all ${totalCount} rows failed validation`, 422, { totalCount });
  }
}

export class ImportMissingRequiredFieldError extends ImportError {
  constructor(field: string, rowIndex: number) {
    super(IMPORT_ERROR_CODES.MISSING_REQUIRED_FIELD, `row ${rowIndex}: missing required field '${field}'`, 422, { field, rowIndex });
  }
}

export class ImportInvalidFieldValueError extends ImportError {
  constructor(field: string, value: string, rowIndex: number, reason: string) {
    super(IMPORT_ERROR_CODES.INVALID_FIELD_VALUE, `row ${rowIndex}: invalid value for '${field}': ${reason}`, 422, { field, value, rowIndex, reason });
  }
}

/* ------------------------------------------------------------------
 * Deduplication errors
 * ------------------------------------------------------------------ */

export class ImportDuplicateSlugError extends ImportError {
  constructor(slug: string, rowIndex: number) {
    super(IMPORT_ERROR_CODES.DUPLICATE_SLUG, `row ${rowIndex}: duplicate slug '${slug}'`, 409, { slug, rowIndex });
  }
}

export class ImportDuplicateUpcError extends ImportError {
  constructor(upc: string, rowIndex: number) {
    super(IMPORT_ERROR_CODES.DUPLICATE_UPC, `row ${rowIndex}: duplicate UPC '${upc}'`, 409, { upc, rowIndex });
  }
}

export class ImportDuplicateSkuError extends ImportError {
  constructor(sku: string, brandId: string, rowIndex: number) {
    super(IMPORT_ERROR_CODES.DUPLICATE_SKU, `row ${rowIndex}: duplicate SKU '${sku}' for brand`, 409, { sku, brandId, rowIndex });
  }
}

/* ------------------------------------------------------------------
 * Reference errors
 * ------------------------------------------------------------------ */

export class ImportBrandNotFoundError extends ImportError {
  constructor(brandName: string, rowIndex: number) {
    super(IMPORT_ERROR_CODES.BRAND_NOT_FOUND, `row ${rowIndex}: brand '${brandName}' not found`, 422, { brandName, rowIndex });
  }
}

export class ImportCategoryNotFoundError extends ImportError {
  constructor(category: string, rowIndex: number) {
    super(IMPORT_ERROR_CODES.CATEGORY_NOT_FOUND, `row ${rowIndex}: category '${category}' not found`, 422, { category, rowIndex });
  }
}

/* ------------------------------------------------------------------
 * Job errors
 * ------------------------------------------------------------------ */

export class ImportJobNotFoundError extends ImportError {
  constructor(jobId: string) {
    super(IMPORT_ERROR_CODES.JOB_NOT_FOUND, `import job '${jobId}' not found`, 404, { jobId });
  }
}

export class ImportJobAlreadyRunningError extends ImportError {
  constructor() {
    super(IMPORT_ERROR_CODES.JOB_ALREADY_RUNNING, 'an import job is already running', 409);
  }
}

/* ------------------------------------------------------------------
 * Save errors
 * ------------------------------------------------------------------ */

export class ImportSaveFailedError extends ImportError {
  constructor(reason: string) {
    super(IMPORT_ERROR_CODES.SAVE_FAILED, `save failed: ${reason}`, 500, { reason });
  }
}
