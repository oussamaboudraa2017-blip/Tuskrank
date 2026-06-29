'use client';

import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { useProductList, useBrandFeatured, useIngredientCategories } from '@/lib/queries';

export default function HomePage() {
  const products = useProductList({ limit: '6', sortBy: 'overall_score', sortOrder: 'desc' });
  const brands = useBrandFeatured(6);
  const categories = useIngredientCategories();

  return (
    <MainLayout>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Pet Food Intelligence
          </h1>
          <p className="mt-6 text-lg text-[var(--text-secondary)]">
            Search, compare, and score pet food products. Ingredient transparency backed by data
            and science.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/search"
              className="inline-flex items-center rounded-lg bg-[var(--ring)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              Search Products
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-6 py-3 text-sm font-semibold hover:bg-[var(--bg-secondary)]"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold">Top Rated Products</h2>
          {products.isLoading && <LoadingSpinner />}
          {products.isError && (
            <ErrorDisplay
              message={products.error?.message ?? 'Failed to load products'}
              onRetry={() => products.refetch()}
            />
          )}
          {products.data && products.data.data.length === 0 && (
            <EmptyState title="No products yet" message="Products will appear here once added." />
          )}
          {products.data && products.data.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.data.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold">Featured Brands</h2>
          {brands.isLoading && <LoadingSpinner />}
          {brands.isError && (
            <ErrorDisplay
              message={brands.error?.message ?? 'Failed to load brands'}
              onRetry={() => brands.refetch()}
            />
          )}
          {brands.data && brands.data.length === 0 && (
            <EmptyState title="No brands yet" message="Featured brands will appear here." />
          )}
          {brands.data && brands.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brands.data.map((b) => (
                <Link
                  key={b.id}
                  href={`/brands/${b.slug}`}
                  className="group rounded-xl border bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-md"
                >
                  <h3 className="font-semibold group-hover:text-[var(--ring)]">{b.name}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {b.productCount} products{b.avgScore !== null ? ` · ${b.avgScore.toFixed(1)} avg` : ''}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t bg-[var(--bg-secondary)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="mb-8 text-2xl font-bold">Ingredient Categories</h2>
          {categories.isLoading && <LoadingSpinner />}
          {categories.isError && (
            <ErrorDisplay
              message={categories.error?.message ?? 'Failed to load categories'}
              onRetry={() => categories.refetch()}
            />
          )}
          {categories.data && categories.data.length === 0 && (
            <EmptyState title="No categories yet" message="Ingredient categories will appear here." />
          )}
          {categories.data && categories.data.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.data.map((c) => (
                <div key={c.id} className="rounded-xl border bg-[var(--bg-card)] p-4">
                  <h3 className="font-semibold">{c.name}</h3>
                  {c.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{c.description}</p>
                  )}
                  {c.children.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {c.children.length} subcategories
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
          <Feature
            title="Search"
            description="Full-text search across products, brands, and ingredients with intelligent ranking."
            href="/search"
          />
          <Feature
            title="Compare"
            description="Side-by-side comparison of products, ingredients, and nutritional profiles."
            href="/compare"
          />
          <Feature
            title="Score"
            description="Transparent scoring methodology based on ingredient quality, safety, and transparency."
            href="/about"
          />
        </div>
      </section>
    </MainLayout>
  );
}

function Feature({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-[var(--bg-card)] p-6 transition-shadow hover:shadow-md"
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
    </Link>
  );
}
