# Sprint 01 — Database Schema & Migrations

## Objective

Design and implement the complete PostgreSQL database schema for Tuskrank. This sprint establishes the data foundation that all application features will build upon.

## Prerequisites

- Sprint 00 completed.
- Supabase project created and configured.
- Database connection string available in environment.

## Scope

### Schema Design
- Design all core tables with proper relationships, constraints, and indexes.
- Tables: products, product_ingredients, product_nutrition, product_variants, ingredients, ingredient_synonyms, product_scores, scoring_criteria, product_analyses, ingredient_analyses, brands, categories, recalls.

### Migrations
- Create versioned migration files in `database/migrations/`.
- Each migration provides both `up` and `down` transitions.
- Migrations are idempotent where possible.

### Views
- Create database views for common read queries in `database/views/`.
- Product list view with scores.
- Ingredient usage view.
- Comparison query view.

### Functions
- Implement scoring functions in `database/functions/`.
- Product quality scoring algorithm.
- Ingredient quality assessment.
- Ranking computation.

### Seeds
- Create development seed data in `database/seeds/`.
- Sample brands, products, ingredients for local testing.
- Enough data to support search and comparison development.

## Completion Criteria
- All migrations run successfully on a fresh Supabase database.
- All views return expected data with seed data loaded.
- Scoring functions compute correct scores for test products.
- Seed data provides a realistic testing foundation.
- Schema is documented in `.ai/context/database.md`.