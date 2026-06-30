'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScoreBadge } from '@/components/ScoreBadge';
import { useGlobalSearch } from '@/lib/queries';
import type { SearchResult } from '@/lib/types';

type Tab = 'all' | 'products' | 'brands' | 'ingredients';

export default function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = use(searchParams);
  const [query, setQuery] = useState(params.q ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [submittedQuery, setSubmittedQuery] = useState(params.q ?? '');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const searchQuery = useGlobalSearch(
    { q: submittedQuery, limit: '20' },
    submittedQuery.trim().length > 0,
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      /* ignore */
    }
  }, []);

  const saveSearch = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 5);
      try {
        localStorage.setItem('recentSearches', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (params.q) {
      setQuery(params.q);
      setSubmittedQuery(params.q);
      saveSearch(params.q);
    }
  }, [params.q, saveSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
    saveSearch(query.trim());
  };

  const clearSearch = () => {
    setQuery('');
    setSubmittedQuery('');
  };

  const results = searchQuery.data;
  const items = results
    ? activeTab === 'products'
      ? results.products
      : activeTab === 'brands'
        ? results.brands
        : activeTab === 'ingredients'
          ? results.ingredients
          : [...(results.products ?? []), ...(results.brands ?? []), ...(results.ingredients ?? [])]
    : [];

  const tabCounts = {
    all:
      (results?.products?.length ?? 0) +
      (results?.brands?.length ?? 0) +
      (results?.ingredients?.length ?? 0),
    products: results?.products?.length ?? 0,
    brands: results?.brands?.length ?? 0,
    ingredients: results?.ingredients?.length ?? 0,
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <h1 className="text-3xl font-bold mb-6">Search</h1>
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, brands, ingredients..."
                className="pl-9 pr-20 h-12 text-base"
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button
                  type="submit"
                  size="sm"
                  disabled={searchQuery.isFetching || !query.trim()}
                  className="h-9"
                >
                  {searchQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Search'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>

        {/* Recent / Initial State */}
        {!submittedQuery && !searchQuery.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 text-center"
          >
            {recentSearches.length > 0 && (
              <div className="mx-auto max-w-md">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Recent searches</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        setSubmittedQuery(s);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                      <Clock className="h-3 w-3" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {recentSearches.length === 0 && (
              <div className="py-16">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Search Pet Food Products</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Find products, brands, and ingredients with detailed scores and analysis.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {searchQuery.isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error */}
        {searchQuery.isError && (
          <div className="mt-8">
            <ErrorDisplay
              title="Search failed"
              message={searchQuery.error?.message ?? 'An error occurred while searching.'}
              onRetry={() => searchQuery.refetch()}
            />
          </div>
        )}

        {/* Results */}
        {results && !searchQuery.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {results.total} result{results.total !== 1 ? 's' : ''} for &ldquo;
                {results.query}&rdquo;
                <span className="ml-2 text-xs opacity-60">({results.latencyMs}ms)</span>
              </p>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as Tab)}
              className="mb-6"
            >
              <TabsList>
                <TabsTrigger value="all">
                  All
                  <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs tabular-nums">
                    {tabCounts.all}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="products">
                  Products
                  {tabCounts.products > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs tabular-nums">
                      {tabCounts.products}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="brands">
                  Brands
                  {tabCounts.brands > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs tabular-nums">
                      {tabCounts.brands}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ingredients">
                  Ingredients
                  {tabCounts.ingredients > 0 && (
                    <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-xs tabular-nums">
                      {tabCounts.ingredients}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {items.length === 0 ? (
                  <EmptyState
                    title="No results found"
                    message={`No results for "${results.query}". Try different keywords.`}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, i) => (
                      <motion.div
                        key={`${item.entityType}-${item.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                      >
                        <SearchResultCard item={item} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}

function SearchResultCard({ item }: { item: SearchResult }) {
  const href =
    item.entityType === 'product'
      ? `/products/${item.slug}`
      : item.entityType === 'brand'
        ? `/brands/${item.slug}`
        : `/ingredients/${item.slug}`;

  return (
    <Link
      href={href}
      className="group block rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge variant="secondary" className="mb-2 text-xs">
            {item.entityType}
          </Badge>
          <h3 className="truncate text-base font-semibold group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          {item.brandName && (
            <p className="mt-0.5 text-sm text-muted-foreground">{item.brandName}</p>
          )}
        </div>
        {item.overallScore !== null && (
          <ScoreBadge score={item.overallScore} size="sm" />
        )}
      </div>
      {item.snippet && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
          {item.snippet}
        </p>
      )}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
        <span>View details</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
