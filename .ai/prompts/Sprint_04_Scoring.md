# Sprint 04 — Scoring & Ranking Engine

## Objective

Implement the product scoring and ranking system that assigns quality scores to pet food products based on ingredient quality, nutritional adequacy, and safety profile.

## Prerequisites

- Sprint 01 completed (database schema with scoring tables and functions).
- Sprint 02 completed (API endpoints for products and scores).

## Scope

### Scoring Algorithm
- Define scoring dimensions:
  - **Ingredient Quality** (40%): Quality tier of each ingredient, presence of fillers, artificial additives.
  - **Nutritional Adequacy** (30%): Compliance with AAFCO standards, macronutrient balance.
  - **Safety Profile** (20%): Recall history, controversial ingredient presence, allergen flags.
  - **Transparency** (10%): Ingredient sourcing clarity, labeling completeness.
- Implement scoring logic in PostgreSQL functions (database layer).
- Create scoring criteria configuration table for tunable weights.

### Score Computation
- Trigger score computation on product create/update.
- Batch score recomputation for all products (admin endpoint).
- Score versioning to track changes over time.

### Ranking
- Rank products within categories by overall score.
- Rank products within brands.
- "Top products" queries for category landing pages.

### Score Display
- Overall score with letter grade (A, B, C, D, F).
- Dimension scores shown as radar/bar chart.
- Score explanation (what contributed to the score).

### Admin Score Management
- View all product scores in admin dashboard.
- Manually trigger score recomputation.
- Adjust scoring weights and thresholds.

## Completion Criteria
- Every product has a computed score across all dimensions.
- Scores update when product data changes.
- Score display is accurate and visually clear.
- Admin can view and manage scores.
- Scoring algorithm is documented and adjustable.