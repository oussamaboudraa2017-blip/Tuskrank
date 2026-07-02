import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Ingredient detail DTO.
 */
export class IngredientDetailDto {
  @ApiProperty({ description: 'UUID.' })
  id!: string;

  @ApiProperty({ description: 'Display name.', example: 'Chicken Meal' })
  name!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'chicken-meal' })
  slug!: string;

  @ApiPropertyOptional({ description: 'INCI name.', nullable: true })
  inciName!: string | null;

  @ApiPropertyOptional({ description: 'Category UUID.', nullable: true })
  categoryId!: string | null;

  @ApiProperty({ description: 'Canonical name.', example: 'chicken meal' })
  canonicalName!: string;

  @ApiPropertyOptional({ description: 'Description.', nullable: true })
  description!: string | null;

  @ApiProperty({ description: 'Is animal-derived.' })
  isAnimalDerived!: boolean;

  @ApiProperty({ description: 'Is a common allergen.' })
  isCommonAllergen!: boolean;

  @ApiProperty({ description: 'Is controversial.' })
  isControversial!: boolean;

  @ApiProperty({ description: 'Is active.' })
  isActive!: boolean;

  @ApiProperty({ description: 'Created at.' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at.' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Category name.', nullable: true })
  categoryName!: string | null;

  @ApiPropertyOptional({ description: 'Category slug.', nullable: true })
  categorySlug!: string | null;

  @ApiPropertyOptional({ description: 'Current score.', nullable: true })
  score!: number | null;

  @ApiPropertyOptional({ description: 'Letter grade.', nullable: true })
  grade!: string | null;

  @ApiPropertyOptional({ description: 'Number of products using this ingredient.' })
  productCount!: number;
}

/**
 * Ingredient list item DTO.
 */
export class IngredientListItemDto {
  @ApiProperty({ description: 'UUID.' })
  id!: string;

  @ApiProperty({ description: 'Display name.', example: 'Chicken Meal' })
  name!: string;

  @ApiProperty({ description: 'URL-safe slug.', example: 'chicken-meal' })
  slug!: string;

  @ApiProperty({ description: 'Canonical name.', example: 'chicken meal' })
  canonicalName!: string;

  @ApiProperty({ description: 'Is animal-derived.' })
  isAnimalDerived!: boolean;

  @ApiProperty({ description: 'Is a common allergen.' })
  isCommonAllergen!: boolean;

  @ApiProperty({ description: 'Is controversial.' })
  isControversial!: boolean;

  @ApiProperty({ description: 'Is active.' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Category name.', nullable: true })
  categoryName!: string | null;

  @ApiPropertyOptional({ description: 'Category slug.', nullable: true })
  categorySlug!: string | null;

  @ApiPropertyOptional({ description: 'Score.', nullable: true })
  score!: number | null;

  @ApiPropertyOptional({ description: 'Grade.', nullable: true })
  grade!: string | null;

  @ApiProperty({ description: 'Number of products.' })
  productCount!: number;
}

/**
 * Ingredient category DTO.
 */
export class IngredientCategoryDto {
  @ApiProperty({ description: 'UUID.' })
  id!: string;

  @ApiProperty({ description: 'Slug.', example: 'proteins' })
  slug!: string;

  @ApiProperty({ description: 'Name.', example: 'Proteins' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description.', nullable: true })
  description!: string | null;

  @ApiPropertyOptional({ description: 'Parent UUID.', nullable: true })
  parentId!: string | null;

  @ApiProperty({ description: 'Sort order.' })
  sortOrder!: number;

  @ApiProperty({ description: 'Is active.' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Child categories.', type: [() => IngredientCategoryDto] })
  children?: IngredientCategoryDto[];
}

/**
 * Ingredient score DTO.
 */
export class IngredientScoreDto {
  @ApiProperty({ description: 'UUID.' })
  id!: string;

  @ApiProperty({ description: 'Ingredient UUID.' })
  ingredientId!: string;

  @ApiProperty({ description: 'Score (0-100).' })
  score!: number;

  @ApiProperty({ description: 'Letter grade.', example: 'B+' })
  grade!: string;

  @ApiPropertyOptional({ description: 'Reasoning.', nullable: true })
  reasoning!: string | null;

  @ApiProperty({ description: 'Scoring version.' })
  scoringVersion!: string;

  @ApiProperty({ description: 'Is current.' })
  isCurrent!: boolean;
}

/**
 * Product ingredient entry DTO.
 */
export class ProductIngredientEntryDto {
  @ApiProperty({ description: 'Product ingredient UUID.' })
  productIngredientId!: string;

  @ApiProperty({ description: 'Product UUID.' })
  productId!: string;

  @ApiProperty({ description: 'Position in ingredient panel.' })
  position!: number;

  @ApiPropertyOptional({ description: 'Raw label text.', nullable: true })
  rawLabel!: string | null;

  @ApiProperty({ description: 'Is primary ingredient.' })
  isPrimary!: boolean;

  @ApiPropertyOptional({ description: 'Percentage value.', nullable: true })
  percentageValue!: number | null;

  @ApiProperty({ description: 'Ingredient UUID.' })
  ingredientId!: string;

  @ApiProperty({ description: 'Ingredient name.' })
  ingredientName!: string;

  @ApiProperty({ description: 'Ingredient slug.' })
  ingredientSlug!: string;

  @ApiProperty({ description: 'Ingredient grade.', nullable: true })
  ingredientGrade!: string | null;

  @ApiProperty({ description: 'Ingredient score.', nullable: true })
  ingredientScore!: number | null;
}

/**
 * Ingredient reference DTO.
 */
export class IngredientReferenceDto {
  @ApiProperty({ description: 'UUID.' })
  id!: string;

  @ApiProperty({ description: 'Evidence type.', enum: ['supports', 'refutes', 'neutral'], nullable: true })
  evidenceType!: string | null;

  @ApiProperty({ description: 'Relevance score (0-10).', nullable: true })
  relevanceScore!: number | null;

  @ApiPropertyOptional({ description: 'Notes.', nullable: true })
  notes!: string | null;

  @ApiProperty({ description: 'Reference title.' })
  title!: string;

  @ApiPropertyOptional({ description: 'Authors.', nullable: true })
  authors!: string | null;

  @ApiPropertyOptional({ description: 'Publication.', nullable: true })
  publication!: string | null;

  @ApiPropertyOptional({ description: 'Published year.', nullable: true })
  publishedYear!: number | null;

  @ApiPropertyOptional({ description: 'DOI.', nullable: true })
  doi!: string | null;

  @ApiPropertyOptional({ description: 'URL.', nullable: true })
  url!: string | null;
}
