import { useState, useEffect, useCallback } from 'react';
import { Link, useSearch } from 'wouter';
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

export default function SearchPage() {
  const searchString = useSearch();
  const initialQ = new URLSearchParams(searchString).get('q') ?? '';

  const [query, setQuery] = useState(initialQ);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [submittedQuery, setSubmittedQuery] = useState(initialQ);
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
    if (initialQ) {
      setQuery(initialQ);
      setSubmittedQuery(initialQ);
      saveSearch(initialQ);
    }
  }, [initialQ, saveSearch]);

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
          : [
              ...(results.products ?? []),
              ...(results.brands ?? []),
              ...(results.ingredients ?? []),
            ]
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                <Button type="submit" size="sm" className="h-9">
                  Search
                </Button>
              </div>
            </div>
          </form>

          {/* Recent Searches */}
          {!submittedQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Recent searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQuery(s);
                      setSubmittedQuery(s);
                    }}
                    className="rounded-full border bg-muted px-3 py-1 text-sm hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Results */}
        {submittedQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 mx-auto max-w-4xl"
          >
            {searchQuery.isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {searchQuery.isError && (
              <ErrorDisplay
                title="Search failed"
                message={searchQuery.error?.message ?? 'Please try again.'}
                onRetry={() => searchQuery.refetch()}
              />
            )}
            {searchQuery.data && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All ({tabCounts.all})</TabsTrigger>
                  <TabsTrigger value="products">Products ({tabCounts.products})</TabsTrigger>
                  <TabsTrigger value="brands">Brands ({tabCounts.brands})</TabsTrigger>
                  <TabsTrigger value="ingredients">
                    Ingredients ({tabCounts.ingredients})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab}>
                  {items.length === 0 ? (
                    <EmptyState
                      title="No results found"
                      message={`No results for "${submittedQuery}". Try a different search term.`}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {items.map((item, i) => (
                        <SearchResultCard key={i} item={item} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
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
        {item.overallScore !== null && <ScoreBadge score={item.overallScore} size="sm" />}
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
