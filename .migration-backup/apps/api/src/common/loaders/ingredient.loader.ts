import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { IngredientsReadRepository } from '@modules/ingredients/ingredients.repository';
import type { IngredientRow } from '@modules/ingredients/domain/mapping/ingredient.db-model';
import type { Uuid } from '@types';

@Injectable({ scope: Scope.REQUEST })
export class IngredientLoader {
  private readonly loader: DataLoader<Uuid, IngredientRow | null>;

  constructor(private readonly repo: IngredientsReadRepository) {
    this.loader = new DataLoader<Uuid, IngredientRow | null>(
      async (ids: readonly Uuid[]) => {
        const rows = await this.repo.findByIds([...ids]);
        const map = new Map<string, IngredientRow>();
        for (const row of rows) {
          map.set(row.id, row);
        }
        return ids.map((id) => map.get(id as string) ?? null);
      },
    );
  }

  load(id: Uuid): Promise<IngredientRow | null> {
    return this.loader.load(id);
  }
}
