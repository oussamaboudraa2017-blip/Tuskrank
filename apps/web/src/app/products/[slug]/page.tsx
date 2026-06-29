'use client';

import { use } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { ScoreBadge, ScoreBar } from '@/components/ScoreBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { useProductDetail } from '@/lib/queries';
import { formatDate } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: Props) {
  const { slug } = use(params);
  const { data, isLoading, isError, error, refetch } = useProductDetail(slug);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-[var(--text-secondary)]">
          <Link href="/search" className="hover:text-[var(--text)]">Search</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text)]">Loading...</span>
        </nav>

        {isLoading && <LoadingSpinner size="lg" />}

        {isError && (
          <ErrorDisplay
            title="Product not found"
            message={error?.message ?? 'This product could not be loaded.'}
            onRetry={() => refetch()}
          />
        )}

        {data && <ProductDetail product={data.data} />}
      </div>
    </MainLayout>
  );
}

function ProductDetail({ product: p }: { product: import('@/lib/types').ProductDetail }) {
  const score = p.currentScore;

  return (
    <>
      <nav className="mb-6 text-sm text-[var(--text-secondary)]">
        <Link href="/search" className="hover:text-[var(--text)]">Search</Link>
        <span className="mx-2">/</span>
        <Link href={`/brands/${p.brand.slug}`} className="hover:text-[var(--text)]">{p.brand.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text)]">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{p.name}</h1>
            <p className="mt-1 text-lg text-[var(--text-secondary)]">{p.brand.name}</p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
            {p.foodForm && <Info label="Form" value={p.foodForm} />}
            {p.primaryProteinSource && <Info label="Protein" value={p.primaryProteinSource} />}
            {p.packageSizeLabel && <Info label="Size" value={p.packageSizeLabel} />}
            {p.upc && <Info label="UPC" value={p.upc} />}
            {p.sku && <Info label="SKU" value={p.sku} />}
            <Info label="Published" value={formatDate(p.publishedAt)} />
          </div>

          {p.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-[var(--text-secondary)]">{p.description}</p>
            </div>
          )}

          {p.nutritionProfile && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6">
              <h2 className="mb-4 text-lg font-semibold">Nutrition</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {p.nutritionProfile.kcalPer100g !== null && (
                  <Info label="Kcal/100g" value={String(p.nutritionProfile.kcalPer100g)} />
                )}
                {p.nutritionProfile.kcalPerCup !== null && (
                  <Info label="Kcal/cup" value={String(p.nutritionProfile.kcalPerCup)} />
                )}
                {p.nutritionProfile.moisturePct !== null && (
                  <Info label="Moisture" value={`${p.nutritionProfile.moisturePct}%`} />
                )}
              </div>
            </div>
          )}

          {p.ingredients && p.ingredients.data.length > 0 && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6">
              <h2 className="mb-4 text-lg font-semibold">
                Ingredients ({p.ingredients.count})
              </h2>
              <ol className="space-y-3">
                {p.ingredients.data.map((entry) => (
                  <li key={entry.position} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-medium">
                      {entry.position}
                    </span>
                    <Link
                      href={`/ingredients/${entry.ingredient.slug}`}
                      className="flex-1 font-medium hover:text-[var(--ring)]"
                    >
                      {entry.ingredient.name}
                    </Link>
                    {entry.ingredient.currentScore !== null && (
                      <span className={`text-xs font-semibold ${entry.ingredient.currentScore >= 70 ? 'text-green-500' : entry.ingredient.currentScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {entry.ingredient.currentScore}
                      </span>
                    )}
                    {entry.percentageValue !== null && (
                      <span className="text-xs text-[var(--text-secondary)]">{entry.percentageValue}%</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {p.ingredients && p.ingredients.data.length === 0 && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center text-[var(--text-secondary)]">
              No ingredient data available for this product.
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center">
            <ScoreBadge score={score?.overall ?? null} size="lg" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Overall Score</p>
          </div>

          {score && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6 space-y-4">
              <h3 className="font-semibold">Score Breakdown</h3>
              <ScoreBar score={score.quality} label="Quality" />
              <ScoreBar score={score.safety} label="Safety" />
              <ScoreBar score={score.nutrition} label="Nutrition" />
              <ScoreBar score={score.transparency} label="Transparency" />
            </div>
          )}

          {!score && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)]">
              No score available yet. This product may not have been scored.
            </div>
          )}

          {p.tags.length > 0 && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6">
              <h3 className="mb-3 font-semibold">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {p.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {p.claims.length > 0 && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6">
              <h3 className="mb-3 font-semibold">Claims</h3>
              <ul className="space-y-2">
                {p.claims.map((claim) => (
                  <li key={claim.id} className="text-sm">
                    <span className="font-medium">{claim.name}</span>
                    {claim.evidenceNote && (
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{claim.evidenceNote}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[var(--text-secondary)]">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
