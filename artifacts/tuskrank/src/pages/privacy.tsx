import MainLayout from '@/components/MainLayout';

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-2 mb-10">
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 29, 2026</p>
        </div>
        <div className="space-y-6">
          <Section title="Information We Collect">
            <p>
              Tuskrank is designed with privacy in mind. We collect minimal data necessary to
              provide our service: search queries (to improve results), usage analytics (to improve
              the platform), and account information if you create an account.
            </p>
          </Section>
          <Section title="How We Use Your Data">
            <p>
              We use collected data solely to operate and improve Tuskrank. We do not sell personal
              information to third parties. Analytics data is aggregated and anonymized.
            </p>
          </Section>
          <Section title="Cookies">
            <p>
              We use essential cookies for authentication and preference storage (e.g., dark mode).
              Analytics cookies are only used with your consent.
            </p>
          </Section>
          <Section title="Contact">
            <p>
              For privacy inquiries, please contact us at{' '}
              <a href="mailto:privacy@tuskrank.com" className="text-primary hover:underline">
                privacy@tuskrank.com
              </a>
              .
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
