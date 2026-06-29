# Sprint 05 — Frontend — Core Pages

## Objective

Build the core user-facing pages of the Tuskrank web application using Next.js 15, React 19, Tailwind CSS, and shadcn/ui.

## Prerequisites

- Sprint 02 completed (backend API available).
- Sprint 03 completed (search API available).
- Sprint 04 completed (scoring system available).
- Design system and component library established in packages/ui.

## Scope

### Homepage
- Hero section with search bar.
- Popular products carousel.
- Category browsing.
- "How it works" section explaining Tuskrank's value.

### Product Detail Page
- Product name, brand, category, image.
- Overall score with dimension breakdown.
- Ingredient list with quality indicators.
- Nutrition facts table.
- AI analysis section (placeholder if Sprint 07 not complete).
- "Compare with" suggestions.
- SEO metadata and structured data.

### Ingredient Detail Page
- Ingredient name, category, safety tier.
- Nutritional function description.
- List of products containing this ingredient.
- Safety profile and known concerns.
- SEO metadata and structured data.

### Comparison Page
- Side-by-side product comparison (up to 4 products).
- Comparison table for nutrition, ingredients, scores, pricing.
- Visual score comparison chart.
- Shareable comparison URL.
- SEO metadata.

### Search Results Page
- Search input (pre-filled with query).
- Filter sidebar (pet type, category, brand, price).
- Result cards with key information.
- Pagination.
- No-results state.

### Layout & Navigation
- Responsive header with navigation.
- Footer with links and legal.
- Mobile navigation (hamburger menu).
- Breadcrumb navigation on interior pages.

## Completion Criteria
- All pages render correctly on desktop and mobile.
- All data loads from the backend API.
- Navigation works between all pages.
- SEO metadata is present on all pages.
- Core Web Vitals targets are met.