import type { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Tuskrank — the pet food intelligence platform.',
};

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold">About Tuskrank</h1>
        <div className="prose mt-6 space-y-4 text-[var(--text-secondary)]">
          <p>
            Tuskrank is an open pet food intelligence platform that brings transparency to the pet
            food industry. We aggregate product data, ingredient information, and scientific research
            to help pet owners make informed decisions.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Our Mission</h2>
          <p>
            We believe pet owners deserve to know exactly what goes into their pet&apos;s food. Our
            scoring methodology evaluates products across multiple dimensions: ingredient quality,
            safety, nutritional balance, and brand transparency.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">How Scoring Works</h2>
          <p>
            Each product receives a score from 0-100 based on seven weighted criteria: ingredient
            quality, safety record, nutritional balance, processing level, scientific evidence,
            controversial ingredients, and label transparency. Scores are computed using a
            multi-strategy engine with configurable weights.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Data Sources</h2>
          <p>
            Our data comes from manufacturer disclosures, regulatory databases, independent
            laboratory testing, scientific publications, and community contributions. All data is
            versioned and auditable.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
