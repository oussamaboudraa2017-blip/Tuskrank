# Testing Rules

> _Placeholder — to be elaborated in Sprint 9._

## Principles

1. **Test pyramid** — many unit, fewer integration, few end-to-end.
2. **Tests are first-class code.** Same review rigor as production code.
3. **Tests must be deterministic.** No reliance on network, time, or external state.
4. **Tests must be fast.** A full unit test suite completes in under 60 seconds (aspirational).

## Levels

### Unit

- Pure functions, no I/O, no network.
- Colocated: `*.test.ts` next to source.
- 100% coverage on shared utilities (`packages/utils`).

### Integration

- DB-mediated tests run in isolated test DB or schema-per-test.
- API tests use a NestJS testing module.

### End-to-End

- Playwright (assumed).
- Critical user journeys only.
- Stable selectors (`data-testid`) when needed.

## Coverage

- Backend: > 80% line coverage on critical services.
- Frontend: meaningful test coverage for shared components and utilities.
- DB: migrations smoke-tested.

## Forbidden

- Snapshot tests for non-trivial components.
- Mocking the thing you're trying to test.
- Time-dependent assertions without a clock abstraction.

---

_See also: `coding_rules.md`, `../prompts/Sprint_09_Testing.md`._
