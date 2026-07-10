'use client';

import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trash2, BarChart3, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { LoadingSpinner } from '@/components/Loading';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { ScoreBadge, ScoreBar } from '@/components/ScoreBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Compare Products</h1>
          </div>
          <p className="text-muted-foreground">
            Enter product slugs to compare side-by-side.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 rounded-xl border bg-card p-6"
        >
          <div className="space-y-3">
            {slugs.map((slug, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  type="text"
                  value={slug}
                  onChange={(e) => updateSlug(idx, e.target.value)}
                  placeholder={`Product slug ${idx + 1}`}
                />
                {slugs.length > 2 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeSlot(idx)}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              {slugs.length < 5 && (
                <Button variant="outline" onClick={addSlot} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              )}
              <Button
                onClick={doCompare}
                disabled={slugs.filter((s) => s.trim()).length < 2 || isLoading}
                className="gap-2"
              >
                {isLoading ? 'Loading...' : 'Compare'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {isLoading && <LoadingSpinner />}

        {hasError && !isLoading && (
          <div className="mt-8">
            <ErrorDisplay
              title="Comparison failed"
              message="One or more products could not be loaded. Check the slugs and try again."
            />
          </div>
        )}

        {!isLoading && activeSlugs.length > 0 && validProducts.length === 0 && !hasError && (
          <div className="mt-8">
            <EmptyState
              title="No products found"
              message="None of the provided slugs matched any products. Check the slugs and try again."
            />
          </div>
        )}

        {validProducts.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10"
          >
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">Metric</TableHead>
                    {validProducts.map((p) => (
                      <TableHead key={p.id} className="min-w-[200px]">
                        <div className="font-semibold text-foreground">{p.name}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">
                          {p.brand.name}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <CompareScoreRow label="Overall Score" products={validProducts} keyFn={(p) => p.currentScore?.overall ?? null} />
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
                  <CompareScoreRow label="Quality" products={validProducts} keyFn={(p) => p.currentScore?.quality ?? null} />
                  <CompareScoreRow label="Safety" products={validProducts} keyFn={(p) => p.currentScore?.safety ?? null} />
                  <CompareScoreRow label="Nutrition" products={validProducts} keyFn={(p) => p.currentScore?.nutrition ?? null} />
                  <CompareScoreRow label="Transparency" products={validProducts} keyFn={(p) => p.currentScore?.transparency ?? null} />
                  <CompareRow label="Food Form" values={validProducts.map((p) => p.foodForm ?? '—')} />
                  <CompareRow label="Protein Source" values={validProducts.map((p) => p.primaryProteinSource ?? '—')} />
                  <CompareRow label="Package Size" values={validProducts.map((p) => p.packageSizeLabel ?? '—')} />
                  <CompareRow label="Ingredients" values={validProducts.map((p) => String(p.ingredientCount))} />
                  <CompareTagsRow label="Tags" products={validProducts} />
                  <CompareClaimsRow label="Claims" products={validProducts} />
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
      {values.map((v, i) => (
        <TableCell key={i}>{v}</TableCell>
      ))}
    </TableRow>
  );
}

function CompareScoreRow({
  label,
  products,
  keyFn,
}: {
  label: string;
  products: ProductDetail[];
  keyFn: (p: ProductDetail) => number | null;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
      {products.map((p, i) => {
        const score = keyFn(p);
        return (
          <TableCell key={i}>
            <div className="flex items-center gap-3">
              <ScoreBadge score={score} size="sm" />
              <div className="flex-1">
                <ScoreBar score={score} label="" />
              </div>
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

function CompareTagsRow({ label, products }: { label: string; products: ProductDetail[] }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
      {products.map((p, i) => (
        <TableCell key={i}>
          <div className="flex flex-wrap gap-1">
            {p.tags.length > 0
              ? p.tags.map((t) => (
                  <Badge key={t.id} variant="secondary" className="text-xs">
                    {t.name}
                  </Badge>
                ))
              : '—'}
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
}

function CompareClaimsRow({ label, products }: { label: string; products: ProductDetail[] }) {
  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
      {products.map((p, i) => (
        <TableCell key={i}>
          <div className="flex flex-wrap gap-1">
            {p.claims.length > 0
              ? p.claims.map((c) => (
                  <Badge key={c.id} variant="outline" className="text-xs">
                    {c.name}
                  </Badge>
                ))
              : '—'}
          </div>
        </TableCell>
      ))}
    </TableRow>
  );
}
