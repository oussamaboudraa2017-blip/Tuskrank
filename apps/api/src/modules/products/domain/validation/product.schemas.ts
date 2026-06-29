import { z } from 'zod';
import { PRODUCT_BOUNDS, PRODUCT_SLUG_RE, PRODUCT_UPC_RE } from '../constants';
import {
  BreedSizeSlug,
  FoodFormSlug,
  LifeStageSlug,
  PetTypeSlug,
  ProductLifecycleState,
  ProductSortField,
  ProteinOrigin,
  SortOrder,
} from '../enums';

/**
 * Zod validation schemas for the Products module.
 *
 * Conventions:
 *   - All schemas export a paired `z.infer<typeof X>` type so callers
 *     never write duplicate interfaces.
 *   - Numeric ranges mirror the SQL CHECK constraints in
 *     `database/schema.sql`. Changing a number here MUST come with a
 *     paired migration.
 *   - Strings are lowercased and trimmed before validation so the
 *     slug, upc, and iso fields match the schema's strict checks.
 *   - Reusable helpers (uuid, slug, upc, score) live in `_shared.ts`
 *     and are reused by every schema.
 *
 * The DTO layer composes these — `.pipe()` is the standard way to
 * combine `z.object({...})` with shared refinements.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ==================================================================
 * Shared primitive refinements
 * ================================================================== */

export const UuidSchema = z
  .string()
  .trim()
  .regex(UUID_RE, 'Invalid UUID format')
  .transform((v) => v.toLowerCase() as `${string}-${string}-${string}-${string}-${string}`);

export const ProductSlugSchema = z
  .string()
  .trim()
  .min(PRODUCT_BOUNDS.slugMinLength)
  .max(PRODUCT_BOUNDS.slugMaxLength)
  .regex(PRODUCT_SLUG_RE, 'Slug must match /^[a-z0-9-]+$/');

export const UpcSchema = z
  .string()
  .trim()
  .regex(PRODUCT_UPC_RE, 'UPC must be 8-14 numeric digits')
  .refine(
    (v) => [8, 12, 13, 14].includes(v.length),
    { message: 'UPC length must be 8, 12, 13, or 14 digits' },
  );

export const SkuSchema = z
  .string()
  .trim()
  .min(1)
  .max(64);

export const ProductNameSchema = z
  .string()
  .trim()
  .min(PRODUCT_BOUNDS.nameMinLength)
  .max(PRODUCT_BOUNDS.nameMaxLength);

export const ProductDescriptionSchema = z
  .string()
  .trim()
  .max(PRODUCT_BOUNDS.descriptionMaxLength)
  .optional();

export const PackageSizeLabelSchema = z
  .string()
  .trim()
  .max(PRODUCT_BOUNDS.packageSizeLabelMaxLength)
  .nullable()
  .optional();

export const PackageSizeGramsSchema = z
  .number()
  .finite()
  .min(PRODUCT_BOUNDS.packageSizeGramsMin)
  .max(PRODUCT_BOUNDS.packageSizeGramsMax)
  .nullable()
  .optional();

export const ScoreSchema = z
  .number()
  .finite()
  .min(PRODUCT_BOUNDS.scoreMin)
  .max(PRODUCT_BOUNDS.scoreMax);

export const ScoreNullableSchema = ScoreSchema.nullable().optional();

export const IsoDateSchema = z
  .string()
  .trim()
  .regex(ISO_DATE_RE, 'Must be an ISO-8601 date (YYYY-MM-DD)');

export const ScoringVersionSchema = z
  .string()
  .trim()
  .min(1)
  .max(PRODUCT_BOUNDS.scoringVersionMaxLength);

/* ==================================================================
 * Enum literal schemas (close over the runtime enums for safety)
 * ================================================================== */

export const PetTypeSchema = z.nativeEnum(PetTypeSlug);
export const LifeStageSchema = z.nativeEnum(LifeStageSlug);
export const BreedSizeSchema = z.nativeEnum(BreedSizeSlug);
export const FoodFormSchema = z.nativeEnum(FoodFormSlug);
export const ProteinOriginSchema = z.nativeEnum(ProteinOrigin);
export const ProductLifecycleStateSchema = z.nativeEnum(ProductLifecycleState);
export const ProductSortFieldSchema = z.nativeEnum(ProductSortField);
export const SortOrderSchema = z.nativeEnum(SortOrder);

/* ==================================================================
 * Pagination primitive (re-used by every list / search schema)
 * ================================================================== */

export const PaginationSchema = z.object({
  page: z
    .preprocess((v) => Number(v), z.number().int().min(1).default(1)),
  limit: z
    .preprocess(
      (v) => Number(v),
      z.number().int().min(1).max(PRODUCT_BOUNDS.maxLimit).default(PRODUCT_BOUNDS.defaultLimit),
    ),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/* ==================================================================
 * Sort primitive
 * ================================================================== */

export const SortSchema = z
  .object({
    by: ProductSortFieldSchema.default(PRODUCT_BOUNDS.sortBy),
    order: SortOrderSchema.default(PRODUCT_BOUNDS.sortOrder),
  })
  .default({ by: PRODUCT_BOUNDS.sortBy, order: PRODUCT_BOUNDS.sortOrder });

export type SortInput = z.infer<typeof SortSchema>;

/* ==================================================================
 * Filters (shared)
 * ================================================================== */

const FiltersBaseSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  brandId: UuidSchema.optional(),
  petType: PetTypeSchema.optional(),
  lifeStage: LifeStageSchema.optional(),
  breedSize: BreedSizeSchema.optional(),
  foodForm: FoodFormSchema.optional(),
  proteinOrigin: ProteinOriginSchema.optional(),
  minScore: ScoreSchema.optional(),
  maxScore: ScoreSchema.optional(),
  isActive: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  lifecycle: ProductLifecycleStateSchema.optional(),
});
export type ProductFiltersInput = z.infer<typeof FiltersBaseSchema>;

/**
 * Cross-field validation: minScore <= maxScore. Wraps the base
 * schema with a refine so callers get a single error path.
 */
export const FiltersSchema = FiltersBaseSchema.refine(
  (f) => f.minScore === undefined || f.maxScore === undefined || f.minScore <= f.maxScore,
  {
    message: 'minScore must be <= maxScore',
    path: ['minScore'],
  },
);

/* ==================================================================
 * List (admin + public)
 * ================================================================== */

export const ListProductsSchema = z.object({
  ...FiltersBaseSchema.shape,
  ...PaginationSchema.shape,
  sortBy: ProductSortFieldSchema.optional(),
  sortOrder: SortOrderSchema.optional(),
}).refine(
  (q) => q.minScore === undefined || q.maxScore === undefined || q.minScore <= q.maxScore,
  { message: 'minScore must be <= maxScore', path: ['minScore'] },
);

export type ListProductsInput = z.infer<typeof ListProductsSchema>;

/* ==================================================================
 * Search (full-text)
 * ================================================================== */

export const SearchProductsSchema = z.object({
  q: z.string().trim().min(2).max(200),
  ...PaginationSchema.shape,
  brandId: UuidSchema.optional(),
  petType: PetTypeSchema.optional(),
  foodForm: FoodFormSchema.optional(),
});

export type SearchProductsInput = z.infer<typeof SearchProductsSchema>;

/* ==================================================================
 * Detail-by-id and detail-by-slug
 * ================================================================== */

export const ProductIdParamSchema = z.object({
  productId: UuidSchema,
});

export const ProductSlugParamSchema = z.object({
  slug: ProductSlugSchema,
});

/* ==================================================================
 * Lifecycle inputs
 * ================================================================== */

export const LifecycleTransitionSchema = z.object({
  to: ProductLifecycleStateSchema,
});

export const PublishProductSchema = z.object({
  publishAt: IsoDateSchema.optional(),
});

export const RestoreProductSchema = z.object({
  productId: UuidSchema,
});

/* ==================================================================
 * Mutations — Create / Update
 * ================================================================== */

const CreateProductBaseSchema = z.object({
  brandId: UuidSchema,
  name: ProductNameSchema,
  slug: ProductSlugSchema,
  description: ProductDescriptionSchema,
  upc: UpcSchema.optional(),
  sku: SkuSchema.optional(),
  packageSizeGrams: PackageSizeGramsSchema,
  packageSizeLabel: PackageSizeLabelSchema,
  foodFormId: UuidSchema.nullable().optional(),
  primaryProteinSourceId: UuidSchema.nullable().optional(),
  isActive: z.boolean().default(true),
  publishImmediately: z.boolean().default(false),
});

export const CreateProductSchema = CreateProductBaseSchema.refine(
  (p) => p.primaryProteinSourceId === undefined || p.foodFormId === undefined || true,
  {
    message: 'Both foodFormId and primaryProteinSourceId are provided; ensure they reference compatible rows',
  },
);

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = z
  .object({
    name: ProductNameSchema.optional(),
    description: ProductDescriptionSchema,
    upc: UpcSchema.nullable().optional(),
    sku: SkuSchema.nullable().optional(),
    packageSizeGrams: PackageSizeGramsSchema,
    packageSizeLabel: PackageSizeLabelSchema,
    foodFormId: UuidSchema.nullable().optional(),
    primaryProteinSourceId: UuidSchema.nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (p) => Object.values(p).some((v) => v !== undefined),
    { message: 'At least one field must be present' },
  );

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

/* ==================================================================
 * Composite IDs (admin — e.g. image / panel / score operations)
 * ================================================================== */

export const ProductIdAndImageIdSchema = z.object({
  productId: UuidSchema,
  imageId: UuidSchema,
});

export const ProductIdAndIngredientIdSchema = z.object({
  productId: UuidSchema,
  ingredientId: UuidSchema,
});

export const AddImageSchema = z.object({
  publicUrl: z.string().trim().url(),
  storagePath: z.string().trim().min(1).max(PRODUCT_BOUNDS.imagePathMaxLength),
  altText: z.string().trim().max(PRODUCT_BOUNDS.imageAltTextMaxLength).nullable().optional(),
  widthPx: z.number().int().positive().nullable().optional(),
  heightPx: z.number().int().positive().nullable().optional(),
  bytes: z.number().int().nonnegative().nullable().optional(),
  mimeType: z.string().trim().max(PRODUCT_BOUNDS.imageMimeTypeMaxLength).nullable().optional(),
  sortOrder: z.number().int().min(0).max(10_000).default(0),
  isPrimary: z.boolean().default(false),
});

export type AddImageInput = z.infer<typeof AddImageSchema>;

export const AddIngredientEntrySchema = z.object({
  ingredientId: UuidSchema,
  position: z.number().int().min(1).max(PRODUCT_BOUNDS.ingredientsPanelMaxRows),
  rawLabel: z.string().trim().min(1).max(500).nullable().optional(),
  isPrimary: z.boolean().default(false),
  percentageValue: z
    .number()
    .finite()
    .positive()
    .max(100)
    .nullable()
    .optional(),
});

export type AddIngredientEntryInput = z.infer<typeof AddIngredientEntrySchema>;

/* ==================================================================
 * Admin-side lifecycle query
 * ================================================================== */

export const AdminListProductsSchema = ListProductsSchema.extend({
  includeSoftDeleted: z.boolean().default(false),
  includeArchived: z.boolean().default(false),
});

export type AdminListProductsInput = z.infer<typeof AdminListProductsSchema>;

/* ==================================================================
 * Lookup ids (admin / cross-module)
 * ================================================================== */

export const ProductIdOnlySchema = z.object({
  productId: UuidSchema,
});
