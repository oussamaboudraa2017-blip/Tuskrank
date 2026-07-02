import { z } from 'zod';
import { INGREDIENT_BOUNDS, INGREDIENT_SLUG_RE } from '../constants';
import { IngredientSortField, SortOrder, EvidenceType } from '../enums';

/**
 * Zod validation schemas for the Ingredients module.
 *
 * Conventions:
 *   - All schemas export a paired `z.infer<typeof X>` type.
 *   - Numeric ranges mirror the SQL CHECK constraints.
 *   - Strings are lowercased and trimmed before validation.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* === Shared primitive refinements === */

export const UuidSchema = z
  .string()
  .trim()
  .regex(UUID_RE, 'Invalid UUID format')
  .transform((v) => v.toLowerCase() as `${string}-${string}-${string}-${string}-${string}`);

export const IngredientSlugSchema = z
  .string()
  .trim()
  .min(INGREDIENT_BOUNDS.slugMinLength)
  .max(INGREDIENT_BOUNDS.slugMaxLength)
  .regex(INGREDIENT_SLUG_RE, 'Slug must match /^[a-z0-9-]+$/');

export const IngredientNameSchema = z
  .string()
  .trim()
  .min(INGREDIENT_BOUNDS.nameMinLength)
  .max(INGREDIENT_BOUNDS.nameMaxLength);

export const IngredientDescriptionSchema = z
  .string()
  .trim()
  .max(INGREDIENT_BOUNDS.descriptionMaxLength)
  .optional();

export const InciNameSchema = z
  .string()
  .trim()
  .max(INGREDIENT_BOUNDS.inciNameMaxLength)
  .nullable()
  .optional();

export const CanonicalNameSchema = z
  .string()
  .trim()
  .min(INGREDIENT_BOUNDS.nameMinLength)
  .max(INGREDIENT_BOUNDS.canonicalNameMaxLength);

export const ScoreSchema = z
  .number()
  .finite()
  .min(INGREDIENT_BOUNDS.scoreMin)
  .max(INGREDIENT_BOUNDS.scoreMax);

export const ScoringVersionSchema = z
  .string()
  .trim()
  .min(1)
  .max(INGREDIENT_BOUNDS.scoringVersionMaxLength);

export const ReasoningSchema = z
  .string()
  .trim()
  .max(INGREDIENT_BOUNDS.reasoningMaxLength)
  .nullable()
  .optional();

export const CategoryNameSchema = z
  .string()
  .trim()
  .min(INGREDIENT_BOUNDS.categoryNameMinLength)
  .max(INGREDIENT_BOUNDS.categoryNameMaxLength);

export const CategoryDescriptionSchema = z
  .string()
  .trim()
  .max(INGREDIENT_BOUNDS.categoryDescriptionMaxLength)
  .nullable()
  .optional();

export const RelevanceScoreSchema = z
  .number()
  .finite()
  .min(INGREDIENT_BOUNDS.relevanceScoreMin)
  .max(INGREDIENT_BOUNDS.relevanceScoreMax)
  .nullable()
  .optional();

export const ReferenceNotesSchema = z
  .string()
  .trim()
  .max(INGREDIENT_BOUNDS.referenceNotesMaxLength)
  .nullable()
  .optional();

/* === Enum schemas === */

export const IngredientSortFieldSchema = z.nativeEnum(IngredientSortField);
export const SortOrderSchema = z.nativeEnum(SortOrder);
export const EvidenceTypeSchema = z.nativeEnum(EvidenceType);

/* === Pagination === */

export const PaginationSchema = z.object({
  page: z
    .preprocess((v) => Number(v), z.number().int().min(1).default(1)),
  limit: z
    .preprocess(
      (v) => Number(v),
      z.number().int().min(1).max(INGREDIENT_BOUNDS.maxLimit).default(INGREDIENT_BOUNDS.defaultLimit),
    ),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/* === Sort === */

export const SortSchema = z
  .object({
    by: IngredientSortFieldSchema.default(INGREDIENT_BOUNDS.sortBy),
    order: SortOrderSchema.default(INGREDIENT_BOUNDS.sortOrder),
  })
  .default({ by: INGREDIENT_BOUNDS.sortBy, order: INGREDIENT_BOUNDS.sortOrder });

export type SortInput = z.infer<typeof SortSchema>;

/* === Filters (base object, no refine) === */

export const FiltersBaseSchema = z.object({
  q: z.string().trim().min(1).max(200).optional(),
  categoryId: UuidSchema.optional(),
  isAnimalDerived: z.boolean().optional(),
  isCommonAllergen: z.boolean().optional(),
  isControversial: z.boolean().optional(),
  isActive: z.boolean().optional(),
  minScore: ScoreSchema.optional(),
  maxScore: ScoreSchema.optional(),
});

export type IngredientFiltersInput = z.infer<typeof FiltersBaseSchema>;

/* === List === */

export const ListIngredientsSchema = z.object({
  ...FiltersBaseSchema.shape,
  ...PaginationSchema.shape,
  sortBy: IngredientSortFieldSchema.optional(),
  sortOrder: SortOrderSchema.optional(),
}).refine(
  (q) => q.minScore === undefined || q.maxScore === undefined || q.minScore <= q.maxScore,
  { message: 'minScore must be <= maxScore', path: ['minScore'] },
);

export type ListIngredientsInput = z.infer<typeof ListIngredientsSchema>;

/* === Search === */

export const SearchIngredientsSchema = z.object({
  q: z.string().trim().min(2).max(200),
  ...PaginationSchema.shape,
});

export type SearchIngredientsInput = z.infer<typeof SearchIngredientsSchema>;

/* === Params === */

export const IngredientIdParamSchema = z.object({
  ingredientId: UuidSchema,
});

export const IngredientSlugParamSchema = z.object({
  slug: IngredientSlugSchema,
});

/* === Mutations -- Create / Update Ingredient === */

export const CreateIngredientSchema = z.object({
  name: IngredientNameSchema,
  slug: IngredientSlugSchema,
  inciName: InciNameSchema,
  categoryId: UuidSchema.nullable().optional(),
  canonicalName: CanonicalNameSchema,
  description: IngredientDescriptionSchema,
  isAnimalDerived: z.boolean().default(false),
  isCommonAllergen: z.boolean().default(false),
  isControversial: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type CreateIngredientInput = z.infer<typeof CreateIngredientSchema>;

export const UpdateIngredientSchema = z
  .object({
    name: IngredientNameSchema.optional(),
    slug: IngredientSlugSchema.optional(),
    inciName: InciNameSchema,
    categoryId: UuidSchema.nullable().optional(),
    canonicalName: CanonicalNameSchema.optional(),
    description: IngredientDescriptionSchema,
    isAnimalDerived: z.boolean().optional(),
    isCommonAllergen: z.boolean().optional(),
    isControversial: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (p) => Object.values(p).some((v) => v !== undefined),
    { message: 'At least one field must be present' },
  );

export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>;

/* === Mutations -- Create / Update Category === */

export const CreateCategorySchema = z.object({
  name: CategoryNameSchema,
  slug: IngredientSlugSchema,
  description: CategoryDescriptionSchema,
  parentId: UuidSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z
  .object({
    name: CategoryNameSchema.optional(),
    slug: IngredientSlugSchema.optional(),
    description: CategoryDescriptionSchema,
    parentId: UuidSchema.nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (p) => Object.values(p).some((v) => v !== undefined),
    { message: 'At least one field must be present' },
  );

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

/* === Score mutation === */

export const CreateScoreSchema = z.object({
  score: ScoreSchema,
  grade: z.string().trim().regex(/^([ABCDEF][+-]?)$/, 'Grade must be A-F with optional +/-'),
  reasoning: ReasoningSchema,
  scoringVersion: ScoringVersionSchema,
});

export type CreateScoreInput = z.infer<typeof CreateScoreSchema>;

/* === Lifecycle === */

export const ActivateIngredientSchema = z.object({
  ingredientId: UuidSchema,
});

export const DeactivateIngredientSchema = z.object({
  ingredientId: UuidSchema,
});

/* === Admin list === */

export const AdminListIngredientsSchema = z.object({
  ...FiltersBaseSchema.shape,
  ...PaginationSchema.shape,
  sortBy: IngredientSortFieldSchema.optional(),
  sortOrder: SortOrderSchema.optional(),
  includeSoftDeleted: z.boolean().default(false),
}).refine(
  (q) => q.minScore === undefined || q.maxScore === undefined || q.minScore <= q.maxScore,
  { message: 'minScore must be <= maxScore', path: ['minScore'] },
);

export type AdminListIngredientsInput = z.infer<typeof AdminListIngredientsSchema>;
