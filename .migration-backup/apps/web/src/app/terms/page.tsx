import type { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Tuskrank terms of service.',
};

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 29, 2026</p>
        </div>
        <div className="space-y-6">
          <Section title="Acceptance">
            <p>
              By accessing or using Tuskrank, you agree to these terms. If you do not agree, please
              do not use the platform.
            </p>
          </Section>
          <Section title="Use of Service">
            <p>
              Tuskrank provides pet food information for educational purposes. Product scores and
              recommendations are based on data analysis and should not replace professional
              veterinary advice.
            </p>
          </Section>
          <Section title="Accuracy">
            <p>
              We strive for accuracy but cannot guarantee that all data is complete or current.
              Always verify product information with the manufacturer before making purchasing
              decisions.
            </p>
          </Section>
          <Section title="Limitation of Liability">
            <p>
              Tuskrank is provided &ldquo;as is&rdquo; without warranties. We are not liable for
              any decisions made based on the information provided on this platform.
            </p>
          </Section>
        </div>
      </div>
    </MainLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-4">{children}</div>
    </div>
  );
}
