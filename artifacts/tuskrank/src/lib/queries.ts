import { useQuery } from '@tanstack/react-query';
import { api } from './api';

/* ------------------------------------------------------------------ */
/*  Query keys                                                          */
/* ------------------------------------------------------------------ */

export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: (params?: Record<string, string>) => ['products', 'list', params] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
  },
  search: {
    global: (params: Record<string, string>) => ['search', 'global', params] as const,
    autocomplete: (params: Record<string, string>) => ['search', 'autocomplete', params] as const,
    trending: (limit?: number) => ['search', 'trending', limit] as const,
    popular: (limit?: number) => ['search', 'popular', limit] as const,
  },
  ingredients: {
    all: ['ingredients'] as const,
    list: (params?: Record<string, string>) => ['ingredients', 'list', params] as const,
    detail: (slug: string) => ['ingredients', 'detail', slug] as const,
    references: (id: string) => ['ingredients', 'references', id] as const,
    scoreHistory: (id: string) => ['ingredients', 'scoreHistory', id] as const,
    categories: () => ['ingredients', 'categories'] as const,
  },
  brands: {
    all: ['brands'] as const,
    list: (params?: Record<string, string>) => ['brands', 'list', params] as const,
    featured: (limit?: number) => ['brands', 'featured', limit] as const,
    detail: (slug: string) => ['brands', 'detail', slug] as const,
  },
  health: {
    check: () => ['health', 'check'] as const,
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Products                                                            */
/* ------------------------------------------------------------------ */

export function useProductList(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => api.products.list(params),
    staleTime: 60_000,
  });
}

export function useProductDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(slug),
    queryFn: () => api.products.detail(slug),
    staleTime: 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Search                                                              */
/* ------------------------------------------------------------------ */

export function useGlobalSearch(params: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.global(params),
    queryFn: () => api.search.global(params),
    staleTime: 30_000,
    enabled,
  });
}

export function useAutocomplete(params: Record<string, string>, enabled = true) {
  return useQuery({
    queryKey: queryKeys.search.autocomplete(params),
    queryFn: () => api.search.autocomplete(params),
    staleTime: 10_000,
    enabled,
  });
}

export function useTrendingSearch(limit = 10) {
  return useQuery({
    queryKey: queryKeys.search.trending(limit),
    queryFn: () => api.search.trending(limit),
    staleTime: 120_000,
  });
}

export function usePopularSearch(limit = 10) {
  return useQuery({
    queryKey: queryKeys.search.popular(limit),
    queryFn: () => api.search.popular(limit),
    staleTime: 120_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Ingredients                                                         */
/* ------------------------------------------------------------------ */

export function useIngredientList(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.ingredients.list(params),
    queryFn: () => api.ingredients.list(params),
    staleTime: 60_000,
  });
}

export function useIngredientDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.ingredients.detail(slug),
    queryFn: () => api.ingredients.detail(slug),
    staleTime: 60_000,
  });
}

export function useIngredientReferences(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ingredients.references(id),
    queryFn: () => api.ingredients.references(id),
    staleTime: 120_000,
    enabled,
  });
}

export function useIngredientScoreHistory(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ingredients.scoreHistory(id),
    queryFn: () => api.ingredients.scoreHistory(id),
    staleTime: 120_000,
    enabled,
  });
}

export function useIngredientCategories() {
  return useQuery({
    queryKey: queryKeys.ingredients.categories(),
    queryFn: () => api.ingredients.categories(),
    staleTime: 300_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Brands                                                              */
/* ------------------------------------------------------------------ */

export function useBrandList(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.brands.list(params),
    queryFn: () => api.brands.list(params),
    staleTime: 60_000,
  });
}

export function useBrandFeatured(limit = 10) {
  return useQuery({
    queryKey: queryKeys.brands.featured(limit),
    queryFn: () => api.brands.featured(limit),
    staleTime: 120_000,
  });
}

export function useBrandDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.brands.detail(slug),
    queryFn: () => api.brands.detail(slug),
    staleTime: 60_000,
  });
}

/* ------------------------------------------------------------------ */
/*  Health                                                              */
/* ------------------------------------------------------------------ */

export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health.check(),
    queryFn: () => api.health.check(),
    staleTime: 30_000,
  });
}
