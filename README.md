# Tuskrank

**Pet Food Search & Intelligence Platform**

Tuskrank helps pet owners in the US market search, compare, and analyze pet food products to make healthier choices for their pets. Powered by AI-driven ingredient analysis and comprehensive product intelligence.

## Overview

- **Search** pet food products across brands and categories
- **Compare** products side-by-side on nutrition, ingredients, and safety
- **Analyze** ingredients with AI-powered explanations and risk assessments
- **Discover** healthier alternatives tailored to your pet's needs

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deployment | Vercel |

## Project Structure

```
/ .ai/                  # AI context, rules, prompts, and system docs
/ apps/                 # Application packages (web, api, admin)
/ packages/             # Shared packages (ui, types, utils, config)
/ database/             # Database migrations, schema, seeds, views, functions
/ docs/                 # Project documentation
/ scripts/              # Utility and automation scripts
/ tests/                # Integration and e2e tests
/ .github/workflows/    # CI/CD pipelines
```

## Getting Started

> **Note:** This repository is currently in Sprint 0 (Initialization). No application code has been written yet.

See `TODO.md` for the current sprint status and next steps.

## License

MIT