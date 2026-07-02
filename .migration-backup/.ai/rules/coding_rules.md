# Coding Rules

> _Placeholder — to be elaborated per-sprint._

## General

1. **All code is written in TypeScript** with `strict: true`.
2. **No `any`** unless explicitly justified with a comment.
3. **No comments** explaining *what* the code does. Comments explain *why*.
4. **No dead code, no commented-out code**, no TODOs left in the tree without a tracking ticket.
5. **Functions are small**, single-responsibility, and pure where possible.
6. **Naming is unambiguous.** No abbreviations except domain-standard ones.

## Imports

- Use **absolute imports** within an app/package, defined in `tsconfig.json` paths.
- Order: external → internal → relative.
- Never reach across app/package boundaries without going through a published `packages/*` entry point.

## Errors

- Errors are **typed**, not strings.
- Public APIs return discriminated union result types where appropriate.
- Logging includes request/sprint context.

## Git

- Branch naming: `feat/`, `fix/`, `chore/`, `docs/`.
- Commit messages follow Conventional Commits.
- PRs require at least one reviewer.

## Forbidden

- `console.log` left in production code.
- Copy-pasting from tutorials without understanding.
- Generated fake data in production code paths.

---

_See also: `frontend_rules.md`, `backend_rules.md`, `database_rules.md`._
