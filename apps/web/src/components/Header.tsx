'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { classNames } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/compare', label: 'Compare' },
  { href: '/about', label: 'About' },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Tuskrank
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={classNames(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-[var(--bg-secondary)] text-[var(--text)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text)]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  return (
    <button
      onClick={() => {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
      }}
      className="rounded-md p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
      aria-label="Toggle dark mode"
    >
      <svg className="h-5 w-5 dark:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
      <svg className="hidden h-5 w-5 dark:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    </button>
  );
}
