import Link from 'next/link';
import { ScoreBadge } from '@/components/ScoreBadge';
import type { ProductListItem } from '@/lib/types';

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl border bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold group-hover:text-[var(--ring)]">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{product.brand.name}</p>
        </div>
        <ScoreBadge score={product.currentScore} size="sm" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
        {product.foodForm && <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5">{product.foodForm}</span>}
        {product.primaryProteinSource && (
          <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5">{product.primaryProteinSource}</span>
        )}
        {product.packageSizeLabel && (
          <span className="rounded-full bg-[var(--bg-secondary)] px-2 py-0.5">{product.packageSizeLabel}</span>
        )}
      </div>
    </Link>
  );
}
