import type { Metadata } from 'next';
import MainLayout from '@/components/MainLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Tuskrank privacy policy.',
};

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <div className="prose mt-6 space-y-4 text-[var(--text-secondary)]">
          <p><em>Last updated: June 29, 2026</em></p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Information We Collect</h2>
          <p>
            Tuskrank is designed with privacy in mind. We collect minimal data necessary to provide
            our service: search queries (to improve results), usage analytics (to improve the
            platform), and account information if you create an account.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">How We Use Your Data</h2>
          <p>
            We use collected data solely to operate and improve Tuskrank. We do not sell personal
            information to third parties. Analytics data is aggregated and anonymized.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Cookies</h2>
          <p>
            We use essential cookies for authentication and preference storage (e.g., dark mode).
            Analytics cookies are only used with your consent.
          </p>
          <h2 className="text-xl font-semibold text-[var(--text)]">Contact</h2>
          <p>For privacy inquiries, please contact us at privacy@tuskrank.com.</p>
        </div>
      </div>
    </MainLayout>
  );
}
