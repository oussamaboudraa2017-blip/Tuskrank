import { PackageSearch } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

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
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <PackageSearch className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      {action && (
        <Link href={action.href}>
          <Button className="mt-6">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
