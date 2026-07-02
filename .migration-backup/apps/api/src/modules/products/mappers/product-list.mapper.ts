import type { ProductEntity } from '../entities';
import type { ProductScoreView, ProductScoreSummaryDto } from '../dto/product-score-summary.dto';
import { ProductListItemDto as ProductListItemDtoClass } from '../dto/product-list-item.dto';

/**
 * ProductEntity → ProductListItemDto mapper.
 *
 * Stripe-style split:
 *   - The mapper accepts an *entity* (DB / repository shape).
 *   - The mapper accepts a *score view* (materialised view row — see
 *     `database/schema.sql`'s `mv_top_rated_products` and the live
 *     `v_top_rated_products` view; alternatively a slice of
 *     `product_scores`).
 *   - The mapper is the ONLY place that knows how to merge the two.
 *
 * Score is undefined when the entity isn't ranked yet (newly created,
 *   scoring pipeline hasn't run); the DTO exposes nullable score fields.
 */
export interface ProductListItemMapperInput {
  readonly product: ProductEntity;
  readonly score: ProductScoreView | null;
}

export function productEntityToListItemDto({
  product,
  score,
}: ProductListItemMapperInput): ProductListItemDtoClass {
  const dto = new ProductListItemDtoClass();
  dto.id = product.id;
  dto.slug = product.slug;
  dto.name = product.name;
  // Brand is guaranteed to be present after the join; the type allows
  // it to be absent for repository-only paths. Bail with an obvious
  // surface-area bug rather than silently degrade.
  if (!product.brand) {
    throw new Error(
      'productEntityToListItemDto: brand was not joined; the repository must load it.',
    );
  }
  dto.brand = {
    id: product.brand.id,
    name: product.brand.name,
    slug: product.brand.slug,
    countryCode: product.brand.countryCode ?? null,
    logoImageUrl: product.brand.logoImageUrl ?? null,
    isActive: product.brand.isActive,
  };
  dto.foodForm = product.foodForm?.slug ?? null;
  dto.primaryProteinSource = product.primaryProteinSource?.slug ?? null;
  dto.packageSizeGrams = product.packageSizeGrams
    ? Number(product.packageSizeGrams)
    : null;
  dto.packageSizeLabel = product.packageSizeLabel ?? null;
  dto.isActive = product.isActive;
  dto.isPublished = product.publishedAt !== null;
  dto.publishedAt = product.publishedAt ? product.publishedAt.toISOString() : null;
  dto.currentScore = score ? toNumber(score.overall) : null;
  dto.currentGrade = score?.grade ?? null;
  dto.scoringVersion = score?.scoringVersion ?? null;
  return dto;
}

/**
 * Helper to project a score-view row to the wire score summary.
 *
 * Used both inline by the list mapper and (later, in Sprint 2B+) by
 * the detail mapper — same source shape.
 */
export function productScoreSummaryFromView(
  score: ProductScoreView | null,
): ProductScoreSummaryDto {
  return {
    overall: score ? toNumber(score.overall) : null,
    quality: score ? toNumber(score.quality) : null,
    safety: score ? toNumber(score.safety) : null,
    nutrition: score ? toNumber(score.nutrition) : null,
    transparency: score ? toNumber(score.transparency) : null,
    scoringVersion: score?.scoringVersion ?? null,
  };
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? n : null;
}
