import { Injectable, Logger } from '@nestjs/common';
import { IngredientsReadRepository, IngredientsWriteRepository } from './ingredients.repository';
import { IngredientMapper } from './domain/mapping';
import type { IngredientQuery, IngredientSearchInput } from './domain/interfaces';
import type { IngredientSortField, SortOrder } from './domain/enums';
import {
  IngredientNotFoundError,
  IngredientCategoryNotFoundError,
  IngredientSlugCollisionError,
  IngredientCanonicalNameCollisionError,
  IngredientCategorySlugCollisionError,
  IngredientCategoryHasChildrenError,
  IngredientCategoryHasIngredientsError,
  IngredientCategoryMaxDepthError,
  IngredientInvalidLifecycleTransitionError,
} from './domain/errors';
import { INGREDIENT_BOUNDS } from './domain/constants';
import type { Uuid } from '@types';

/**
 * Ingredients service — business orchestration.
 *
 * The ONLY layer that calls the repository. Throws typed domain errors.
 */
@Injectable()
export class IngredientsService {
  private readonly logger = new Logger(IngredientsService.name);

  constructor(
    private readonly readRepo: IngredientsReadRepository,
    private readonly writeRepo: IngredientsWriteRepository,
  ) {}

  /* ================================================================
   * Read methods
   * ================================================================ */

  async findBySlug(slug: string) {
    const row = await this.readRepo.findBySlug(slug);
    if (!row) throw new IngredientNotFoundError(slug);
    return IngredientMapper.rowToIngredient(row);
  }

  async findById(id: Uuid) {
    const row = await this.readRepo.findById(id);
    if (!row) throw new IngredientNotFoundError(id);
    return IngredientMapper.rowToIngredient(row);
  }

  async list(query: IngredientQuery) {
    const [rows, total] = await Promise.all([
      this.readRepo.findMany(query),
      this.readRepo.count(query.filters),
    ]);
    const summaries = rows.map((r) => IngredientMapper.rowToSummary(r));
    return { items: summaries, total };
  }

  async search(input: IngredientSearchInput) {
    const { items: rows, total } = await this.readRepo.search(input);
    const summaries = rows.map((r) => IngredientMapper.rowToSummary(r));
    return { items: summaries, total };
  }

  /* ================================================================
   * Category methods
   * ================================================================ */

  async findCategoryById(id: Uuid) {
    const row = await this.readRepo.findCategoryById(id);
    if (!row) throw new IngredientCategoryNotFoundError(id);
    return IngredientMapper.rowToCategory(row);
  }

  async findCategoryBySlug(slug: string) {
    const row = await this.readRepo.findCategoryBySlug(slug);
    if (!row) throw new IngredientCategoryNotFoundError(slug);
    return IngredientMapper.rowToCategory(row);
  }

  async listCategories() {
    const rows = await this.readRepo.findCategories();
    const categories = rows.map((r) => IngredientMapper.rowToCategory(r));
    return IngredientMapper.buildCategoryTree(categories);
  }

  /* ================================================================
   * Related data
   * ================================================================ */

  async findRelatedProducts(ingredientId: Uuid, options: { limit?: number; offset?: number } = {}) {
    await this.findById(ingredientId); // verify exists
    const rows = await this.readRepo.findRelatedProducts(ingredientId, options);
    return rows.map((r) => IngredientMapper.rowToProductIngredientEntry(r));
  }

  async findReferences(ingredientId: Uuid) {
    await this.findById(ingredientId); // verify exists
    const rows = await this.readRepo.findReferences(ingredientId);
    return rows.map((r) => IngredientMapper.rowToReference(r));
  }

  async findScoreHistory(ingredientId: Uuid) {
    await this.findById(ingredientId); // verify exists
    return this.readRepo.findScoreHistory(ingredientId);
  }

  /* ================================================================
   * Mutation methods
   * ================================================================ */

  async create(data: {
    name: string;
    slug?: string;
    inciName?: string | null;
    categoryId?: Uuid | null;
    canonicalName: string;
    description?: string | null;
    isAnimalDerived?: boolean;
    isCommonAllergen?: boolean;
    isControversial?: boolean;
    isActive?: boolean;
  }) {
    // Check slug uniqueness
    const slug = data.slug ?? this.slugify(data.name);
    if (await this.readRepo.existsBySlug(slug)) {
      throw new IngredientSlugCollisionError(slug);
    }

    // Check canonical name uniqueness
    if (await this.readRepo.existsByCanonicalName(data.canonicalName)) {
      throw new IngredientCanonicalNameCollisionError(data.canonicalName);
    }

    const row = await this.writeRepo.create({ ...data, slug });
    this.logger.log(`Created ingredient ${row.id} (${row.name})`);
    return IngredientMapper.rowToIngredient(row);
  }

  async update(
    id: Uuid,
    data: {
      name?: string;
      slug?: string;
      inciName?: string | null;
      categoryId?: Uuid | null;
      canonicalName?: string;
      description?: string | null;
      isAnimalDerived?: boolean;
      isCommonAllergen?: boolean;
      isControversial?: boolean;
      isActive?: boolean;
    },
  ) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new IngredientNotFoundError(id);

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      if (await this.readRepo.existsBySlug(data.slug, id)) {
        throw new IngredientSlugCollisionError(data.slug);
      }
    }

    // Check canonical name uniqueness if changed
    if (data.canonicalName && data.canonicalName !== existing.canonical_name) {
      if (await this.readRepo.existsByCanonicalName(data.canonicalName, id)) {
        throw new IngredientCanonicalNameCollisionError(data.canonicalName);
      }
    }

    const row = await this.writeRepo.update(id, data);
    this.logger.log(`Updated ingredient ${id}`);
    return IngredientMapper.rowToIngredient(row);
  }

  async softDelete(id: Uuid) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new IngredientNotFoundError(id);
    await this.writeRepo.softDelete(id);
    this.logger.log(`Soft-deleted ingredient ${id}`);
  }

  async restore(id: Uuid) {
    const existing = await this.readRepo.findById(id, { includeSoftDeleted: true });
    if (!existing) throw new IngredientNotFoundError(id);
    if (!existing.deleted_at) {
      throw new IngredientInvalidLifecycleTransitionError('active', 'restore');
    }
    await this.writeRepo.restore(id);
    this.logger.log(`Restored ingredient ${id}`);
    return this.findById(id);
  }

  async activate(id: Uuid) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new IngredientNotFoundError(id);
    if (existing.is_active) return IngredientMapper.rowToIngredient(existing);
    const row = await this.writeRepo.update(id, { isActive: true });
    this.logger.log(`Activated ingredient ${id}`);
    return IngredientMapper.rowToIngredient(row);
  }

  async deactivate(id: Uuid) {
    const existing = await this.readRepo.findById(id);
    if (!existing) throw new IngredientNotFoundError(id);
    if (!existing.is_active) return IngredientMapper.rowToIngredient(existing);
    const row = await this.writeRepo.update(id, { isActive: false });
    this.logger.log(`Deactivated ingredient ${id}`);
    return IngredientMapper.rowToIngredient(row);
  }

  /* ================================================================
   * Category mutations
   * ================================================================ */

  async createCategory(data: {
    name: string;
    slug?: string;
    description?: string | null;
    parentId?: Uuid | null;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const slug = data.slug ?? this.slugify(data.name);

    if (await this.readRepo.existsByCategorySlug(slug)) {
      throw new IngredientCategorySlugCollisionError(slug);
    }

    // Check parent depth
    if (data.parentId) {
      const depth = await this.readRepo.getCategoryDepth(data.parentId);
      if (depth >= INGREDIENT_BOUNDS.categoryMaxDepth) {
        throw new IngredientCategoryMaxDepthError();
      }
    }

    const row = await this.writeRepo.createCategory({ ...data, slug });
    this.logger.log(`Created ingredient category ${row.id} (${row.name})`);
    return IngredientMapper.rowToCategory(row);
  }

  async updateCategory(
    id: Uuid,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: Uuid | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.readRepo.findCategoryById(id);
    if (!existing) throw new IngredientCategoryNotFoundError(id);

    if (data.slug && data.slug !== existing.slug) {
      if (await this.readRepo.existsByCategorySlug(data.slug, id)) {
        throw new IngredientCategorySlugCollisionError(data.slug);
      }
    }

    const row = await this.writeRepo.updateCategory(id, data);
    this.logger.log(`Updated ingredient category ${id}`);
    return IngredientMapper.rowToCategory(row);
  }

  async softDeleteCategory(id: Uuid) {
    const existing = await this.readRepo.findCategoryById(id);
    if (!existing) throw new IngredientCategoryNotFoundError(id);

    const childCount = await this.readRepo.countCategoryChildren(id);
    if (childCount > 0) {
      throw new IngredientCategoryHasChildrenError();
    }

    const ingredientCount = await this.readRepo.countCategoryIngredients(id);
    if (ingredientCount > 0) {
      throw new IngredientCategoryHasIngredientsError();
    }

    await this.writeRepo.softDeleteCategory(id);
    this.logger.log(`Soft-deleted ingredient category ${id}`);
  }

  /* ================================================================
   * Score mutations
   * ================================================================ */

  async createScore(
    ingredientId: Uuid,
    data: {
      score: number;
      grade: string;
      reasoning?: string | null;
      scoringVersion: string;
    },
  ) {
    await this.findById(ingredientId); // verify exists
    const row = await this.writeRepo.createScore({ ...data, ingredientId });
    this.logger.log(`Created score for ingredient ${ingredientId}`);
    return row;
  }

  /* ================================================================
   * Query builder
   * ================================================================ */

  buildQueryFromDto(params: {
    page?: number;
    limit?: number;
    q?: string;
    categoryId?: string;
    isAnimalDerived?: boolean;
    isCommonAllergen?: boolean;
    isControversial?: boolean;
    isActive?: boolean;
    minScore?: number;
    maxScore?: number;
    sortBy?: string;
    sortOrder?: string;
  }): IngredientQuery {
    return {
      filters: {
        q: params.q,
        categoryId: params.categoryId as Uuid | undefined,
        isAnimalDerived: params.isAnimalDerived,
        isCommonAllergen: params.isCommonAllergen,
        isControversial: params.isControversial,
        isActive: params.isActive,
        minScore: params.minScore,
        maxScore: params.maxScore,
      },
      sort: {
        by: (params.sortBy as IngredientSortField) ?? INGREDIENT_BOUNDS.sortBy,
        order: (params.sortOrder as SortOrder) ?? INGREDIENT_BOUNDS.sortOrder,
      },
      pagination: {
        page: params.page ?? INGREDIENT_BOUNDS.defaultLimit,
        limit: params.limit ?? INGREDIENT_BOUNDS.defaultLimit,
        total: 0,
      },
    };
  }

  /* ================================================================
   * Private helpers
   * ================================================================ */

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
