import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, Package, Tag, FileText, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
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

export default function ProductsDetailPage({ slug }: { slug: string }) {
  const { data, isLoading, isError, error, refetch } = useProductDetail(slug);

  return (
    <MainLayout>
      <Helmet>
        <title>{data ? `${data.data.name} — Tuskrank` : 'Product — Tuskrank'}</title>
        {data && <meta name="description" content={`Score and ingredient breakdown for ${data.data.name} by ${data.data.brand.name}.`} />}
      </Helmet>
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
              {p.primaryProteinSource && (
                <Badge variant="outline">{p.primaryProteinSource}</Badge>
              )}
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
                {p.updatedAt && <InfoItem label="Updated" value={formatDate(p.updatedAt)} />}
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
                <CardTitle className="text-base">Nutrition Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {Object.entries(p.nutritionProfile).map(([key, val]) =>
                    val !== null && val !== undefined ? (
                      <InfoItem
                        key={key}
                        label={key.replace(/([A-Z])/g, ' $1').trim()}
                        value={String(val)}
                      />
                    ) : null,
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          {p.ingredients && p.ingredients.data && p.ingredients.data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {p.ingredients.data.map((ing: any, i: number) => (
                    <div key={ing.id ?? i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}</span>
                        {ing.slug ? (
                          <Link
                            href={`/ingredients/${ing.slug}`}
                            className="text-sm hover:text-primary transition-colors truncate"
                          >
                            {ing.name}
                          </Link>
                        ) : (
                          <span className="text-sm truncate">{ing.name}</span>
                        )}
                      </div>
                      {ing.score !== undefined && ing.score !== null && (
                        <ScoreBadge score={ing.score} size="sm" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claims */}
          {p.claims && p.claims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Claims
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {p.claims.map((c: any) => (
                    <Badge key={c.id} variant="outline">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {p.tags && p.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((tag: any) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mobile overall score */}
          <div className="sm:hidden">
            <Card>
              <CardContent className="flex justify-center pt-6">
                <OverallScoreBadge score={score?.overall ?? null} />
              </CardContent>
            </Card>
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

          {/* Brand */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Brand</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/brands/${p.brand.slug}`}
                className="flex items-center gap-3 hover:text-primary transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {p.brand.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{p.brand.name}</span>
              </Link>
            </CardContent>
          </Card>

          <Separator />

          <Link href="/compare" className="text-sm text-primary hover:underline">
            Compare this product →
          </Link>
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
