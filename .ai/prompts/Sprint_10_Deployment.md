# Sprint 10 — Deployment

> _Placeholder sprint spec._

## Goals

- Wire CI/CD in `.github/workflows/`.
- Configure Vercel projects for `apps/web` and `apps/admin`.
- Configure runtime for `apps/api` (chosen: container platform).
- Manage secrets + environment promotion (dev → staging → prod).
- Add observability: logs, metrics, traces.

## Acceptance Criteria

- Merging to `main` deploys `apps/web` and `apps/admin`.
- `apps/api` deploys via release pipeline to staging.
- All secrets sourced from a managed secret store.
- Dashboards + alerts defined for SLOs.

---

_See also: `../rules/security_rules.md`, `../context/architecture.md`._
