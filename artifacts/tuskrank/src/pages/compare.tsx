import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Trash2, BarChart3 } from 'lucide-react';
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
      enabled: !!slug,
    })),
  });

  const products = productQueries
    .filter((q) => q.data)
    .map((q) => q.data!.data);
  const hasErrors = productQueries.some((q) => q.isError);
  const isLoading = productQueries.some((q) => q.isLoading);

  const handleCompare = () => {
    const filled = slugs.filter((s) => s.trim());
    if (filled.length < 1) return;
    setActiveSlugs(filled);
  };

  const addSlot = () => setSlugs((prev) => [...prev, '']);
  const removeSlot = (i: number) => setSlugs((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              Compare Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Enter product slugs to compare them side by side.
            </p>
          </div>

          {/* Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">Products to Compare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {slugs.map((slug, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={slug}
                    onChange={(e) => {
                      const next = [...slugs];
                      next[i] = e.target.value;
                      setSlugs(next);
                    }}
                    placeholder={`Product slug ${i + 1} (e.g. acme-chicken-dry)`}
                    className="flex-1"
                  />
                  {slugs.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSlot(i)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                {slugs.length < 4 && (
                  <Button variant="outline" size="sm" onClick={addSlot} className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Add product
                  </Button>
                )}
                <Button onClick={handleCompare} disabled={slugs.every((s) => !s.trim())}>
                  Compare
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {isLoading && <LoadingSpinner />}
          {hasErrors && (
            <ErrorDisplay
              title="One or more products not found"
              message="Check that the product slugs are correct and try again."
            />
          )}
          {!isLoading && !hasErrors && activeSlugs.length > 0 && products.length === 0 && (
            <EmptyState
              title="No products loaded"
              message="Enter product slugs above and click Compare."
            />
          )}
          {products.length > 0 && (
            <ComparisonTable products={products} />
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}

function ComparisonTable({ products }: { products: ProductDetail[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Attribute</TableHead>
            {products.map((p) => (
              <TableHead key={p.id} className="font-semibold">
                {p.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Brand */}
          <CompareTextRow
            label="Brand"
            products={products}
            getValue={(p) => p.brand.name}
          />
          {/* Overall Score */}
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Overall Score</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <ScoreBadge score={p.currentScore?.overall ?? null} size="sm" />
              </TableCell>
            ))}
          </TableRow>
          {/* Score bars */}
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Quality</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <ScoreBar score={p.currentScore?.quality ?? null} label="" />
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Safety</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <ScoreBar score={p.currentScore?.safety ?? null} label="" />
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Nutrition</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <ScoreBar score={p.currentScore?.nutrition ?? null} label="" />
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Transparency</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <ScoreBar score={p.currentScore?.transparency ?? null} label="" />
              </TableCell>
            ))}
          </TableRow>
          {/* Form */}
          <CompareTextRow label="Form" products={products} getValue={(p) => p.foodForm ?? '—'} />
          {/* Protein */}
          <CompareTextRow
            label="Protein"
            products={products}
            getValue={(p) => p.primaryProteinSource ?? '—'}
          />
          {/* Size */}
          <CompareTextRow
            label="Size"
            products={products}
            getValue={(p) => p.packageSizeLabel ?? '—'}
          />
          {/* Tags */}
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Tags</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <div className="flex flex-wrap gap-1">
                  {p.tags && p.tags.length > 0
                    ? p.tags.map((t: any) => (
                        <Badge key={t.id} variant="secondary" className="text-xs">
                          {t.name}
                        </Badge>
                      ))
                    : '—'}
                </div>
              </TableCell>
            ))}
          </TableRow>
          {/* Claims */}
          <TableRow>
            <TableCell className="font-medium text-muted-foreground">Claims</TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <div className="flex flex-wrap gap-1">
                  {p.claims && p.claims.length > 0
                    ? p.claims.map((c: any) => (
                        <Badge key={c.id} variant="outline" className="text-xs">
                          {c.name}
                        </Badge>
                      ))
                    : '—'}
                </div>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function CompareTextRow({
  label,
  products,
  getValue,
}: {
  label: string;
  products: ProductDetail[];
  getValue: (p: ProductDetail) => string;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium text-muted-foreground">{label}</TableCell>
      {products.map((p) => (
        <TableCell key={p.id}>{getValue(p)}</TableCell>
      ))}
    </TableRow>
  );
}
