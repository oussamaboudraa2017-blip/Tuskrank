# Sprint 3 — Search

> _Placeholder sprint spec._

## Goals

- Implement product search (full-text on name, brand, ingredient names).
- Implement ingredient search (full-text + facets).
- Rank results using a transparent scoring formula.
- Add search analytics logging.
- Expose `/v1/search/products`, `/v1/search/ingredients`.

## Acceptance Criteria

- Search p95 latency < 200ms for warm cache.
- Empty results return clear "no results" with suggestions.
- Searches are logged with query, result count, latency, user id (if authed).

---

_See also: `../rules/backend_rules.md`, `../context/product.md`._
