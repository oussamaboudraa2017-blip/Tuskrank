import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Tuskrank — Pet Food Intelligence Platform',
    template: '%s | Tuskrank',
  },
  description:
    'Search, compare, and score pet food products. Ingredient transparency backed by data and science.',
  keywords: [
    'pet food',
    'dog food',
    'cat food',
    'ingredients',
    'nutrition',
    'pet food scoring',
    'pet food comparison',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Tuskrank',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
