# Sprint 7 — AI

> _Placeholder sprint spec._

## Goals

- Implement AI explanations for ingredient panels.
- Implement natural-language search understanding.
- Add prompt registry + per-prompt rate limiting + cost tracking.
- Persist AI outputs with provenance.

## Acceptance Criteria

- All AI outputs include a "may be inaccurate" disclaimer.
- AI calls are cached for identical inputs (TTL window).
- Failure modes fall back to deterministic templates.

---

_See also: `../rules/security_rules.md`, `../rules/backend_rules.md`._
