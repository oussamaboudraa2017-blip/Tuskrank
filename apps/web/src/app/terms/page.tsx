import type { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Tuskrank terms of service.',
};

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <div className="prose mt-6 space-y-4 text-[var(--text-secondary)]">
          <p><em>Last updated: June 29, 2026</em></p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Acceptance</h2>
          <p>
            By accessing or using Tuskrank, you agree to these terms. If you do not agree, please
            do not use the platform.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Use of Service</h2>
          <p>
            Tuskrank provides pet food information for educational purposes. Product scores and
            recommendations are based on data analysis and should not replace professional veterinary
            advice.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Accuracy</h2>
          <p>
            We strive for accuracy but cannot guarantee that all data is complete or current. Always
            verify product information with the manufacturer before making purchasing decisions.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Limitation of Liability</h2>
          <p>
            Tuskrank is provided &ldquo;as is&rdquo; without warranties. We are not liable for any
            decisions made based on the information provided on this platform.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
