import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  platform: [
    { href: '/search', label: 'Search Products' },
    { href: '/compare', label: 'Compare' },
    { href: '/about', label: 'About' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
  resources: [
    { href: '/search', label: 'Browse Ingredients' },
    { href: '/search', label: 'Browse Brands' },
  ],
};

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                T
              </span>
              Tuskrank
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Pet food intelligence platform. Ingredient transparency backed by data and science.
            </p>
          </div>
          {Object.entries(footerLinks).map(([key, links]) => (
            <div key={key}>
              <h3 className="mb-3 text-sm font-semibold capitalize">{key}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Tuskrank. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            For educational purposes. Not veterinary advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
