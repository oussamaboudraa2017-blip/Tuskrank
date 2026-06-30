# SEO Rules

## Page-Level Requirements

Every public page must have:
- Unique `<title>` tag (50-60 characters).
- Unique `<meta name="description">` (150-160 characters).
- Canonical URL (`<link rel="canonical">`).
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`).
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).

## Structured Data

- Product pages: `Product` + `AggregateRating` + `Review` schema.
- Ingredient pages: `Article` or `MedicalWebPage` schema.
- Comparison pages: `ItemList` schema.
- Organization schema on every page via layout.
- BreadcrumbList schema on all interior pages.

## URL Structure

- Product: `/products/{brand-slug}/{product-slug}`
- Ingredient: `/ingredients/{ingredient-slug}`
- Comparison: `/compare?products={slug-a},{slug-b}`
- Category: `/{pet-type}/{category-slug}`
- Search: `/search?q={query}`

## Technical SEO

- All pages must be server-side rendered (SSR or SSG). No CSR-only pages.
- Generate dynamic XML sitemaps: `/sitemap.xml` (products, ingredients, comparisons).
- Implement `robots.txt` allowing all crawlers, disallowing admin routes.
- Proper HTTP status codes: 200 (OK), 301 (permanent redirect), 404 (not found), 410 (gone).
- Implement hreflang only if expanding beyond US English (not needed for V1).

## Content SEO

- Product pages must have 300+ words of unique content.
- Use target keywords naturally in headings (H1, H2, H3) and body text.
- Internal links between related products, ingredients, and comparisons.
- No keyword stuffing. Write for humans first.
- Use descriptive alt text on all images.

## Performance (Core Web Vitals)

- LCP (Largest Contentful Paint) < 2.5 seconds.
- FID (First Input Delay) < 100 milliseconds.
- CLS (Cumulative Layout Shift) < 0.1.
- Monitor via Lighthouse CI in the deployment pipeline.