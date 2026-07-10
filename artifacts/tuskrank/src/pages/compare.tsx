import { useState, useEffect } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, X, Search, Plus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/MainLayout';
import { EmptyState } from '@/components/EmptyState';
import { ScoreBadge, ScoreBar } from '@/components/ScoreBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { api } from '@/lib/api';
import { queryKeys, useGlobalSearch } from '@/lib/queries';
import { useDebounce } from '@/lib/hooks';
import type { ProductDetail } from '@/lib/types';

const MAX_PRODUCTS = 4;

interface SelectedProduct {
  slug: string;
  name: string;
}

// ── Product Picker Combobox ────────────────────────────────────────────────────
function ProductPicker({
  selected,
  onSelect,
  onRemove,
  disabled,
}: {
  selected: SelectedProduct[];
  onSelect: (p: SelectedProduct) => void;
  onRemove: (slug: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQ = useDebounce(query, 300);

  const search = useGlobalSearch(
    { q: debouncedQ, limit: '8' },
    debouncedQ.length > 1,
  );

  const productResults = search.data?.products ?? [];
  const selectedSlugs = new Set(selected.map((p) => p.slug));

  const handleSelect = (item: { name: string; slug: string }) => {
    if (selectedSlugs.has(item.slug)) {
      onRemove(item.slug);
    } else if (selected.length < MAX_PRODUCTS) {
      onSelect({ slug: item.slug, name: item.name });
    }
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {selected.map((p) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 pr-1 py-1.5 text-sm font-medium"
                >
                  {p.name}
                  <button
                    onClick={() => onRemove(p.slug)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    aria-label={`Remove ${p.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Search combobox */}
      {selected.length < MAX_PRODUCTS && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-full justify-start gap-2 text-muted-foreground font-normal"
            >
              <Search className="h-4 w-4 shrink-0" />
              {selected.length === 0
                ? 'Search for a product to compare…'
                : `Add another product (${selected.length}/${MAX_PRODUCTS})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[420px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Type a product name…"
                value={query}
                onValueChange={setQuery}
              />
              <CommandList>
                {debouncedQ.length <= 1 && (
                  <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
                )}
                {debouncedQ.length > 1 && search.isLoading && (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {debouncedQ.length > 1 && !search.isLoading && productResults.length === 0 && (
                  <CommandEmpty>No products found for &quot;{debouncedQ}&quot;.</CommandEmpty>
                )}
                {productResults.length > 0 && (
                  <CommandGroup heading="Products">
                    {productResults.map((item) => (
                      <CommandItem
                        key={item.slug}
                        value={item.slug}
                        onSelect={() => handleSelect({ name: item.name, slug: item.slug })}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {selectedSlugs.has(item.slug) && (
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="block truncate font-medium">{item.name}</span>
                            {item.brandName && (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.brandName}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.overallScore !== null && item.overallScore !== undefined && (
                          <ScoreBadge score={item.overallScore} size="sm" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selected.length >= MAX_PRODUCTS && (
        <p className="text-xs text-muted-foreground">
          Maximum {MAX_PRODUCTS} products. Remove one to add another.
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const rawSearch = useSearch();
  const [, navigate] = useLocation();

  // Parse slugs from URL
  const initialSlugs = new URLSearchParams(rawSearch)
    .getAll('p')
    .flatMap((v) => v.split(','))
    .filter(Boolean)
    .slice(0, MAX_PRODUCTS);

  const [selected, setSelected] = useState<SelectedProduct[]>(
    initialSlugs.map((s) => ({ slug: s, name: s })),
  );

  const activeSlugs = selected.map((p) => p.slug);

  // Sync to URL
  useEffect(() => {
    const url =
      activeSlugs.length > 0
        ? `/compare?${activeSlugs.map((s) => `p=${encodeURIComponent(s)}`).join('&')}`
        : '/compare';
    navigate(url, { replace: true });
  }, [activeSlugs.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const productQueries = useQueries({
    queries: activeSlugs.map((slug) => ({
      queryKey: queryKeys.products.detail(slug),
      queryFn: () => api.products.detail(slug),
      enabled: !!slug,
      staleTime: 60_000,
    })),
  });

  // Update names once data resolves (initial load from URL uses slug as placeholder name)
  useEffect(() => {
    productQueries.forEach((q) => {
      if (q.data?.data) {
        const p = q.data.data;
        setSelected((prev) =>
          prev.map((s) => (s.slug === p.slug ? { ...s, name: p.name } : s)),
        );
      }
    });
  }, [productQueries.map((q) => q.data?.data?.slug).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toast on error
  useEffect(() => {
    productQueries.forEach((q) => {
      if (q.isError) {
        toast.error('Product not found', {
          description: 'One or more products could not be loaded.',
        });
      }
    });
  }, [productQueries.some((q) => q.isError)]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = productQueries.filter((q) => q.data).map((q) => q.data!.data);
  const isLoading = productQueries.some((q) => q.isFetching);

  const handleAdd = (p: SelectedProduct) => setSelected((prev) => [...prev, p]);
  const handleRemove = (slug: string) =>
    setSelected((prev) => prev.filter((p) => p.slug !== slug));

  return (
    <MainLayout>
      <Helmet>
        <title>Compare Products — Tuskrank</title>
        <meta name="description" content="Compare pet food products side by side with transparent ingredient and nutrition scoring." />
      </Helmet>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              Compare Products
            </h1>
            <p className="mt-2 text-muted-foreground">
              Search and select up to {MAX_PRODUCTS} products to compare side by side.
            </p>
          </div>

          {/* Picker */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>
                  Products
                  {selected.length > 0 && (
                    <span className="ml-1.5 text-muted-foreground font-normal">
                      ({selected.length}/{MAX_PRODUCTS})
                    </span>
                  )}
                </span>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductPicker
                selected={selected}
                onSelect={handleAdd}
                onRemove={handleRemove}
              />
            </CardContent>
          </Card>

          {/* Results */}
          {selected.length === 0 && (
            <EmptyState
              title="No products selected"
              message="Use the search above to find and add products to compare."
            />
          )}

          {selected.length === 1 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Add at least one more product to start comparing.
            </div>
          )}

          {products.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ComparisonTable products={products} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}

// ── Comparison Table ──────────────────────────────────────────────────────────
function ComparisonTable({ products }: { products: ProductDetail[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36 bg-muted/50">Attribute</TableHead>
            {products.map((p) => (
              <TableHead key={p.id} className="font-semibold min-w-[180px]">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-normal">{p.brand.name}</p>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Overall Score */}
          <TableRow>
            <TableCell className="font-medium text-muted-foreground bg-muted/30">
              Overall Score
            </TableCell>
            {products.map((p) => (
              <TableCell key={p.id}>
                <ScoreBadge score={p.currentScore?.overall ?? null} size="sm" />
              </TableCell>
            ))}
          </TableRow>
          {/* Dimension bars */}
          {(
            [
              ['Quality', 'quality'],
              ['Safety', 'safety'],
              ['Nutrition', 'nutrition'],
              ['Transparency', 'transparency'],
            ] as const
          ).map(([label, key]) => (
            <TableRow key={key}>
              <TableCell className="font-medium text-muted-foreground bg-muted/30">
                {label}
              </TableCell>
              {products.map((p) => (
                <TableCell key={p.id} className="min-w-[140px]">
                  <ScoreBar score={(p.currentScore as any)?.[key] ?? null} label="" />
                </TableCell>
              ))}
            </TableRow>
          ))}
          {/* Text rows */}
          <CompareTextRow label="Form" products={products} getValue={(p) => p.foodForm ?? '—'} />
          <CompareTextRow
            label="Protein"
            products={products}
            getValue={(p) => p.primaryProteinSource ?? '—'}
          />
          <CompareTextRow
            label="Size"
            products={products}
            getValue={(p) => p.packageSizeLabel ?? '—'}
          />
          {/* Tags */}
          <TableRow>
            <TableCell className="font-medium text-muted-foreground bg-muted/30">Tags</TableCell>
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
            <TableCell className="font-medium text-muted-foreground bg-muted/30">
              Claims
            </TableCell>
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
      <TableCell className="font-medium text-muted-foreground bg-muted/30">{label}</TableCell>
      {products.map((p) => (
        <TableCell key={p.id}>{getValue(p)}</TableCell>
      ))}
    </TableRow>
  );
}
