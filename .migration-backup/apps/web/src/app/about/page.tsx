import type { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Tuskrank — the pet food intelligence platform.',
};

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-bold tracking-tight">About Tuskrank</h1>
          <p className="text-lg text-muted-foreground">
            Pet food intelligence, powered by data and science.
          </p>
        </div>
        <div className="space-y-8">
          <Section title="Our Mission">
            <p>
              We believe pet owners deserve to know exactly what goes into their pet&apos;s food.
              Our scoring methodology evaluates products across multiple dimensions: ingredient
              quality, safety, nutritional balance, and brand transparency.
            </p>
          </Section>
          <Section title="How Scoring Works">
            <p>
              Each product receives a score from 0-100 based on seven weighted criteria: ingredient
              quality, safety record, nutritional balance, processing level, scientific evidence,
              controversial ingredients, and label transparency. Scores are computed using a
              multi-strategy engine with configurable weights.
            </p>
          </Section>
          <Section title="Data Sources">
            <p>
              Our data comes from manufacturer disclosures, regulatory databases, independent
              laboratory testing, scientific publications, and community contributions. All data is
              versioned and auditable.
            </p>
          </Section>
          <Section title="Transparency">
            <p>
              Every score is accompanied by a detailed breakdown so you can understand exactly how
              it was calculated. We publish our methodology openly and welcome community review and
              contributions.
            </p>
          </Section>
        </div>
      </div>
    </MainLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 sm:p-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
    </div>
  );
}
