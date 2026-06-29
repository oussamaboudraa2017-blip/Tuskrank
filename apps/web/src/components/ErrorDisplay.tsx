import Link from 'next/link';

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'We encountered an error loading this content.',
  onRetry,
}: ErrorProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
      <p className="mt-2 max-w-md text-[var(--text-secondary)]">{message}</p>
      <div className="mt-6 flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-[var(--ring)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Try Again
          </button>
        )}
        <Link
          href="/"
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--bg-secondary)]"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
