# Testing Rules

## Testing Strategy

Three levels of testing, in order of priority:

1. **Unit Tests**: Test individual functions, services, and components in isolation.
2. **Integration Tests**: Test API endpoints, database queries, and cross-module interactions.
3. **E2E Tests**: Test critical user flows end-to-end in a browser-like environment.

## Test Structure

- Test files live alongside the source files they test: `foo.ts` → `foo.test.ts`.
- Integration and E2E tests live in the `tests/` directory at the project root.
- Use describe/it blocks to organize tests logically.
- Each test must be independent. No shared mutable state between tests.
- Test file naming: `{name}.test.ts` or `{name}.spec.ts`.

## Unit Testing

- Use Vitest as the test runner for all packages.
- Mock external dependencies (API calls, database, LLM).
- Test both happy paths and error cases.
- Aim for high coverage on business logic and utility functions.
- Do not test framework internals or third-party library behavior.

## Integration Testing

- Test API endpoints against a real (test) database.
- Use a separate test database, never the development or production database.
- Reset database state between test suites.
- Test request validation, authentication, authorization, and response format.

## E2E Testing

- Use Playwright for end-to-end tests.
- Test critical user flows:
  - Product search and navigation.
  - Product comparison.
  - Ingredient lookup.
  - Admin CRUD operations.
- Run E2E tests in CI before deployment.

## Coverage

- Minimum 80% line coverage for services and utilities.
- 100% coverage for scoring and ranking logic (critical business logic).
- Coverage reports generated in CI. Fail builds if coverage drops below threshold.

## Test Data

- Use factories or fixtures for test data creation.
- Do not use production data in tests.
- Seed scripts for integration tests should be in `database/seeds/`.
- Test data must be deterministic. No random values that could cause flaky tests.

## CI Requirements

- All tests run on every pull request.
- Lint checks run on every pull request.
- E2E tests run on the main branch and before release.
- No test should take longer than 5 seconds individually.