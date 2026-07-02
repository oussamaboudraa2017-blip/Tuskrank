'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Package, Tag, FileText, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/MainLayout';
import { OverallScoreBadge, ScoreBadge, ScoreBar } from '@/components/ScoreBadge';
import { LoadingPage } from '@/components/Loading';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProductDetail } from '@/lib/queries';
import { formatDate } from '@/lib/utils';
import type { ProductDetail } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: Props) {
  const { slug } = use(params);
  const { data, isLoading, isError, error, refetch } = useProductDetail(slug);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && <LoadingPage />}
        {isError && (
          <ErrorDisplay
            title="Product not found"
            message={error?.message ?? 'This product could not be loaded.'}
            onRetry={() => refetch()}
          />
        )}
        {data && <ProductDetailContent product={data.data} />}
      </div>
    </MainLayout>
  );
}

function ProductDetailContent({ product: p }: { product: ProductDetail }) {
  const score = p.currentScore;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground transition-colors">
          Search
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/brands/${p.brand.slug}`} className="hover:text-foreground transition-colors">
          {p.brand.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{p.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title */}
          <div>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold sm:text-4xl">{p.name}</h1>
                <p className="mt-1.5 text-lg text-muted-foreground">{p.brand.name}</p>
              </div>
              <div className="hidden sm:block">
                <OverallScoreBadge score={score?.overall ?? null} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.foodForm && <Badge variant="secondary">{p.foodForm}</Badge>}
              {p.primaryProteinSource && <Badge variant="outline">{p.primaryProteinSource}</Badge>}
              {p.packageSizeLabel && <Badge variant="outline">{p.packageSizeLabel}</Badge>}
            </div>
          </div>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-muted-foreground" />
                Product Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoItem label="Form" value={p.foodForm ?? '—'} />
                <InfoItem label="Protein" value={p.primaryProteinSource ?? '—'} />
                <InfoItem label="Size" value={p.packageSizeLabel ?? '—'} />
                <InfoItem label="UPC" value={p.upc ?? '—'} />
                <InfoItem label="SKU" value={p.sku ?? '—'} />
                <InfoItem label="Published" value={formatDate(p.publishedAt)} />
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {p.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{p.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Nutrition */}
          {p.nutritionProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Nutrition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {p.nutritionProfile.kcalPer100g !== null && (
                    <InfoItem label="Kcal / 100g" value={String(p.nutritionProfile.kcalPer100g)} />
                  )}
                  {p.nutritionProfile.kcalPerCup !== null && (
                    <InfoItem label="Kcal / cup" value={String(p.nutritionProfile.kcalPerCup)} />
                  )}
                  {p.nutritionProfile.moisturePct !== null && (
                    <InfoItem label="Moisture" value={`${p.nutritionProfile.moisturePct}%`} />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          {p.ingredients && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Ingredients {p.ingredients.count > 0 && `(${p.ingredients.count})`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {p.ingredients.data.length > 0 ? (
                  <ol className="space-y-1.5">
                    {p.ingredients.data.map((entry) => (
                      <li key={entry.position} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                          {entry.position}
                        </span>
                        <Link
                          href={`/ingredients/${entry.ingredient.slug}`}
                          className="flex-1 text-sm font-medium hover:text-primary transition-colors"
                        >
                          {entry.ingredient.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          {entry.percentageValue !== null && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {entry.percentageValue}%
                            </span>
                          )}
                          {entry.ingredient.currentScore !== null && (
                            <ScoreBadge score={entry.ingredient.currentScore} size="sm" />
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground justify-center">
                    <AlertCircle className="h-4 w-4" />
                    No ingredient data available.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Claims */}
          {p.claims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {p.claims.map((claim) => (
                    <div key={claim.id}>
                      <p className="text-sm font-medium">{claim.name}</p>
                      {claim.evidenceNote && (
                        <p className="text-xs text-muted-foreground mt-0.5">{claim.evidenceNote}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mobile Score */}
          <div className="sm:hidden">
            <OverallScoreBadge score={score?.overall ?? null} />
          </div>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {score ? (
                <>
                  <ScoreBar score={score.quality} label="Quality" />
                  <ScoreBar score={score.safety} label="Safety" />
                  <ScoreBar score={score.nutrition} label="Nutrition" />
                  <ScoreBar score={score.transparency} label="Transparency" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No score available yet.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {p.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}
