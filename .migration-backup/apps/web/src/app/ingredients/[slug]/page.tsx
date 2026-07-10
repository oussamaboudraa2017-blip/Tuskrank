'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, FlaskConical, BookOpen, History, ArrowUpRight } from 'lucide-react';
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
import { formatDate } from '@/lib/utils';
import type { IngredientDetail, IngredientReference, IngredientScore } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function IngredientPage({ params }: Props) {
  const { slug } = use(params);
  const detail = useIngredientDetail(slug);
  const ingredientId = detail.data?.data?.id ?? '';

  const references = useIngredientReferences(ingredientId, !!ingredientId);
  const scores = useIngredientScoreHistory(ingredientId, !!ingredientId);

  return (
    <MainLayout>
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
            {i.inciName && (
              <p className="text-muted-foreground">INCI: {i.inciName}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {i.isAnimalDerived && <Badge variant="secondary">Animal-derived</Badge>}
              {i.isCommonAllergen && <Badge variant="destructive">Common Allergen</Badge>}
              {i.isControversial && <Badge variant="warning">Controversial</Badge>}
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
                  No description available for this ingredient.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Scientific References */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Scientific References
                {references.length > 0 && <span className="text-muted-foreground font-normal ml-1">({references.length})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referencesLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                    </div>
                  ))}
                </div>
              )}
              {!referencesLoading && references.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No scientific references available.
                </p>
              )}
              {!referencesLoading && references.length > 0 && (
                <div className="space-y-4">
                  {references.map((ref) => (
                    <div key={ref.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{ref.title}</p>
                          {ref.authors && (
                            <p className="text-xs text-muted-foreground">{ref.authors}</p>
                          )}
                          {ref.publication && (
                            <p className="text-xs text-muted-foreground">
                              {ref.publication}
                              {ref.publishedYear ? ` (${ref.publishedYear})` : ''}
                            </p>
                          )}
                        </div>
                        {ref.evidenceType && (
                          <Badge
                            variant={
                              ref.evidenceType === 'supports'
                                ? 'success'
                                : ref.evidenceType === 'refutes'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="shrink-0"
                          >
                            {ref.evidenceType}
                          </Badge>
                        )}
                      </div>
                      {ref.doi && (
                        <a
                          href={`https://doi.org/${ref.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          DOI: {ref.doi}
                        </a>
                      )}
                      {ref.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{ref.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
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
                <div className="space-y-2">
                  {scores.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={s.score} size="sm" />
                        <span className="text-sm font-medium">{s.score}/100</span>
                        <span className="text-xs text-muted-foreground">({s.grade})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          v{s.scoringVersion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <OverallScoreBadge score={i.score} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Canonical Name" value={i.canonicalName} />
              <InfoRow label="Category" value={i.categoryName ?? '—'} />
              <InfoRow
                label="Products"
                value={
                  <Link
                    href={`/search?q=${encodeURIComponent(i.name)}`}
                    className="text-primary hover:underline"
                  >
                    {i.productCount}
                  </Link>
                }
              />
              <InfoRow label="Created" value={formatDate(i.createdAt)} />
              <InfoRow label="Updated" value={formatDate(i.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
