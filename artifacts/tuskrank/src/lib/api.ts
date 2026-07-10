import type {
  ProductListItem,
  ProductDetail,
  GlobalSearchResult,
  IngredientDetail,
  IngredientListItem,
  IngredientReference,
  IngredientScore,
  IngredientCategory,
  BrandDetail,
  BrandListItem,
} from './types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    traceId?: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    sortBy?: string | null;
    sortOrder?: 'asc' | 'desc' | null;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

function qs(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '' && v !== null,
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */

export interface ProductListResponse {
  data: ProductListItem[];
  meta: ApiEnvelope<ProductListItem[]>['meta'];
}

export interface ProductDetailResponse {
  data: ProductDetail;
  meta: ApiEnvelope<ProductDetail>['meta'];
}

async function productList(params?: Record<string, string>): Promise<ProductListResponse> {
  const res = await request<ProductListItem[]>('/api/v1/products' + qs(params));
  return { data: res.data as ProductListItem[], meta: res.meta };
}

async function productDetail(slug: string): Promise<ProductDetailResponse> {
  const res = await request<ProductDetail>(`/api/v1/products/${slug}`);
  return { data: res.data as ProductDetail, meta: res.meta };
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

async function searchGlobal(params: Record<string, string>): Promise<GlobalSearchResult> {
  const res = await request<GlobalSearchResult>('/api/v1/search/global' + qs(params));
  return res.data as GlobalSearchResult;
}

async function searchAutocomplete(
  params: Record<string, string>,
): Promise<{ text: string; entityType: string; count: number }[]> {
  const res = await request<{ text: string; entityType: string; count: number }[]>(
    '/api/v1/search/autocomplete' + qs(params),
  );
  return (res.data ?? []) as { text: string; entityType: string; count: number }[];
}

async function searchTrending(limit = 10): Promise<{ term: string; count: number }[]> {
  const res = await request<{ term: string; count: number }[]>(
    '/api/v1/search/trending' + qs({ limit }),
  );
  return (res.data ?? []) as { term: string; count: number }[];
}

async function searchPopular(limit = 10): Promise<{ term: string; count: number }[]> {
  const res = await request<{ term: string; count: number }[]>(
    '/api/v1/search/popular' + qs({ limit }),
  );
  return (res.data ?? []) as { term: string; count: number }[];
}

/* ------------------------------------------------------------------ */
/*  Ingredients                                                        */
/* ------------------------------------------------------------------ */

export interface IngredientListResponse {
  data: IngredientListItem[];
  meta: ApiEnvelope<IngredientListItem[]>['meta'];
}

export interface IngredientDetailResponse {
  data: IngredientDetail;
  meta: ApiEnvelope<IngredientDetail>['meta'];
}

async function ingredientList(params?: Record<string, string>): Promise<IngredientListResponse> {
  const res = await request<IngredientListItem[]>('/api/v1/ingredients' + qs(params));
  return { data: (res.data ?? []) as IngredientListItem[], meta: res.meta };
}

async function ingredientDetail(slug: string): Promise<IngredientDetailResponse> {
  const res = await request<IngredientDetail>(`/api/v1/ingredients/${slug}`);
  return { data: res.data as IngredientDetail, meta: res.meta };
}

async function ingredientReferences(id: string): Promise<IngredientReference[]> {
  const res = await request<IngredientReference[]>(`/api/v1/ingredients/${id}/references`);
  return (res.data ?? []) as IngredientReference[];
}

async function ingredientScoreHistory(id: string): Promise<IngredientScore[]> {
  const res = await request<IngredientScore[]>(`/api/v1/ingredients/${id}/scores/history`);
  return (res.data ?? []) as IngredientScore[];
}

async function ingredientCategories(): Promise<IngredientCategory[]> {
  const res = await request<IngredientCategory[]>('/api/v1/ingredients/categories');
  return (res.data ?? []) as IngredientCategory[];
}

/* ------------------------------------------------------------------ */
/*  Brands                                                             */
/* ------------------------------------------------------------------ */

export interface BrandListResponse {
  data: BrandListItem[];
  meta: ApiEnvelope<BrandListItem[]>['meta'];
}

export interface BrandDetailResponse {
  data: BrandDetail;
  meta: ApiEnvelope<BrandDetail>['meta'];
}

async function brandList(params?: Record<string, string>): Promise<BrandListResponse> {
  const res = await request<BrandListItem[]>('/api/v1/brands' + qs(params));
  return { data: (res.data ?? []) as BrandListItem[], meta: res.meta };
}

async function brandFeatured(limit = 10): Promise<BrandListItem[]> {
  const res = await request<BrandListItem[]>('/api/v1/brands/featured' + qs({ limit }));
  return (res.data ?? []) as BrandListItem[];
}

async function brandDetail(slug: string): Promise<BrandDetailResponse> {
  const res = await request<BrandDetail>(`/api/v1/brands/${slug}`);
  return { data: res.data as BrandDetail, meta: res.meta };
}

/* ------------------------------------------------------------------ */
/*  Health                                                             */
/* ------------------------------------------------------------------ */

async function healthCheck(): Promise<{ status: string }> {
  const res = await request<{ status: string }>('/api/v1/health');
  return res.data as { status: string };
}

/* ------------------------------------------------------------------ */
/*  Export                                                              */
/* ------------------------------------------------------------------ */

export const api = {
  products: { list: productList, detail: productDetail },
  search: {
    global: searchGlobal,
    autocomplete: searchAutocomplete,
    trending: searchTrending,
    popular: searchPopular,
  },
  ingredients: {
    list: ingredientList,
    detail: ingredientDetail,
    references: ingredientReferences,
    scoreHistory: ingredientScoreHistory,
    categories: ingredientCategories,
  },
  brands: { list: brandList, featured: brandFeatured, detail: brandDetail },
  health: { check: healthCheck },
};
