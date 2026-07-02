import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { BrandsReadRepository, BrandRow } from '@modules/brands/brands.repository';
import type { Uuid } from '@types';

@Injectable({ scope: Scope.REQUEST })
export class BrandLoader {
  private readonly loader: DataLoader<Uuid, BrandRow | null>;

  constructor(private readonly repo: BrandsReadRepository) {
    this.loader = new DataLoader<Uuid, BrandRow | null>(
      async (ids: readonly Uuid[]) => {
        const rows = await this.repo.findByIds([...ids]);
        const map = new Map<string, BrandRow>();
        for (const row of rows) {
          map.set(row.id, row);
        }
        return ids.map((id) => map.get(id as string) ?? null);
      },
    );
  }

  load(id: Uuid): Promise<BrandRow | null> {
    return this.loader.load(id);
  }
}
