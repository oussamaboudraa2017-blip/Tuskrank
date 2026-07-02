import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Building2, Globe, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { LoadingPage } from '@/components/Loading';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScoreBadge } from '@/components/ScoreBadge';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { useBrandDetail, useProductList } from '@/lib/queries';
import { formatDate } from '@/lib/utils';
import type { BrandDetail } from '@/lib/types';

export default function BrandsDetailPage({ slug }: { slug: string }) {
  const brand = useBrandDetail(slug);
  const brandId = brand.data?.data?.id ?? '';
  const products = useProductList({ brandId, limit: '20' });

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {brand.isLoading && <LoadingPage />}
        {brand.isError && (
          <ErrorDisplay
            title="Brand not found"
            message={brand.error?.message ?? 'This brand could not be loaded.'}
            onRetry={() => brand.refetch()}
          />
        )}
        {brand.data && (
          <BrandDetailContent
            brand={brand.data.data}
            products={products.data?.data ?? []}
            productsLoading={products.isLoading}
          />
        )}
      </div>
    </MainLayout>
  );
}

function BrandDetailContent({
  brand: b,
  products,
  productsLoading,
}: {
  brand: BrandDetail;
  // @ts-ignore
  products: any[];
  productsLoading: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground transition-colors">
          Search
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{b.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">{b.name}</h1>
            </div>
            {b.manufacturer && (
              <p className="text-muted-foreground">{b.manufacturer}</p>
            )}
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About</CardTitle>
            </CardHeader>
            <CardContent>
              {b.description ? (
                <p className="text-muted-foreground leading-relaxed">{b.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No description available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Products */}
          <div>
            <h2 className="text-xl font-bold mb-4">
              Products
              {products.length > 0 && (
                <span className="text-muted-foreground font-normal ml-1">({products.length})</span>
              )}
            </h2>
            {productsLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}
            {!productsLoading && products.length === 0 && (
              <EmptyState
                title="No products"
                message="No products found for this brand."
              />
            )}
            {!productsLoading && products.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {products.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score */}
          {b.avgScore !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ScoreBadge score={b.avgScore} size="lg" />
              </CardContent>
            </Card>
          )}

          {/* Brand Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Products" value={String(b.productCount)} />
              <InfoRow
                label="Avg Score"
                value={b.avgScore !== null ? `${b.avgScore.toFixed(1)}/100` : '—'}
              />
              <InfoRow label="Country" value={b.countryCode ?? '—'} />
              {b.websiteUrl && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Website</span>
                  <a
                    href={b.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-medium text-primary hover:underline"
                  >
                    <Globe className="h-3 w-3" />
                    Visit
                  </a>
                </div>
              )}
              <InfoRow
                label="Status"
                value={
                  <Badge
                    variant={b.isActive ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {b.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                }
              />
              <InfoRow label="Created" value={formatDate(b.createdAt)} />
            </CardContent>
          </Card>

          {/* See All */}
          <Link href="/search" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Browse all brands
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
