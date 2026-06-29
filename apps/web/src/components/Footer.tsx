import Link from 'next/link';

const links = [
  { href: '/search', label: 'Search Products' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-[var(--bg-secondary)]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm text-[var(--text-secondary)]">
          &copy; {new Date().getFullYear()} Tuskrank. All rights reserved.
        </p>
        <nav className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
