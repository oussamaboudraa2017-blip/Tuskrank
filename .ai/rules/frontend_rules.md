# Frontend Rules

## Next.js 15 Conventions

- Use the App Router exclusively. No Pages Router.
- Prefer React Server Components (RSC) by default. Only use `"use client"` when necessary (interactivity, hooks, browser APIs).
- Keep Server Components as the default. Client Components should be leaf nodes in the component tree.
- Use `loading.tsx` for route-level loading states.
- Use `error.tsx` for route-level error boundaries.
- Use `not-found.tsx` for custom 404 pages.
- Use `metadata` exports for SEO on every page.

## Component Architecture

- One component per file.
- Colocate related components in the same directory.
- Use shadcn/ui as the component library. Do not reinvent UI primitives.
- Compose shadcn/ui primitives into domain-specific components.
- Keep components focused and small. If a component exceeds 200 lines, split it.
- Pass minimal props. Derive data inside the component when possible.

## Styling

- Tailwind CSS for all styling. No inline styles, no CSS modules, no styled-components.
- Follow the shadcn/ui design system for consistency.
- Use CSS variables (via Tailwind config) for theming.
- Mobile-first responsive design.
- No `!important` declarations.

## Data Fetching

- In Server Components: fetch data directly or via server-side utilities.
- In Client Components: use SWR or React Query for client-side data fetching.
- For mutations: use Server Actions (preferred) or API routes.
- Never fetch data in `useEffect` — use a data-fetching library.
- Implement optimistic updates for better UX on mutations.

## Performance

- Use `next/image` for all images with proper sizing and lazy loading.
- Use `dynamic` imports for heavy client-side components.
- Minimize client-side JavaScript bundle size.
- Use `Suspense` boundaries for progressive loading.
- Prefetch links with `Link` component where appropriate.

## Accessibility

- All interactive elements must be keyboard accessible.
- Use semantic HTML elements (`button`, `nav`, `main`, `article`, etc.).
- All images must have `alt` text.
- Use ARIA attributes only when semantic HTML is insufficient.
- Test with screen reader navigation in mind.
- Maintain sufficient color contrast ratios.