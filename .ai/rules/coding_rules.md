# Coding Rules

## General

- All code must be written in TypeScript. No plain JavaScript files.
- Use strict mode (`"strict": true` in tsconfig.json).
- Prefer `const` over `let`. Never use `var`.
- Use arrow functions for callbacks; function declarations for named exports.
- No `any` type unless absolutely necessary — use `unknown` and narrow with type guards.
- Use template literals over string concatenation.
- Destructure objects and arrays when accessing multiple properties.
- Prefer `async/await` over raw Promise chains.
- Use early returns to reduce nesting.
- Maximum function length: 50 lines. If longer, refactor.

## Naming Conventions

- Files: `kebab-case.ts` (e.g., `product-service.ts`).
- Components: `PascalCase.tsx` (e.g., `ProductCard.tsx`).
- Variables and functions: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE`.
- Types and interfaces: `PascalCase` with no prefix (e.g., `Product`, not `IProduct` or `TProduct`).
- Database columns: `snake_case`.
- Environment variables: `SCREAMING_SNAKE_CASE`.

## Imports

- Absolute imports only (configured via tsconfig paths).
- Group imports: (1) external packages, (2) internal packages, (3) relative imports.
- Blank line between each group.
- No circular dependencies.

## Error Handling

- Never swallow errors silently.
- Use custom error classes for domain-specific errors.
- All API endpoints must return structured error responses.
- Use try/catch at the boundary (controllers, Server Actions), not deep in business logic.

## Comments

- Write self-documenting code first. Comments explain "why", not "what".
- Use JSDoc for public API functions.
- Use `// TODO:` for pending work with a ticket reference if available.

## Formatting

- Run Prettier before committing. Configuration in `.prettierrc`.
- Run ESLint before committing. Configuration in `.eslintrc`.
- Maximum line length: 100 characters.