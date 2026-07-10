import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronRight, FlaskConical, BookOpen, History } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/MainLayout';
import { OverallScoreBadge, ScoreBadge } from '@/components/ScoreBadge';
import { LoadingPage } from '@/components/Loading';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  useIngredientDetail,
  useIngredientReferences,
  useIngredientScoreHistory,
} from '@/lib/queries';
import type { IngredientDetail, IngredientReference, IngredientScore } from '@/lib/types';

export default function IngredientsDetailPage({ slug }: { slug: string }) {
  const detail = useIngredientDetail(slug);
  const ingredientId = detail.data?.data?.id ?? '';

  const references = useIngredientReferences(ingredientId, !!ingredientId);
  const scores = useIngredientScoreHistory(ingredientId, !!ingredientId);

  return (
    <MainLayout>
      <Helmet>
        <title>{detail.data ? `${detail.data.data.name} — Tuskrank` : 'Ingredient — Tuskrank'}</title>
        {detail.data && <meta name="description" content={`Ingredient safety score, research references and pet food usage data for ${detail.data.data.name}.`} />}
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {detail.isLoading && <LoadingPage />}
        {detail.isError && (
          <ErrorDisplay
            title="Ingredient not found"
            message={detail.error?.message ?? 'This ingredient could not be loaded.'}
            onRetry={() => detail.refetch()}
          />
        )}
        {detail.data && (
          <IngredientDetailContent
            ingredient={detail.data.data}
            references={references.data ?? []}
            referencesLoading={references.isLoading}
            scores={scores.data ?? []}
          />
        )}
      </div>
    </MainLayout>
  );
}

function IngredientDetailContent({
  ingredient: i,
  references,
  referencesLoading,
  scores,
}: {
  ingredient: IngredientDetail;
  references: IngredientReference[];
  referencesLoading: boolean;
  scores: IngredientScore[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/search" className="hover:text-foreground transition-colors">
          Search
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{i.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FlaskConical className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold sm:text-4xl">{i.name}</h1>
            </div>
            {i.inciName && <p className="text-muted-foreground">INCI: {i.inciName}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {i.isAnimalDerived && <Badge variant="secondary">Animal-derived</Badge>}
              {i.isCommonAllergen && <Badge variant="destructive">Common Allergen</Badge>}
              {i.isControversial && <Badge variant="outline">Controversial</Badge>}
              {i.categoryName && <Badge variant="outline">{i.categoryName}</Badge>}
            </div>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {i.description ? (
                <p className="text-muted-foreground leading-relaxed">{i.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No description available.
                </p>
              )}
            </CardContent>
          </Card>


          {/* References */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                References
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referencesLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
                  ))}
                </div>
              )}
              {!referencesLoading && references.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No references available.
                </p>
              )}
              {references.length > 0 && (
                <ul className="space-y-3">
                  {references.map((ref) => (
                    <li key={ref.id} className="text-sm">
                      <p className="font-medium">{ref.title}</p>
                      {ref.publication && (
                        <p className="text-muted-foreground text-xs mt-0.5">{ref.publication}</p>
                      )}
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline mt-0.5 block"
                        >
                          View source →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Score History */}
          {scores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Score History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scores.map((s) => (
                    <div key={s.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.scoringVersion ?? 'Score'}</p>
                        <p className="text-xs text-muted-foreground">{s.grade}</p>
                      </div>
                      <ScoreBadge score={s.score} size="sm" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Score</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <OverallScoreBadge score={i.score ?? null} />
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {i.categoryName && <InfoRow label="Category" value={i.categoryName} />}
              <InfoRow label="Animal-derived" value={i.isAnimalDerived ? 'Yes' : 'No'} />
              <InfoRow label="Common Allergen" value={i.isCommonAllergen ? 'Yes' : 'No'} />
              <InfoRow label="Controversial" value={i.isControversial ? 'Yes' : 'No'} />
            </CardContent>
          </Card>

          <Separator />

          <Link href="/search" className="text-sm text-primary hover:underline">
            Search more ingredients →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
