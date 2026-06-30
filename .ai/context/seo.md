# SEO Strategy

## Target Market

United States. All content, metadata, and structured data is optimized for US-based search queries.

## Target Keywords

### Head Terms
- pet food review
- pet food comparison
- best dog food
- best cat food
- pet food ingredients

### Long-Tail Terms
- [brand] [product] review
- is [ingredient] safe for dogs/cats
- [brand] vs [brand] comparison
- grain-free dog food analysis
- best dog food for [condition]

## On-Page SEO Requirements

### Product Pages
- Unique title: `{Product Name} Review & Analysis | Tuskrank`
- Meta description: AI-generated summary of key findings.
- Canonical URL: `tuskrank.com/products/{slug}`
- Open Graph and Twitter Card metadata.
- JSON-LD structured data (Product, Review, Rating).

### Ingredient Pages
- Unique title: `{Ingredient Name}: What Pet Owners Need to Know | Tuskrank`
- Meta description: Safety profile, usage, and products containing this ingredient.
- JSON-LD structured data.

### Comparison Pages
- Title: `{Product A} vs {Product B} | Tuskrank`
- Tabular structured data for comparison.

### Category/Landing Pages
- Title: `Best {Category} Pet Food – Ranked & Reviewed | Tuskrank`
- Internal linking to top-ranked products.

## Technical SEO

- Server-side rendering (Next.js RSC) for all public pages.
- Dynamic XML sitemap generation.
- `robots.txt` with proper crawl directives.
- Fast page loads (Core Web Vitals in green).
- Proper HTTP status codes (301 for redirects, 404 for missing, 410 for removed).
- Hreflang not needed (US-only, English).

## Content SEO

- Each product page has 300+ words of unique content (AI-generated analysis).
- Ingredient pages have educational content about each ingredient.
- Blog/guide content planned for future sprints (informational queries).
- Internal linking between products, ingredients, and comparisons.

## Performance Targets

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Pages indexed in Google within 48 hours of publication.
