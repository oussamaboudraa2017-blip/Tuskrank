# SEO Rules

> _Placeholder — to be elaborated in Sprint 8._

## Content Quality

1. **No thin pages.** Every indexable page has substantive unique content.
2. **Canonical URLs are mandatory** on every page.
3. **Meta titles and descriptions** are unique per page.
4. **Structured data** validates against schema.org definitions.

## Technical SEO

- SSR or SSG for all indexable pages.
- Static generation for programmatic pages where data is stable.
- Incremental regeneration only with care.

## URLs

- Lowercase, hyphenated.
- No parameters on canonical.
- Slugs are stable identifiers (never change after publish).

## Crawl Controls

- `robots.txt` denies internal and admin paths.
- Sitemap auto-generated and split if > 50k URLs.
- 404 and 410 responses return correct status codes.

## Performance as SEO

- Core Web Vitals are first-class engineering requirements.
- LCP image must use `next/image`.
- Fonts preloaded when used above the fold.

## Forbidden

- Cloaking.
- Link schemes.
- Auto-generated doorway content.
- Hidden text or off-screen keyword stuffing.

---

_See also: `../context/seo.md`, `../prompts/Sprint_08_SEO.md`._
