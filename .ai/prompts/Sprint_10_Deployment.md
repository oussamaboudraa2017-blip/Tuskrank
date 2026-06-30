# Sprint 10 — Deployment & Launch

## Objective

Configure production deployment, finalize CI/CD pipelines, and prepare for the public launch of Tuskrank.

## Prerequisites

- Sprint 09 completed (all tests passing).
- Vercel account configured.
- Supabase production project configured.

## Scope

### Vercel Deployment
- Configure `vercel.json` for apps/web and apps/admin.
- Set up environment variables in Vercel dashboard.
- Configure custom domain (tuskrank.com).
- Set up Edge functions if needed.

### CI/CD Pipeline
- GitHub Actions workflow for:
  - Lint check on all pull requests.
  - Unit and integration tests on all pull requests.
  - E2E tests on merge to main.
  - Automatic deployment to staging on merge to main.
  - Manual promotion to production.
- Branch protection rules on main.

### Production Database
- Run all migrations on production Supabase.
- Load production seed data (brands, categories, ingredient reference data).
- Verify database functions and views.
- Configure connection pooling.

### Production API
- Deploy NestJS API.
- Configure production environment variables.
- Verify API health and connectivity.
- Set up monitoring and alerting.

### Monitoring & Observability
- Set up error tracking (Sentry).
- Set up analytics (Google Analytics).
- Configure uptime monitoring.
- Set up log aggregation.

### Launch Checklist
- All environment variables set in production.
- All migrations applied.
- DNS configured and propagating.
- SSL certificate active.
- Security headers verified.
- Performance benchmarks met.
- SEO metadata verified on key pages.
- Error tracking confirmed working.
- Analytics confirmed firing.
- Legal pages (Privacy Policy, Terms of Service) published.

## Completion Criteria
- Application is live at tuskrank.com.
- All pages load correctly in production.
- CI/CD pipeline is fully operational.
- Monitoring and alerting are active.
- Launch checklist is complete with all items verified.