'use client';

import { use } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { useBrandDetail, useProductList } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function BrandPage({ params }: Props) {
  const { slug } = use(params);
  const brand = useBrandDetail(slug);
  const brandId = brand.data?.data?.id ?? '';

  const products = useProductList(
    { brandId, limit: '20' },
  );

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-[var(--text-secondary)]">
          <Link href="/search" className="hover:text-[var(--text)]">Search</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text)]">Loading...</span>
        </nav>

        {brand.isLoading && <LoadingSpinner size="lg" />}

        {brand.isError && (
          <ErrorDisplay
            title="Brand not found"
            message={brand.error?.message ?? 'This brand could not be loaded.'}
            onRetry={() => brand.refetch()}
          />
        )}

        {brand.data && (
          <BrandDetail
            brand={brand.data.data}
            products={products.data?.data ?? []}
            productsLoading={products.isLoading}
          />
        )}
      </div>
    </MainLayout>
  );
}

function BrandDetail({
  brand: b,
  products,
  productsLoading,
}: {
  brand: import('@/lib/types').BrandDetail;
  products: import('@/lib/types').ProductListItem[];
  productsLoading: boolean;
}) {
  return (
    <>
      <nav className="mb-6 text-sm text-[var(--text-secondary)]">
        <Link href="/search" className="hover:text-[var(--text)]">Search</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text)]">{b.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{b.name}</h1>
            {b.manufacturer && <p className="mt-1 text-[var(--text-secondary)]">{b.manufacturer}</p>}
          </div>

          {b.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">About</h2>
              <p className="text-[var(--text-secondary)]">{b.description}</p>
            </div>
          )}

          {!b.description && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center text-[var(--text-secondary)]">
              No description available for this brand.
            </div>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold">Products</h2>
            {productsLoading && <LoadingSpinner />}
            {!productsLoading && products.length === 0 && (
              <EmptyState title="No products" message="No products found for this brand." />
            )}
            {!productsLoading && products.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="group rounded-xl border bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold group-hover:text-[var(--ring)]">{p.name}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">{p.foodForm ?? '—'}</p>
                      </div>
                      {p.currentScore !== null && (
                        <span className="text-sm font-bold">{p.currentScore}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-[var(--bg-card)] p-6 space-y-3">
            <InfoRow label="Products" value={String(b.productCount)} />
            <InfoRow label="Avg Score" value={b.avgScore !== null ? `${b.avgScore.toFixed(1)}/100` : '—'} />
            <InfoRow label="Country" value={b.countryCode ?? '—'} />
            {b.websiteUrl && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Website</span>
                <a href={b.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--ring)] hover:underline">
                  Visit
                </a>
              </div>
            )}
            <InfoRow label="Status" value={b.isActive ? 'Active' : 'Inactive'} />
            <InfoRow label="Created" value={formatDate(b.createdAt)} />
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
