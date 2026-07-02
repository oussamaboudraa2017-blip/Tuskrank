# SEO

> _Placeholder — to be elaborated in Sprint 8 (Sprint_08_SEO)._

## SEO Strategy Overview

Tuskrank's SEO strategy targets the **long tail of pet food queries** in the US. Most content is **programmatic** (product and ingredient pages) with **editorial** editorial support added later.

## Pillars

1. **Programmatic product pages**
   - One URL per product: `/products/{brand-slug}/{product-slug}`
   - Unique titles, descriptions, structured data, OG/Twitter cards
2. **Programmatic ingredient pages**
   - One URL per ingredient: `/ingredients/{ingredient-slug}`
   - Educational + product-listing content
3. **Editorial hub (later)**
   - Long-form articles targeting high-volume queries
4. **Comparison pages**
   - `/compare/{slug-a}-vs-{slug-b}` generating relevant, original comparisons

## Technical SEO Requirements

- Server-side rendering (Next.js App Router)
- Canonical URLs on every page
- XML sitemap (auto-generated)
- `robots.txt` policy
- Structured data: `Product`, `BreadcrumbList`, `Organization`, `Article`
- Open Graph + Twitter cards
- Core Web Vitals budget

## Performance Budget

- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- JS payload < 180 KB gzipped on landing pages

## Indexation Discipline

- No thin content
- No duplicate products
- Canonicalize variants (flavor, size)
- Log and monitor Search Console errors

---

_See also: `../rules/seo_rules.md`, `../prompts/Sprint_08_SEO.md`._
