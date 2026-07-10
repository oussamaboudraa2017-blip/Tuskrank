# Tuskrank

> **Pet Food Search & Intelligence Platform**

Tuskrank is a production-grade SaaS designed to help millions of US pet owners make informed decisions about pet food and ingredients through intelligent search, comparison, analysis, and AI-powered explanations.

---

## Vision

Empower every pet owner in the US with transparent, intelligent, and trustworthy pet food intelligence.

---

## Core Capabilities

- Search pet food products
- Search ingredients
- Compare products side-by-side
- Analyze ingredient quality
- Discover healthier alternatives
- Read AI-powered explanations

---

## Tech Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- NestJS

### Data & Infrastructure
- PostgreSQL
- Supabase (Auth, Storage, Realtime)
- Vercel (Deployment)

---

## Monorepo Structure

```
.
├── .ai/             # AI engineering OS (context, rules, prompts, system, reviews, outputs)
├── apps/
│   ├── web/         # Public-facing Next.js application
│   ├── api/         # NestJS backend API
│   └── admin/       # Internal admin console
├── packages/
│   ├── ui/          # Shared design system (shadcn/ui)
│   ├── types/       # Shared TypeScript types
│   ├── utils/       # Shared utility functions
│   └── config/      # Shared configuration (eslint, tsconfig, tailwind)
├── database/
│   ├── migrations/  # SQL migrations
│   ├── schema/      # Canonical schema definitions
│   ├── seeds/       # Seed data scripts
│   ├── views/       # Database views
│   └── functions/   # Stored procedures / RPC functions
├── docs/            # Project documentation
├── scripts/         # DevOps and automation scripts
├── tests/           # End-to-end and integration tests
└── .github/
    └── workflows/   # CI/CD pipelines
```

---

## Engineering Operating System

This repository uses a structured AI engineering OS located in `.ai/`. The OS consists of:

- `.ai/context/` — Strategic context (vision, mission, product, architecture, SEO, roadmap)
- `.ai/rules/` — Engineering rules and conventions
- `.ai/prompts/` — Sprint execution prompts
- `.ai/system/` — System instructions and engineering principles
- `.ai/reviews/` — Review outputs
- `.ai/outputs/` — Generated artifacts

Engineering work is executed in **Sprints**. See `.ai/prompts/Sprint_00.md` for the current initialization sprint.

---

## Getting Started

> **Sprint 0 status:** Repository skeleton only. Application code is intentionally not yet implemented.

The next sprints will introduce:

1. Database schema and migrations
2. NestJS backend API
3. Search and scoring engines
4. Next.js frontend
5. Admin console
6. AI explanations
7. SEO infrastructure
8. Testing and deployment

Refer to `PROJECT_STATE.md`, `TODO.md`, and `CHANGELOG.md` for current progress.

---

## License

Proprietary — see `LICENSE`.
