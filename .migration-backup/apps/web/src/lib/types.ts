export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  brand: {
    id: string;
    name: string;
    slug: string;
    countryCode: string | null;
    logoImageUrl: string | null;
    isActive: boolean;
  };
  foodForm: string | null;
  primaryProteinSource: string | null;
  packageSizeGrams: number | null;
  packageSizeLabel: string | null;
  isActive: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  currentScore: number | null;
  currentGrade: string | null;
  scoringVersion: string | null;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    countryCode: string | null;
    logoImageUrl: string | null;
    isActive: boolean;
  };
  foodForm: string | null;
  primaryProteinSource: string | null;
  upc: string | null;
  sku: string | null;
  packageSizeGrams: number | null;
  packageSizeLabel: string | null;
  isActive: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  images: ProductImage[];
  tags: Tag[];
  claims: Claim[];
  nutritionProfile: NutritionProfile | null;
  currentScore: ScoreSummary | null;
  ingredients: ProductIngredients | null;
  ingredientCount: number;
  alternativesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  publicUrl: string;
  altText: string | null;
  widthPx: number | null;
  heightPx: number | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
}

export interface Claim {
  id: string;
  slug: string;
  name: string;
  evidenceNote: string | null;
}

export interface NutritionProfile {
  kcalPer100g: number | null;
  kcalPerCup: number | null;
  moisturePct: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  source: string | null;
}

export interface ScoreSummary {
  overall: number | null;
  quality: number | null;
  safety: number | null;
  nutrition: number | null;
  transparency: number | null;
  scoringVersion: string | null;
}

export interface ProductIngredients {
  slug: string;
  count: number;
  data: ProductIngredientEntry[];
}

export interface ProductIngredientEntry {
  position: number;
  rawLabel: string | null;
  isPrimary: boolean;
  percentageValue: number | null;
  ingredient: {
    id: string;
    slug: string;
    name: string;
    currentScore: number | null;
    currentGrade: string | null;
  };
}

export interface SearchResult {
  id: string;
  entityType: 'product' | 'brand' | 'ingredient';
  name: string;
  slug: string;
  score: number;
  matchedBy: string;
  snippet: string | null;
  brandName: string | null;
  brandSlug: string | null;
  overallScore: number | null;
  grade: string | null;
  imageUrl: string | null;
}

export interface GlobalSearchResult {
  query: string;
  total: number;
  products: SearchResult[];
  brands: SearchResult[];
  ingredients: SearchResult[];
  strategies: string[];
  latencyMs: number;
}

export interface IngredientListItem {
  id: string;
  name: string;
  slug: string;
  canonicalName: string;
  isAnimalDerived: boolean;
  isCommonAllergen: boolean;
  isControversial: boolean;
  isActive: boolean;
  categoryName: string | null;
  categorySlug: string | null;
  score: number | null;
  grade: string | null;
  productCount: number;
}

export interface IngredientDetail {
  id: string;
  name: string;
  slug: string;
  inciName: string | null;
  categoryId: string | null;
  canonicalName: string;
  description: string | null;
  isAnimalDerived: boolean;
  isCommonAllergen: boolean;
  isControversial: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryName: string | null;
  categorySlug: string | null;
  score: number | null;
  grade: string | null;
  productCount: number;
}

export interface IngredientReference {
  id: string;
  evidenceType: 'supports' | 'refutes' | 'neutral' | null;
  relevanceScore: number | null;
  notes: string | null;
  title: string;
  authors: string | null;
  publication: string | null;
  publishedYear: number | null;
  doi: string | null;
  url: string | null;
}

export interface IngredientScore {
  id: string;
  ingredientId: string;
  score: number;
  grade: string;
  reasoning: string | null;
  scoringVersion: string;
  isCurrent: boolean;
}

export interface BrandListItem {
  id: string;
  slug: string;
  name: string;
  manufacturer: string | null;
  countryCode: string | null;
  websiteUrl: string | null;
  description: string | null;
  logoImageUrl: string | null;
  isActive: boolean;
  productCount: number;
  avgScore: number | null;
}

export interface BrandDetail {
  id: string;
  slug: string;
  name: string;
  manufacturer: string | null;
  countryCode: string | null;
  websiteUrl: string | null;
  description: string | null;
  logoImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount: number;
  avgScore: number | null;
}

export interface IngredientCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: IngredientCategory[];
}

export type GradeColor = 'score-a' | 'score-b' | 'score-c' | 'score-d' | 'score-f';

export function gradeColor(score: number | null): GradeColor {
  if (score === null) return 'score-f';
  if (score >= 80) return 'score-a';
  if (score >= 60) return 'score-b';
  if (score >= 40) return 'score-c';
  if (score >= 20) return 'score-d';
  return 'score-f';
}

export function gradeLetter(score: number | null): string {
  if (score === null) return '—';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}
