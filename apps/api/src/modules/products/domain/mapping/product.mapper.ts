import type { Uuid } from '@types';
import {
  ProductEntity,
  ProductConstructionInput,
} from '../product.entity';
import type {
  Product,
  ProductSummary,
  Brand,
  FoodForm,
  ProteinSource,
  ProductImage,
  ProductIngredientEntry,
  ProductTag,
  ProductClaim,
  ProductTargeting,
  NutritionProfile,
  ProductNutrientValue,
  ProductScore,
  ProductScoreHistoryEntry,
} from '../types';
import { ProductImageSource } from '../enums';
import type { ProductRow } from './product.db-model';
import { ProductListItemDto } from '../../dto/product-list-item.dto';
import { ProductDetailDto } from '../../dto/product-detail.dto';

/* ==================================================================
 * ProductMapper
 * ================================================================== */

/**
 * Bidirectional conversions between the three layers of the product model:
 *
 *   DB Row ── toDomain() ──► Domain Entity ── toApiDto() ──► API DTO
 *           ◄── fromApiDto()        ◄── fromDomain()
 *
 * - `dbToDomain(row)`     DB row → domain `ProductEntity` aggregate.
 * - `domainToSummary(p)`  domain `Product` → wire-list `ProductSummary`.
 * - `domainToDetail(p)`   domain `Product` → wire-detail `ProductDetailDto`.
 * - `domainToListItem(p)` domain `Product` → wire-list-row `ProductListItemDto`.
 *
 * Wire DTOs are the *only* path that touches the network. The mapper
 * is the only file that knows about them; nothing else in the module
 * imports DTOs except the controller (which the DTOs are FOR).
 *
 * Mappers are PURE FUNCTIONS. No I/O, no logging, no global state.
 * They are trivially unit-testable.
 */
export const ProductMapper = {
  /* ================================================================
   * DB → Domain
   * ================================================================ */

  /**
   * Build a `ProductEntity` (domain aggregate) from a joined DB row.
   *
   * The row is expected to be already hydrated by the SQL JOIN — we
   * never re-query here. Numeric columns come in as `string` (pg
   * `numeric`); we parse them with explicit fallback to `null` so a
   * future schema column add doesn't break the mapper.
   */
  dbToDomain(row: ProductRow): ProductEntity {
    const brand: Brand = {
      id: row.brand_id,
      name: row.brand_name,
      slug: row.brand_slug,
      manufacturer: row.brand_manufacturer,
      countryCode: row.brand_country_code,
      websiteUrl: row.brand_website_url,
      description: row.brand_description,
      logoImageUrl: row.brand_logo_image_url,
      isActive: row.brand_is_active,
    };

    const foodForm: FoodForm | null = row.food_form_id
      ? {
          id: row.food_form_id,
          slug: row.food_form_slug ?? '',
          name: row.food_form_name ?? '',
          isActive: row.food_form_is_active ?? false,
        }
      : null;

    const primaryProteinSource: ProteinSource | null = row.primary_protein_source_id
      ? {
          id: row.primary_protein_source_id,
          slug: row.protein_source_slug ?? '',
          name: row.protein_source_name ?? '',
          origin: row.protein_source_origin as ProteinSource['origin'],
          isActive: row.protein_source_is_active ?? false,
        }
      : null;

    const images: ReadonlyArray<ProductImage> = row.images.map((i) => ({
      id: i.id,
      productId: i.product_id,
      storagePath: i.storage_path,
      publicUrl: i.public_url,
      altText: i.alt_text,
      widthPx: i.width_px,
      heightPx: i.height_px,
      bytes: i.bytes,
      mimeType: i.mime_type,
      sortOrder: i.sort_order,
      isPrimary: i.is_primary,
      source: i.is_primary
        ? ProductImageSource.Brand
        : ProductImageSource.Platform,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
    }));

    const ingredientPanel: ReadonlyArray<ProductIngredientEntry> =
      row.ingredient_panel.map((p) => ({
        position: p.position,
        rawLabel: p.raw_label,
        isPrimary: p.is_primary,
        percentageValue: p.percentage_value === null ? null : Number(p.percentage_value),
        ingredient: {
          id: p.ingredient_id,
          slug: p.ingredient_slug,
          name: p.ingredient_name,
          currentScore:
            p.ingredient_current_score === null
              ? null
              : Number(p.ingredient_current_score),
          currentGrade: p.ingredient_current_grade,
          isControversial: p.ingredient_is_controversial,
          isCommonAllergen: p.ingredient_is_common_allergen,
          isAnimalDerived: p.ingredient_is_animal_derived,
        },
      }));

    const tags: ReadonlyArray<ProductTag> = row.tags.map((t) => ({
      id: t.tag_id,
      slug: t.tag_slug,
      name: t.tag_name,
    }));

    const claims: ReadonlyArray<ProductClaim> = row.claims.map((c) => ({
      id: c.claim_id,
      slug: c.claim_slug,
      name: c.claim_name,
      evidenceNote: c.evidence_note,
    }));

    const targeting: ReadonlyArray<ProductTargeting> = row.targeting.map((t) => ({
      id: t.id,
      productId: t.product_id,
      petTypeId: t.pet_type_id,
      lifeStageId: t.life_stage_id,
      breedSizeId: t.breed_size_id,
      categoryId: t.category_id,
      isActive: t.is_active,
    }));

    const nutritionProfiles: ReadonlyArray<NutritionProfile> =
      row.nutrition_profiles.map((n) => ({
        id: n.id,
        productId: n.product_id,
        kcalPer100g: n.kcal_per_100g === null ? null : Number(n.kcal_per_100g),
        kcalPerCup: n.kcal_per_cup === null ? null : Number(n.kcal_per_cup),
        moisturePct: n.moisture_pct === null ? null : Number(n.moisture_pct),
        effectiveFrom: n.effective_from,
        effectiveTo: n.effective_to,
        source: n.source,
        notes: n.notes,
      }));

    const nutrientValues: ReadonlyArray<ProductNutrientValue> =
      row.nutrient_values.map((n) => ({
        id: n.id,
        productId: n.product_id,
        nutrientId: n.nutrient_id,
        nutritionProfileId: n.nutrition_profile_id,
        amount: Number(n.amount),
        unit: n.unit,
        bound: n.bound as ProductNutrientValue['bound'],
      }));

    const score: ProductScore | null = row.score_id
      ? {
          id: row.score_id,
          productId: row.id,
          overall: row.score_overall === null ? 0 : Number(row.score_overall),
          quality: row.score_quality === null ? null : Number(row.score_quality),
          safety: row.score_safety === null ? null : Number(row.score_safety),
          nutrition:
            row.score_nutrition === null ? null : Number(row.score_nutrition),
          transparency:
            row.score_transparency === null
              ? null
              : Number(row.score_transparency),
          grade: row.score_grade,
          scoringVersion: row.score_scoring_version ?? '',
          isCurrent: row.score_is_current ?? false,
          updatedAt: row.score_updated_at ?? new Date(0),
        }
      : null;

    const scoreHistory: ReadonlyArray<ProductScoreHistoryEntry> = row.score_history.map(
      (h) => ({
        id: h.id,
        productId: h.product_id,
        overall: Number(h.overall),
        quality: h.quality === null ? null : Number(h.quality),
        safety: h.safety === null ? null : Number(h.safety),
        nutrition: h.nutrition === null ? null : Number(h.nutrition),
        transparency: h.transparency === null ? null : Number(h.transparency),
        scoringVersion: h.scoring_version,
        computedAt: h.computed_at,
        triggeredBy: h.triggered_by,
        notes: h.notes,
      }),
    );

    const input: ProductConstructionInput = {
      id: row.id,
      brandId: row.brand_id,
      brand,
      name: row.name,
      slug: row.slug,
      description: row.description,
      upc: row.upc,
      sku: row.sku,
      packageSizeGrams:
        row.package_size_grams === null ? null : Number(row.package_size_grams),
      packageSizeLabel: row.package_size_label,
      foodFormId: row.food_form_id,
      foodForm,
      primaryProteinSourceId: row.primary_protein_source_id,
      primaryProteinSource,
      isActive: row.is_active,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      score,
      scoreHistory,
      images,
      ingredientPanel,
      tags,
      claims,
      targeting,
      nutritionProfiles,
      nutrientValues,
    };

    return ProductEntity.from(input);
  },

  /* ================================================================
   * Domain → API DTO
   * ================================================================ */

  /**
   * Project a domain `Product` aggregate to a wire detail DTO.
   * Hides the difference between the rich entity and the wire shape.
   */
  domainToDetail(product: Product | ProductEntity): ProductDetailDto {
    const dto = new ProductDetailDto();
    dto.id = product.id;
    dto.slug = product.slug as unknown as string;
    dto.name = product.name;
    dto.description = product.description;
    dto.brand = {
      id: product.brand.id,
      name: product.brand.name,
      slug: product.brand.slug,
      countryCode: product.brand.countryCode,
      logoImageUrl: product.brand.logoImageUrl,
      isActive: product.brand.isActive,
    };
    dto.foodForm = product.foodForm?.slug ?? null;
    dto.primaryProteinSource = product.primaryProteinSource?.slug ?? null;
    dto.upc = product.upc as unknown as string | null;
    dto.sku = product.sku as unknown as string | null;

    // Handle both ProductEntity (packageSize value object) and Product (flat fields)
    if ('packageSize' in product && product.packageSize) {
      dto.packageSizeGrams = product.packageSize.grams;
      dto.packageSizeLabel = product.packageSize.label;
    } else {
      dto.packageSizeGrams = (product as Product).packageSizeGrams ?? null;
      dto.packageSizeLabel = (product as Product).packageSizeLabel ?? null;
    }

    dto.isActive = product.isActive;
    dto.isPublished = product.publishedAt !== null;
    dto.publishedAt = product.publishedAt
      ? product.publishedAt.toISOString()
      : null;
    dto.images = product.images.map((i) => ({
      id: i.id,
      publicUrl: i.publicUrl,
      altText: i.altText,
      widthPx: i.widthPx,
      heightPx: i.heightPx,
      sortOrder: i.sortOrder,
      isPrimary: i.isPrimary,
    }));
    dto.tags = product.tags.map((t) => ({ id: t.id, slug: t.slug, name: t.name }));
    dto.claims = product.claims.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      evidenceNote: c.evidenceNote,
    }));
    const np = product.nutritionProfiles[0] ?? null;
    dto.nutritionProfile = np
      ? {
          kcalPer100g: np.kcalPer100g,
          kcalPerCup: np.kcalPerCup,
          moisturePct: np.moisturePct,
          effectiveFrom: np.effectiveFrom,
          effectiveTo: np.effectiveTo,
          source: np.source,
        }
      : null;
    dto.currentScore = {
      overall: product.score?.overall ?? null,
      quality: product.score?.quality ?? null,
      safety: product.score?.safety ?? null,
      nutrition: product.score?.nutrition ?? null,
      transparency: product.score?.transparency ?? null,
      scoringVersion: product.score?.scoringVersion ?? null,
    };
    dto.ingredients = null;
    dto.ingredientCount = product.ingredientPanel.length;
    dto.alternativesCount = 0;
    dto.createdAt = product.createdAt.toISOString();
    dto.updatedAt = product.updatedAt.toISOString();
    return dto;
  },

  /**
   * Project a domain `Product` aggregate to a wire list-row DTO.
   */
  domainToListItem(product: Product | ProductEntity): ProductListItemDto {
    const dto = new ProductListItemDto();
    dto.id = product.id;
    dto.slug = product.slug as unknown as string;
    dto.name = product.name;
    dto.brand = {
      id: product.brand.id,
      name: product.brand.name,
      slug: product.brand.slug,
      countryCode: product.brand.countryCode,
      logoImageUrl: product.brand.logoImageUrl,
      isActive: product.brand.isActive,
    };
    dto.foodForm = product.foodForm?.slug ?? null;
    dto.primaryProteinSource = product.primaryProteinSource?.slug ?? null;

    // Handle both ProductEntity (packageSize value object) and Product (flat fields)
    if ('packageSize' in product && product.packageSize) {
      dto.packageSizeGrams = product.packageSize.grams;
      dto.packageSizeLabel = product.packageSize.label;
    } else {
      dto.packageSizeGrams = (product as Product).packageSizeGrams ?? null;
      dto.packageSizeLabel = (product as Product).packageSizeLabel ?? null;
    }

    dto.isActive = product.isActive;
    dto.isPublished = product.publishedAt !== null;
    dto.publishedAt = product.publishedAt
      ? product.publishedAt.toISOString()
      : null;
    dto.currentScore = product.score?.overall ?? null;
    dto.currentGrade = product.score?.grade ?? null;
    dto.scoringVersion = product.score?.scoringVersion ?? null;
    return dto;
  },

  /**
   * Project a domain `Product` aggregate to the lightweight summary
   * shape (used by list endpoints; smaller than `ProductListItemDto`).
   */
  domainToSummary(product: Product | ProductEntity): ProductSummary {
    return {
      id: product.id,
      brandId: product.brandId,
      brand: product.brand,
      name: product.name,
      slug: product.slug as unknown as string,
      foodForm: product.foodForm,
      primaryProteinSource: product.primaryProteinSource,
      packageSizeGrams: 'packageSize' in product
        ? (product.packageSize?.grams ?? null)
        : (product as Product).packageSizeGrams ?? null,
      packageSizeLabel: 'packageSize' in product
        ? (product.packageSize?.label ?? null)
        : (product as Product).packageSizeLabel ?? null,
      isActive: product.isActive,
      publishedAt: product.publishedAt,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      score: product.score,
      currentGrade: product.score?.grade ?? null,
    };
  },
} as const;
