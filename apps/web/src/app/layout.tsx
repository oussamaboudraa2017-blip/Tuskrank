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
  keywords: ['pet food', 'dog food', 'cat food', 'ingredients', 'nutrition', 'scoring'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Tuskrank',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
