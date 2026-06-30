# Sprint 09 — Testing & QA

## Objective

Implement comprehensive testing across all layers of the application to ensure reliability, correctness, and confidence before launch.

## Prerequisites

- Sprints 01-08 completed.
- All application code is feature-complete.

## Scope

### Unit Tests
- packages/utils: 100% coverage.
- packages/types: Type compilation checks.
- NestJS services (product, ingredient, scoring, comparison): > 90% coverage.
- React components (critical path): > 80% coverage.
- Database scoring functions: 100% coverage.

### Integration Tests
- API endpoint tests against test database.
- Authentication and authorization flow tests.
- Search integration tests.
- Score computation end-to-end tests.
- Data import/export tests.

### E2E Tests (Playwright)
- Homepage loads and search works.
- Product search → product detail page flow.
- Product comparison flow.
- Ingredient search → ingredient detail page flow.
- Admin login and CRUD flow.

### Performance Tests
- Load test on search API endpoint.
- Load test on product detail page.
- Verify response time SLAs.

### Accessibility Tests
- Automated a11y checks (axe-core) on all pages.
- Manual keyboard navigation test.
- Screen reader compatibility check.

## Completion Criteria
- All unit tests pass.
- All integration tests pass.
- All E2E tests pass.
- Coverage thresholds met for all packages.
- No critical or high-severity bugs remain.
- Accessibility audit passes with zero violations.