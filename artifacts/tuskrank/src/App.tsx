import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/layout/theme-provider';

import HomePage from '@/pages/home';
import SearchPage from '@/pages/search';
import ComparePage from '@/pages/compare';
import AboutPage from '@/pages/about';
import PrivacyPage from '@/pages/privacy';
import TermsPage from '@/pages/terms';
import BrandsDetailPage from '@/pages/brands-detail';
import ProductsDetailPage from '@/pages/products-detail';
import IngredientsDetailPage from '@/pages/ingredients-detail';
import NotFound from '@/pages/not-found';

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/brands/:slug">
        {(params) => <BrandsDetailPage slug={params!.slug} />}
      </Route>
      <Route path="/products/:slug">
        {(params) => <ProductsDetailPage slug={params!.slug} />}
      </Route>
      <Route path="/ingredients/:slug">
        {(params) => <IngredientsDetailPage slug={params!.slug} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
          },
        },
      }),
  );

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster position="bottom-right" richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
