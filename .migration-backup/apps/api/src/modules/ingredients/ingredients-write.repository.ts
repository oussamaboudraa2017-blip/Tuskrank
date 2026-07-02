import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import { BaseRepository } from '@database';
import type { Uuid } from '@types';
import type {
  IngredientRow, IngredientCategoryRow, IngredientScoreRow,
} from './domain/mapping/ingredient.db-model';

@Injectable()
export class IngredientsWriteRepository extends BaseRepository {
  protected readonly tableName = 'ingredients';

  create(
    data: {
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
    },
    client?: PoolClient,
  ): Promise<IngredientRow> {
    return this.exec<IngredientRow>(
      `INSERT INTO ingredients (name, slug, inci_name, category_id, canonical_name, description, is_animal_derived, is_common_allergen, is_controversial, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        data.name, data.slug ?? null, data.inciName ?? null,
        data.categoryId ?? null, data.canonicalName, data.description ?? null,
        data.isAnimalDerived ?? false, data.isCommonAllergen ?? false,
        data.isControversial ?? false, data.isActive ?? true,
      ],
      client,
    ).then((r) => r.rows[0]);
  }

  update(
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
    client?: PoolClient,
  ): Promise<IngredientRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { setClauses.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.inciName !== undefined) { setClauses.push(`inci_name = $${idx++}`); values.push(data.inciName); }
    if (data.categoryId !== undefined) { setClauses.push(`category_id = $${idx++}`); values.push(data.categoryId); }
    if (data.canonicalName !== undefined) { setClauses.push(`canonical_name = $${idx++}`); values.push(data.canonicalName); }
    if (data.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(data.description); }
    if (data.isAnimalDerived !== undefined) { setClauses.push(`is_animal_derived = $${idx++}`); values.push(data.isAnimalDerived); }
    if (data.isCommonAllergen !== undefined) { setClauses.push(`is_common_allergen = $${idx++}`); values.push(data.isCommonAllergen); }
    if (data.isControversial !== undefined) { setClauses.push(`is_controversial = $${idx++}`); values.push(data.isControversial); }
    if (data.isActive !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    return this.exec<IngredientRow>(
      `UPDATE ingredients SET ${setClauses.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values,
      client,
    ).then((r) => r.rows[0]);
  }

  async softDelete(id: Uuid, client?: PoolClient): Promise<void> {
    await this.exec(
      `UPDATE ingredients SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [id],
      client,
    );
  }

  async restore(id: Uuid, client?: PoolClient): Promise<void> {
    await this.exec(
      `UPDATE ingredients SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL`,
      [id],
      client,
    );
  }

  createCategory(
    data: {
      name: string;
      slug?: string;
      description?: string | null;
      parentId?: Uuid | null;
      sortOrder?: number;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<IngredientCategoryRow> {
    return this.exec<IngredientCategoryRow>(
      `INSERT INTO ingredient_categories (name, slug, description, parent_id, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        data.name, data.slug ?? null, data.description ?? null,
        data.parentId ?? null, data.sortOrder ?? 0, data.isActive ?? true,
      ],
      client,
    ).then((r) => r.rows[0]);
  }

  updateCategory(
    id: Uuid,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      parentId?: Uuid | null;
      sortOrder?: number;
      isActive?: boolean;
    },
    client?: PoolClient,
  ): Promise<IngredientCategoryRow> {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) { setClauses.push(`name = $${idx++}`); values.push(data.name); }
    if (data.slug !== undefined) { setClauses.push(`slug = $${idx++}`); values.push(data.slug); }
    if (data.description !== undefined) { setClauses.push(`description = $${idx++}`); values.push(data.description); }
    if (data.parentId !== undefined) { setClauses.push(`parent_id = $${idx++}`); values.push(data.parentId); }
    if (data.sortOrder !== undefined) { setClauses.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }
    if (data.isActive !== undefined) { setClauses.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (setClauses.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    return this.exec<IngredientCategoryRow>(
      `UPDATE ingredient_categories SET ${setClauses.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      values,
      client,
    ).then((r) => r.rows[0]);
  }

  async softDeleteCategory(id: Uuid, client?: PoolClient): Promise<void> {
    await this.exec(
      `UPDATE ingredient_categories SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL`,
      [id],
      client,
    );
  }

  async createScore(
    data: {
      ingredientId: Uuid;
      score: number;
      grade: string;
      reasoning?: string | null;
      scoringVersion: string;
    },
    client?: PoolClient,
  ): Promise<IngredientScoreRow> {
    await this.exec(
      `UPDATE ingredient_scores SET is_current = false WHERE ingredient_id = $1 AND is_current AND deleted_at IS NULL`,
      [data.ingredientId],
      client,
    );
    return this.exec<IngredientScoreRow>(
      `INSERT INTO ingredient_scores (ingredient_id, score, grade, reasoning, scoring_version, is_current)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [data.ingredientId, data.score, data.grade, data.reasoning ?? null, data.scoringVersion],
      client,
    ).then((r) => r.rows[0]);
  }

  private exec<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values: ReadonlyArray<unknown>,
    client?: PoolClient,
  ) {
    return client
      ? client.query<R>(text, [...values])
      : this.query<R>(text, values);
  }
}
