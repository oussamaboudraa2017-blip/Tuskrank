'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
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
    } catch { /* ignore */ }
  }, []);

  const saveSearch = useCallback((q: string) => {
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 5);
      try { localStorage.setItem('recentSearches', JSON.stringify(next)); } catch { /* ignore */ }
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

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'products', label: 'Products' },
    { key: 'brands', label: 'Brands' },
    { key: 'ingredients', label: 'Ingredients' },
  ];

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

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, ingredients..."
              className="flex-1 rounded-lg border bg-[var(--bg-card)] px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-secondary)] focus:border-[var(--ring)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
            <button
              type="submit"
              disabled={searchQuery.isFetching}
              className="rounded-lg bg-[var(--ring)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {searchQuery.isFetching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {!submittedQuery && !searchQuery.isLoading && (
          <div className="mt-12 text-center">
            {recentSearches.length > 0 && (
              <div className="mx-auto max-w-md">
                <p className="mb-3 text-sm text-[var(--text-secondary)]">Recent searches</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); setSubmittedQuery(s); }}
                      className="rounded-full border bg-[var(--bg-card)] px-3 py-1 text-sm hover:bg-[var(--bg-secondary)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {searchQuery.isLoading && <LoadingSpinner />}

        {searchQuery.isError && (
          <ErrorDisplay
            title="Search failed"
            message={searchQuery.error?.message ?? 'An error occurred while searching.'}
            onRetry={() => searchQuery.refetch()}
          />
        )}

        {results && !searchQuery.isLoading && (
          <div className="mt-8">
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              {results.total} results for &ldquo;{results.query}&rdquo; ({results.latencyMs}ms)
            </p>
            <div className="mb-6 flex gap-1 border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'border-[var(--ring)] text-[var(--text)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <EmptyState
                title="No results found"
                message={`No results for "${results.query}". Try different keywords.`}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <SearchResultCard key={`${item.entityType}-${item.id}`} item={item} />
                ))}
              </div>
            )}
          </div>
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
      className="group block rounded-xl border bg-[var(--bg-card)] p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
            {item.entityType}
          </span>
          <h3 className="truncate text-base font-semibold group-hover:text-[var(--ring)]">
            {item.name}
          </h3>
          {item.brandName && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{item.brandName}</p>
          )}
        </div>
        {item.overallScore !== null && (
          <span className="text-lg font-bold">{item.overallScore}</span>
        )}
      </div>
      {item.snippet && (
        <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{item.snippet}</p>
      )}
    </Link>
  );
}
