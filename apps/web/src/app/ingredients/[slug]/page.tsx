'use client';

import { use } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { ScoreBadge } from '@/components/ScoreBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import {
  useIngredientDetail,
  useIngredientReferences,
  useIngredientScoreHistory,
} from '@/lib/queries';
import { formatDate } from '@/lib/utils';

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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-[var(--text-secondary)]">
          <Link href="/search" className="hover:text-[var(--text)]">Search</Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--text)]">Loading...</span>
        </nav>

        {detail.isLoading && <LoadingSpinner size="lg" />}

        {detail.isError && (
          <ErrorDisplay
            title="Ingredient not found"
            message={detail.error?.message ?? 'This ingredient could not be loaded.'}
            onRetry={() => detail.refetch()}
          />
        )}

        {detail.data && (
          <IngredientDetail
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

function IngredientDetail({
  ingredient: i,
  references,
  referencesLoading,
  scores,
}: {
  ingredient: import('@/lib/types').IngredientDetail;
  references: import('@/lib/types').IngredientReference[];
  referencesLoading: boolean;
  scores: import('@/lib/types').IngredientScore[];
}) {
  return (
    <>
      <nav className="mb-6 text-sm text-[var(--text-secondary)]">
        <Link href="/search" className="hover:text-[var(--text)]">Search</Link>
        <span className="mx-2">/</span>
        <Link href="/ingredients" className="hover:text-[var(--text)]">Ingredients</Link>
        <span className="mx-2">/</span>
        <span className="text-[var(--text)]">{i.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{i.name}</h1>
            {i.inciName && <p className="mt-1 text-[var(--text-secondary)]">INCI: {i.inciName}</p>}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            {i.isAnimalDerived && <Badge>Animal-derived</Badge>}
            {i.isCommonAllergen && <Badge variant="danger">Common Allergen</Badge>}
            {i.isControversial && <Badge variant="warning">Controversial</Badge>}
            {i.categoryName && <Badge>{i.categoryName}</Badge>}
          </div>

          {i.description && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-[var(--text-secondary)]">{i.description}</p>
            </div>
          )}

          {!i.description && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center text-[var(--text-secondary)]">
              No description available for this ingredient.
            </div>
          )}

          {references.length > 0 && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6">
              <h2 className="mb-4 text-lg font-semibold">Scientific References ({references.length})</h2>
              <ul className="space-y-4">
                {references.map((ref) => (
                  <li key={ref.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{ref.title}</p>
                        {ref.authors && <p className="text-xs text-[var(--text-secondary)]">{ref.authors}</p>}
                        {ref.publication && (
                          <p className="text-xs text-[var(--text-secondary)]">
                            {ref.publication}{ref.publishedYear ? ` (${ref.publishedYear})` : ''}
                          </p>
                        )}
                      </div>
                      {ref.evidenceType && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          ref.evidenceType === 'supports' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          ref.evidenceType === 'refutes' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                        }`}>
                          {ref.evidenceType}
                        </span>
                      )}
                    </div>
                    {ref.doi && (
                      <a href={`https://doi.org/${ref.doi}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-[var(--ring)] hover:underline">
                        DOI: {ref.doi}
                      </a>
                    )}
                    {ref.notes && <p className="mt-1 text-xs text-[var(--text-secondary)]">{ref.notes}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {references.length === 0 && !referencesLoading && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)]">
              No scientific references available.
            </div>
          )}

          {scores.length > 0 && (
            <div className="rounded-xl border bg-[var(--bg-card)] p-6">
              <h2 className="mb-4 text-lg font-semibold">Score History</h2>
              <ul className="space-y-3">
                {scores.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{s.score}/100</span>
                      <span className="ml-2 text-[var(--text-secondary)]">({s.grade})</span>
                      {s.isCurrent && <span className="ml-2 text-xs text-[var(--ring)]">current</span>}
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">v{s.scoringVersion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border bg-[var(--bg-card)] p-6 text-center">
            <ScoreBadge score={i.score} size="lg" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Ingredient Score</p>
          </div>

          <div className="rounded-xl border bg-[var(--bg-card)] p-6 space-y-3">
            <InfoRow label="Canonical Name" value={i.canonicalName} />
            <InfoRow label="Category" value={i.categoryName ?? '—'} />
            <InfoRow label="Products" value={String(i.productCount)} />
            <InfoRow label="Created" value={formatDate(i.createdAt)} />
            <InfoRow label="Updated" value={formatDate(i.updatedAt)} />
          </div>
        </div>
      </div>
    </>
  );
}

function Badge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'danger' | 'warning' }) {
  const colors = {
    default: 'bg-[var(--bg-secondary)] text-[var(--text)]',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${colors[variant]}`}>{children}</span>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
