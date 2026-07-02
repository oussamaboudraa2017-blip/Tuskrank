# Engineering Principles

> _Placeholder — to be elaborated post–Sprint 0._

## Pillars

### 1. Correctness Over Cleverness

Prefer the simplest correct solution. Cleverness is technical debt waiting to be paid.

### 2. Boring Where Possible, Innovative Where Necessary

Innovation is reserved for product features — never for infrastructure.

### 3. Type System as Documentation

If the types are unclear, the design is unclear. Refactor the design, not the type comments.

### 4. Reversibility

Prefer decisions that are easy to reverse. Make irreversible decisions deliberately and late.

### 5. Observability From Day One

No service ships without logs, metrics, traces, health checks, and dashboards.

### 6. Tests Are a First-Class Output

Tests are part of the deliverable, not an afterthought. Coverage is a floor, not a target.

### 7. Performance Is a Feature

Performance regressions are bugs. Treat them as such.

### 8. Security Is Non-Negotiable

Authentication, authorization, validation, and audit logging are baseline — never optional.

### 9. SEO Is Engineering, Not Marketing

Programmatic SEO is a software problem and is built into the architecture.

### 10. AI Output Is Always Provisional

Every AI output is versioned, audited, and presented with provenance and uncertainty.

### 11. Cost Is a Variable

We track cost per request, per render, per search. We optimize for unit cost, not just performance.

### 12. People Are Also Users

DX (developer experience) is part of the product. Build tools that make correct work easy.

---

_See also: `system_prompt.md`, `../rules/`._
