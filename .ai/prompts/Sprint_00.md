# Sprint 00 — Repository Initialization

## Objective

Create the complete project foundation for Tuskrank. No application code is written in this sprint. This sprint establishes the monorepo structure, configuration files, and AI engineering documentation that will guide all subsequent development.

## Scope

### Directory Structure
Create the full monorepo directory tree:
- `.ai/` — AI context, rules, prompts, system docs
- `apps/` — web (Next.js), api (NestJS), admin (Next.js)
- `packages/` — ui, types, utils, config
- `database/` — migrations, schema, seeds, views, functions
- `docs/`, `scripts/`, `tests/`
- `.github/workflows/`

### Configuration Files
- `README.md` — Project overview and setup instructions.
- `LICENSE` — MIT license.
- `.gitignore` — Node.js, Next.js, NestJS, IDE, OS files.
- `.editorconfig` — Consistent editor settings across team.
- `.prettierrc` — Code formatting rules.
- `.eslintrc` — Linting rules with TypeScript support.
- `.env.example` — Environment variable template.
- `docker-compose.yml` — Local development environment (PostgreSQL, API, Web).

### AI Documentation
- `.ai/context/` — vision.md, mission.md, product.md, architecture.md, database.md, seo.md, roadmap.md
- `.ai/rules/` — coding_rules.md, database_rules.md, backend_rules.md, frontend_rules.md, seo_rules.md, security_rules.md, testing_rules.md
- `.ai/system/` — system_prompt.md, engineering_principles.md

### Project Tracking
- `PROJECT_STATE.md` — Current state of the project.
- `CHANGELOG.md` — Record of all changes.
- `TODO.md` — Outstanding tasks.

## Out of Scope
- No application code.
- No database schema or migrations.
- No npm/pnpm initialization.
- No dependency installation.
- No business logic.

## Completion Criteria
- All directories exist.
- All configuration files are present with appropriate content.
- All AI documentation is written and comprehensive.
- `PROJECT_STATE.md` accurately reflects the post-sprint state.
- Repository is ready for Sprint 1.