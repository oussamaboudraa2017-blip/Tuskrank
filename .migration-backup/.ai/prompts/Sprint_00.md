# Sprint 0 — Repository Initialization

> **Status:** Executed (initialization only).
> **Goal:** Create the project foundation. **No application code.**

---

## Objectives

- Create the full directory tree for the monorepo.
- Create root configuration files (README, LICENSE, .gitignore, .editorconfig, .prettierrc, .eslintrc, .env.example, docker-compose.yml).
- Create placeholder documents under `.ai/context/`, `.ai/rules/`, `.ai/prompts/`, `.ai/system/`.
- Create `.ai/reviews/` and `.ai/outputs/` with `.gitkeep`.
- Create `.github/workflows/` directory.
- Create top-level status documents: `PROJECT_STATE.md`, `CHANGELOG.md`, `TODO.md`.

## Explicit Non-Goals

- Do **NOT** build the frontend.
- Do **NOT** build the backend.
- Do **NOT** build the database.
- Do **NOT** write business logic.
- Do **NOT** create fake data.

## Deliverables

### Directory Structure

```
.ai/
  context/
  rules/
  prompts/
  system/
  reviews/
  outputs/
apps/
  web/
  api/
  admin/
packages/
  ui/
  types/
  utils/
  config/
database/
  migrations/
  schema/
  seeds/
  views/
  functions/
docs/
scripts/
tests/
.github/
  workflows/
```

### Root Files

- `README.md`
- `LICENSE`
- `.gitignore`
- `.editorconfig`
- `.prettierrc`
- `.eslintrc`
- `.env.example`
- `docker-compose.yml`

### AI Engineering OS Files

Context: `vision.md`, `mission.md`, `product.md`, `architecture.md`, `database.md`, `seo.md`, `roadmap.md`.

Rules: `coding_rules.md`, `database_rules.md`, `backend_rules.md`, `frontend_rules.md`, `seo_rules.md`, `security_rules.md`, `testing_rules.md`.

Prompts: `Sprint_00.md` through `Sprint_10_Deployment.md`.

System: `system_prompt.md`, `engineering_principles.md`.

### Status Files

- `PROJECT_STATE.md`
- `CHANGELOG.md`
- `TODO.md`

## Definition of Done

- [x] All directories exist.
- [x] All listed files exist with valid placeholder content.
- [x] No application code is present.
- [x] No fake data is present.
- [x] `PROJECT_STATE.md` reflects Sprint 0 completion.
- [x] `CHANGELOG.md` records Sprint 0 entry.
- [x] `TODO.md` lists the next sprints.

---

> After Sprint 0, **stop**. Do not proceed to Sprint 1.
