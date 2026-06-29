'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import MainLayout from '@/components/MainLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { ScoreBar } from '@/components/ScoreBadge';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queries';
import type { ProductDetail } from '@/lib/types';

export default function ComparePage() {
  const [slugs, setSlugs] = useState<string[]>(['', '']);
  const [activeSlugs, setActiveSlugs] = useState<string[]>([]);

  const productQueries = useQueries({
    queries: activeSlugs.map((slug) => ({
      queryKey: queryKeys.products.detail(slug),
      queryFn: () => api.products.detail(slug),
      staleTime: 60_000,
    })),
  });

  const addSlot = () => {
    if (slugs.length < 5) setSlugs((prev) => [...prev, '']);
  };

  const removeSlot = (idx: number) => {
    if (slugs.length > 2) setSlugs((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSlug = (idx: number, val: string) => {
    setSlugs((prev) => prev.map((s, i) => (i === idx ? val : s)));
  };

  const doCompare = () => {
    const validSlugs = slugs.filter((s) => s.trim());
    if (validSlugs.length < 2) return;
    setActiveSlugs(validSlugs.map((s) => s.trim()));
  };

  const validProducts = productQueries
    .filter((q) => q.isSuccess && q.data?.data)
    .map((q) => q.data!.data as ProductDetail);

  const isLoading = activeSlugs.length > 0 && productQueries.some((q) => q.isLoading);
  const hasError = productQueries.some((q) => q.isError);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold">Compare Products</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Enter product slugs to compare side-by-side.
        </p>

        <div className="mt-8 space-y-3">
          {slugs.map((slug, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => updateSlug(idx, e.target.value)}
                placeholder={`Product slug ${idx + 1}`}
                className="flex-1 rounded-lg border bg-[var(--bg-card)] px-4 py-2 text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
              {slugs.length > 2 && (
                <button
                  onClick={() => removeSlot(idx)}
                  className="rounded-lg border px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            {slugs.length < 5 && (
              <button
                onClick={addSlot}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-[var(--bg-secondary)]"
              >
                + Add Product
              </button>
            )}
            <button
              onClick={doCompare}
              disabled={slugs.filter((s) => s.trim()).length < 2 || isLoading}
              className="rounded-lg bg-[var(--ring)] px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Compare'}
            </button>
          </div>
        </div>

        {isLoading && <LoadingSpinner />}

        {hasError && !isLoading && (
          <ErrorDisplay
            title="Comparison failed"
            message="One or more products could not be loaded. Check the slugs and try again."
          />
        )}

        {!isLoading && activeSlugs.length > 0 && validProducts.length === 0 && !hasError && (
          <EmptyState
            title="No products found"
            message="None of the provided slugs matched any products. Check the slugs and try again."
          />
        )}

        {validProducts.length >= 2 && (
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b">
                  <th className="py-3 pr-4 text-left text-sm font-semibold">Metric</th>
                  {validProducts.map((p) => (
                    <th key={p.id} className="py-3 px-4 text-left text-sm font-semibold">
                      <div>{p.name}</div>
                      <div className="font-normal text-[var(--text-secondary)]">{p.brand.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Overall Score" values={validProducts.map((p) => `${p.currentScore?.overall ?? '—'}/100`)} />
                <CompareRow label="Grade" values={validProducts.map((p) => {
                  const s = p.currentScore?.overall;
                  if (s === null || s === undefined) return '—';
                  if (s >= 90) return 'A';
                  if (s >= 80) return 'B+';
                  if (s >= 70) return 'B';
                  if (s >= 60) return 'C+';
                  if (s >= 50) return 'C';
                  if (s >= 40) return 'D';
                  return 'F';
                })} />
                <ScoreCompareRow label="Quality" products={validProducts} keyFn={(p) => p.currentScore?.quality ?? null} />
                <ScoreCompareRow label="Safety" products={validProducts} keyFn={(p) => p.currentScore?.safety ?? null} />
                <ScoreCompareRow label="Nutrition" products={validProducts} keyFn={(p) => p.currentScore?.nutrition ?? null} />
                <ScoreCompareRow label="Transparency" products={validProducts} keyFn={(p) => p.currentScore?.transparency ?? null} />
                <CompareRow label="Food Form" values={validProducts.map((p) => p.foodForm ?? '—')} />
                <CompareRow label="Protein Source" values={validProducts.map((p) => p.primaryProteinSource ?? '—')} />
                <CompareRow label="Package Size" values={validProducts.map((p) => p.packageSizeLabel ?? '—')} />
                <CompareRow label="Ingredients" values={validProducts.map((p) => String(p.ingredientCount))} />
                <CompareRow label="Tags" values={validProducts.map((p) => p.tags.map((t) => t.name).join(', ') || '—')} />
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-sm text-[var(--text-secondary)]">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-3 px-4 text-sm font-medium">{v}</td>
      ))}
    </tr>
  );
}

function ScoreCompareRow({
  label,
  products,
  keyFn,
}: {
  label: string;
  products: ProductDetail[];
  keyFn: (p: ProductDetail) => number | null;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4 text-sm text-[var(--text-secondary)]">{label}</td>
      {products.map((p, i) => {
        const score = keyFn(p);
        return (
          <td key={i} className="py-3 px-4">
            <ScoreBar score={score} label="" />
          </td>
        );
      })}
    </tr>
  );
}
