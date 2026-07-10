import { Link } from 'wouter';
import { Home } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/MainLayout';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <MainLayout>
      <Helmet><title>404 Not Found — Tuskrank</title></Helmet>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="text-8xl font-bold text-primary/20 tracking-tight">404</div>
        <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="mt-8">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    </MainLayout>
  );
}
