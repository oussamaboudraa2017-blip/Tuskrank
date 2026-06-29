import Link from 'next/link';
import MainLayout from '@/components/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-4 text-lg text-[var(--text-secondary)]">Page not found</p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-[var(--ring)] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </MainLayout>
  );
}
