import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Search, BarChart3, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/MainLayout';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProductList, useBrandFeatured } from '@/lib/queries';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.1 } } };

const features = [
  { title: 'Smart Search', description: 'Full-text search across products, brands, and ingredients with intelligent ranking.', icon: Search, href: '/search' },
  { title: 'Side-by-Side Compare', description: 'Compare products, ingredients, and nutritional profiles in a clean interface.', icon: BarChart3, href: '/compare' },
  { title: 'Transparent Scoring', description: 'Multi-dimensional scoring based on ingredient quality, safety, and nutrition.', icon: ShieldCheck, href: '/about' },
  { title: 'Data-Driven', description: 'Scientific research and regulatory data power every score and recommendation.', icon: TrendingUp, href: '/about' },
];

export default function HomePage() {
  const products = useProductList({ limit: '6', sortBy: 'overall_score', sortOrder: 'desc' });
  const brands = useBrandFeatured(6);

  return (
    <MainLayout>
      <Helmet>
        <title>Tuskrank — Pet Food Intelligence Platform</title>
        <meta name="description" content="Search, compare, and score pet food products. Ingredient transparency backed by data and science." />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
          <motion.div initial="initial" animate="animate" variants={stagger} className="mx-auto max-w-3xl text-center">
            <motion.div variants={fadeUp} className="mb-6 flex justify-center">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Pet Food Intelligence Platform
              </Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Know What&apos;s in<span className="text-primary"> Their Bowl</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground sm:text-xl">
              Search, compare, and score pet food products. Ingredient transparency backed by data and science.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/search">
                <Button size="lg" className="gap-2 text-base">
                  <Search className="h-4 w-4" />
                  Search Products
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" className="text-base">Learn More</Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Top Rated Products */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">Top Rated Products</h2>
                <p className="mt-1 text-muted-foreground">Highest scored pet foods</p>
              </div>
              <Link href="/search">
                <Button variant="ghost" className="gap-1.5">View all <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            {products.isLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}
            {products.isError && (
              <ErrorDisplay title="Could not load products" message={products.error?.message ?? 'Please try again later.'} onRetry={() => products.refetch()} />
            )}
            {products.data && products.data.data.length === 0 && (
              <EmptyState title="No products yet" message="Check back soon as we add more products." />
            )}
            {products.data && products.data.data.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.data.data.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl font-bold sm:text-3xl">Everything you need to decide</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Powerful tools to research and compare pet food products with confidence.</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={feature.href} className="group block rounded-xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Brands */}
      {brands.data && brands.data.length > 0 && (
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Featured Brands</h2>
                <Link href="/search"><Button variant="ghost" className="gap-1.5">View all <ArrowRight className="h-4 w-4" /></Button></Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {brands.data.map((b, i) => (
                  <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/brands/${b.slug}`} className="group block rounded-xl border bg-card p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {b.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">{b.name}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {b.productCount} product{b.productCount !== 1 ? 's' : ''}
                        {b.avgScore !== null ? ` · ${b.avgScore.toFixed(1)} avg` : ''}
                      </p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="relative">
              <h2 className="text-2xl font-bold sm:text-3xl">Ready to make informed choices?</h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Start searching thousands of pet food products with transparent, data-driven scores.</p>
              <Link href="/search"><Button size="lg" className="mt-6 gap-2"><Search className="h-4 w-4" />Start Searching</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
