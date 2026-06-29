interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: { label: string; href: string };
}

export function EmptyState({
  title = 'No results found',
  message = 'Try adjusting your search or filters.',
  action,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[30vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-4xl opacity-30">&#x1F50D;</div>
      <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
      <p className="mt-2 max-w-md text-[var(--text-secondary)]">{message}</p>
      {action && (
        <a
          href={action.href}
          className="mt-4 rounded-lg bg-[var(--ring)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
