# Frontend Rules

> _Placeholder — to be elaborated in Sprint 5._

## Framework

- Next.js 15 (App Router), React 19, TypeScript.
- Server Components by default; Client Components only where needed.

## Styling

- Tailwind CSS utility-first.
- shadcn/ui primitives, customized via `packages/ui`.
- No inline styles except for dynamic computed values.

## Components

- Components live in `packages/ui` if reusable, otherwise co-located.
- Components are **typed end-to-end** — no implicit `any`.
- Props use discriminated unions for variants.

## State

- Local component state where possible.
- Server state via React Query / SWR (added in Sprint 5).
- Global state via React Context or Zustand only when justified.

## Data Fetching

- Use Next.js Server Components for SEO-critical data.
- Client fetches via typed API clients generated from OpenAPI (later sprints).

## Accessibility

- WCAG 2.1 AA as a baseline.
- Keyboard navigable.
- Focus rings always present.

## Performance

- LCP < 2.5s on landing pages.
- Code-split per route.
- No client-only data fetches for SEO pages.

## Forbidden

- Reaching into `localStorage` on the server.
- `dangerouslySetInnerHTML` without sanitization and a documented reason.
- Hard-coded copy strings in deeply nested components.

---

_See also: `coding_rules.md`, `seo_rules.md`._
