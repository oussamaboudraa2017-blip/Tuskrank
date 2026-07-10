import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/ScoreBadge';
import type { ProductListItem } from '@/lib/types';

export function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{product.brand.name}</p>
        </div>
        <ScoreBadge score={product.currentScore} size="sm" />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {product.foodForm && (
          <Badge variant="secondary" className="text-xs">
            {product.foodForm}
          </Badge>
        )}
        {product.primaryProteinSource && (
          <Badge variant="outline" className="text-xs">
            {product.primaryProteinSource}
          </Badge>
        )}
        {product.packageSizeLabel && (
          <Badge variant="outline" className="text-xs">
            {product.packageSizeLabel}
          </Badge>
        )}
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
