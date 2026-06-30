import { Injectable, Logger } from '@nestjs/common';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import type {
  IngredientRow, IngredientCategoryRow, IngredientScoreRow,
  ProductIngredientRow, IngredientReferenceRow,
} from './domain/mapping/ingredient.db-model';
import type { IngredientQuery, IngredientSearchInput } from './domain/interfaces';
import { IngredientSortField, SortOrder } from './domain/enums';
import { INGREDIENT_BOUNDS } from './domain/constants';

@Injectable()
export class IngredientsReadRepository extends BaseRepository {
  protected readonly tableName = 'ingredients';

  private readonly logger = new Logger(IngredientsReadRepository.name);

  private static readonly SORT_FIELD_MAP: Record<string, string> = {
    [IngredientSortField.CreatedAt]: 'i.created_at',
    [IngredientSortField.Name]: 'i.name',
    [IngredientSortField.CanonicalName]: 'i.canonical_name',
    [IngredientSortField.Score]: 'COALESCE(s.score, 0)',
  };

  private baseQuery(): string {
    return `
      SELECT
        i.id, i.name, i.slug, i.inci_name, i.category_id,
        i.canonical_name, i.description,
        i.is_animal_derived, i.is_common_allergen, i.is_controversial,
        i.is_active, i.created_at, i.updated_at, i.deleted_at,
        c.id AS category_id_joined, c.name AS category_name, c.slug AS category_slug,
        s.id AS score_id, s.score AS score_value, s.grade AS score_grade,
        s.reasoning AS score_reasoning, s.scoring_version AS score_scoring_version,
        (SELECT COUNT(*)::int FROM product_ingredients pi
         WHERE pi.ingredient_id = i.id AND pi.deleted_at IS NULL) AS product_count
      FROM ingredients i
      LEFT JOIN ingredient_categories c ON c.id = i.category_id AND c.deleted_at IS NULL
      LEFT JOIN ingredient_scores s ON s.ingredient_id = i.id AND s.is_current AND s.deleted_at IS NULL
    `;
  }

  private buildFilters(filters: IngredientQuery['filters']): {
    conditions: string[];
    values: unknown[];
  } {
    const conditions: string[] = ['i.deleted_at IS NULL'];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.q) {
      values.push(filters.q);
      conditions.push(
        `(i.name ILIKE '%' || $${idx} || '%' OR i.canonical_name ILIKE '%' || $${idx} || '%' OR i.inci_name ILIKE '%' || $${idx} || '%')`,
      );
      idx++;
    }

    if (filters.categoryId) {
      values.push(filters.categoryId);
      conditions.push(`i.category_id = $${idx}`);
      idx++;
    }

    if (filters.isAnimalDerived !== undefined) {
      values.push(filters.isAnimalDerived);
      conditions.push(`i.is_animal_derived = $${idx}`);
      idx++;
    }

    if (filters.isCommonAllergen !== undefined) {
      values.push(filters.isCommonAllergen);
      conditions.push(`i.is_common_allergen = $${idx}`);
      idx++;
    }

    if (filters.isControversial !== undefined) {
      values.push(filters.isControversial);
      conditions.push(`i.is_controversial = $${idx}`);
      idx++;
    }

    if (filters.isActive !== undefined) {
      values.push(filters.isActive);
      conditions.push(`i.is_active = $${idx}`);
      idx++;
    }

    if (filters.minScore !== undefined) {
      values.push(filters.minScore);
      conditions.push('s.score >= $1 AND s.is_current AND s.deleted_at IS NULL');
      idx++;
    }

    if (filters.maxScore !== undefined) {
      values.push(filters.maxScore);
      conditions.push('s.score <= $1 AND s.is_current AND s.deleted_at IS NULL');
      idx++;
    }

    return { conditions, values };
  }

  async findById(id: Uuid, options: { includeSoftDeleted?: boolean } = {}): Promise<IngredientRow | null> {
    const conditions = ['i.id = $1'];
    if (!options.includeSoftDeleted) {
      conditions.push('i.deleted_at IS NULL');
    }
    const sql = `${this.baseQuery()} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query<IngredientRow>(sql, [id]);
    return result.rows[0] ?? null;
  }

  async findBySlug(slug: string, options: { includeSoftDeleted?: boolean } = {}): Promise<IngredientRow | null> {
    const conditions = ['i.slug = $1'];
    if (!options.includeSoftDeleted) {
      conditions.push('i.deleted_at IS NULL');
    }
    const sql = `${this.baseQuery()} WHERE ${conditions.join(' AND ')}`;
    const result = await this.query<IngredientRow>(sql, [slug]);
    return result.rows[0] ?? null;
  }

  async findMany(query: IngredientQuery): Promise<IngredientRow[]> {
    const { conditions, values } = this.buildFilters(query.filters);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const sortCol = IngredientsReadRepository.SORT_FIELD_MAP[query.sort.by] ?? 'i.name';
    const sortDir = query.sort.order === SortOrder.Asc ? 'ASC' : 'DESC';
    const nullsSort = query.sort.by === IngredientSortField.Score ? ' NULLS LAST' : '';

    const limit = query.pagination.limit;
    const offset = (query.pagination.page - 1) * limit;

    values.push(limit, offset);
    const sql = `
      ${this.baseQuery()}
      ${where}
      ORDER BY ${sortCol} ${sortDir}${nullsSort}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const result = await this.query<IngredientRow>(sql, values);
    return result.rows;
  }

  async count(filters: IngredientQuery['filters']): Promise<number> {
    const { conditions, values } = this.buildFilters(filters);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const sql = `
      SELECT COUNT(DISTINCT i.id)::int AS total
      FROM ingredients i
      LEFT JOIN ingredient_scores s ON s.ingredient_id = i.id AND s.is_current AND s.deleted_at IS NULL
      ${where}
    `;
    const result = await this.query<{ total: number }>(sql, values);
    return result.rows[0]?.total ?? 0;
  }

  async search(input: IngredientSearchInput): Promise<{ items: IngredientRow[]; total: number }> {
    const conditions = [
      'i.deleted_at IS NULL',
      'i.is_active = true',
      `(i.name ILIKE '%' || $1 || '%' OR i.canonical_name ILIKE '%' || $1 || '%' OR i.inci_name ILIKE '%' || $1 || '%')`,
    ];

    const limit = input.limit ?? INGREDIENT_BOUNDS.defaultLimit;
    const offset = ((input.page ?? 1) - 1) * limit;

    const countSql = `
      SELECT COUNT(DISTINCT i.id)::int AS total
      FROM ingredients i
      LEFT JOIN ingredient_scores s ON s.ingredient_id = i.id AND s.is_current AND s.deleted_at IS NULL
      WHERE ${conditions.join(' AND ')}
    `;
    const countResult = await this.query<{ total: number }>(countSql, [input.q]);
    const total = countResult.rows[0]?.total ?? 0;

    const values: unknown[] = [input.q, limit, offset];
    const sql = `
      ${this.baseQuery()}
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.name ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.query<IngredientRow>(sql, values);
    return { items: result.rows, total };
  }

  async findCategoryById(id: Uuid): Promise<IngredientCategoryRow | null> {
    const sql = `SELECT id, slug, name, description, parent_id, sort_order, is_active, created_at, updated_at, deleted_at FROM ingredient_categories WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.query<IngredientCategoryRow>(sql, [id]);
    return result.rows[0] ?? null;
  }

  async findCategoryBySlug(slug: string): Promise<IngredientCategoryRow | null> {
    const sql = `SELECT id, slug, name, description, parent_id, sort_order, is_active, created_at, updated_at, deleted_at FROM ingredient_categories WHERE slug = $1 AND deleted_at IS NULL`;
    const result = await this.query<IngredientCategoryRow>(sql, [slug]);
    return result.rows[0] ?? null;
  }

  async findCategories(): Promise<IngredientCategoryRow[]> {
    const sql = `SELECT id, slug, name, description, parent_id, sort_order, is_active, created_at, updated_at, deleted_at FROM ingredient_categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, name ASC`;
    const result = await this.query<IngredientCategoryRow>(sql);
    return result.rows;
  }

  async countCategoryChildren(categoryId: Uuid): Promise<number> {
    const sql = `SELECT COUNT(*)::int AS total FROM ingredient_categories WHERE parent_id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ total: number }>(sql, [categoryId]);
    return result.rows[0]?.total ?? 0;
  }

  async countCategoryIngredients(categoryId: Uuid): Promise<number> {
    const sql = `SELECT COUNT(*)::int AS total FROM ingredients WHERE category_id = $1 AND deleted_at IS NULL`;
    const result = await this.query<{ total: number }>(sql, [categoryId]);
    return result.rows[0]?.total ?? 0;
  }

  async getCategoryDepth(parentId: Uuid): Promise<number> {
    const sql = `
      WITH RECURSIVE chain AS (
        SELECT id, parent_id, 1 AS depth FROM ingredient_categories WHERE id = $1 AND deleted_at IS NULL
        UNION ALL
        SELECT ic.id, ic.parent_id, ch.depth + 1 FROM ingredient_categories ic JOIN chain ch ON ic.id = ch.parent_id WHERE ic.deleted_at IS NULL
      )
      SELECT MAX(depth) AS max_depth FROM chain
    `;
    const result = await this.query<{ max_depth: number }>(sql, [parentId]);
    return result.rows[0]?.max_depth ?? 0;
  }

  async findCurrentScore(ingredientId: Uuid): Promise<IngredientScoreRow | null> {
    const sql = `SELECT id, ingredient_id, score, grade, reasoning, scoring_version, is_current, created_at, updated_at, deleted_at FROM ingredient_scores WHERE ingredient_id = $1 AND is_current AND deleted_at IS NULL`;
    const result = await this.query<IngredientScoreRow>(sql, [ingredientId]);
    return result.rows[0] ?? null;
  }

  async findScoreHistory(ingredientId: Uuid, limit = 20): Promise<IngredientScoreRow[]> {
    const sql = `SELECT id, ingredient_id, score, grade, reasoning, scoring_version, is_current, created_at, updated_at, deleted_at FROM ingredient_scores WHERE ingredient_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2`;
    const result = await this.query<IngredientScoreRow>(sql, [ingredientId, limit]);
    return result.rows;
  }

  async findRelatedProducts(
    ingredientId: Uuid,
    options: { limit?: number; offset?: number } = {},
  ): Promise<ProductIngredientRow[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const sql = `
      SELECT
        pi.id AS product_ingredient_id, pi.product_id, pi.position,
        pi.raw_label, pi.is_primary, pi.percentage_value,
        i.id AS ingredient_id, i.name AS ingredient_name, i.slug AS ingredient_slug,
        i.canonical_name AS ingredient_canonical_name,
        i.is_controversial, i.is_common_allergen, i.is_animal_derived,
        s.grade AS ingredient_grade, s.score AS ingredient_score
      FROM product_ingredients pi
      JOIN products p ON p.id = pi.product_id AND p.deleted_at IS NULL AND p.is_active = true
      JOIN ingredients i ON i.id = pi.ingredient_id AND i.deleted_at IS NULL AND i.is_active = true
      LEFT JOIN ingredient_scores s ON s.ingredient_id = i.id AND s.is_current AND s.deleted_at IS NULL
      WHERE pi.ingredient_id = $1 AND pi.deleted_at IS NULL
      ORDER BY pi.position ASC
      LIMIT $2 OFFSET $3
    `;
    const result = await this.query<ProductIngredientRow>(sql, [ingredientId, limit, offset]);
    return result.rows;
  }

  async findReferences(ingredientId: Uuid): Promise<IngredientReferenceRow[]> {
    const sql = `
      SELECT ir.id, ir.ingredient_id, ir.reference_id, ir.evidence_type,
             ir.relevance_score, ir.notes,
             sr.title, sr.authors, sr.publication, sr.published_year, sr.doi, sr.url
      FROM ingredient_references ir
      JOIN scientific_references sr ON sr.id = ir.reference_id AND sr.deleted_at IS NULL
      WHERE ir.ingredient_id = $1 AND ir.deleted_at IS NULL
      ORDER BY ir.relevance_score DESC NULLS LAST
    `;
    const result = await this.query<IngredientReferenceRow>(sql, [ingredientId]);
    return result.rows;
  }

  async exists(id: Uuid, options: { excludeId?: Uuid; includeSoftDeleted?: boolean } = {}): Promise<boolean> {
    const conditions = ['i.id = $1'];
    if (!options.includeSoftDeleted) {
      conditions.push('i.deleted_at IS NULL');
    }
    const sql = `SELECT EXISTS(SELECT 1 FROM ingredients i WHERE ${conditions.join(' AND ')}) AS "exists"`;
    const result = await this.query<{ exists: boolean }>(sql, [id]);
    return result.rows[0]?.exists ?? false;
  }

  async existsBySlug(slug: string, excludeId?: Uuid): Promise<boolean> {
    const conditions = ['slug = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [slug];
    if (excludeId) {
      values.push(excludeId);
      conditions.push(`id != $${values.length}`);
    }
    const sql = `SELECT EXISTS(SELECT 1 FROM ingredients WHERE ${conditions.join(' AND ')}) AS "exists"`;
    const result = await this.query<{ exists: boolean }>(sql, values);
    return result.rows[0]?.exists ?? false;
  }

  async existsByCanonicalName(canonicalName: string, excludeId?: Uuid): Promise<boolean> {
    const conditions = ['canonical_name = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [canonicalName];
    if (excludeId) {
      values.push(excludeId);
      conditions.push(`id != $${values.length}`);
    }
    const sql = `SELECT EXISTS(SELECT 1 FROM ingredients WHERE ${conditions.join(' AND ')}) AS "exists"`;
    const result = await this.query<{ exists: boolean }>(sql, values);
    return result.rows[0]?.exists ?? false;
  }

  async existsByCategorySlug(slug: string, excludeId?: Uuid): Promise<boolean> {
    const conditions = ['slug = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [slug];
    if (excludeId) {
      values.push(excludeId);
      conditions.push(`id != $${values.length}`);
    }
    const sql = `SELECT EXISTS(SELECT 1 FROM ingredient_categories WHERE ${conditions.join(' AND ')}) AS "exists"`;
    const result = await this.query<{ exists: boolean }>(sql, values);
    return result.rows[0]?.exists ?? false;
  }
}
