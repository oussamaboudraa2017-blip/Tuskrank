# Sprint 06 — Admin Dashboard

## Objective

Build the internal admin dashboard for managing products, ingredients, and data quality in the Tuskrank platform.

## Prerequisites

- Sprint 02 completed (backend API with admin endpoints).
- Sprint 04 completed (scoring system).
- Supabase Auth configured with admin user.

## Scope

### Admin Authentication
- Login page using Supabase Auth.
- Admin role verification.
- Protected routes (redirect to login if not authenticated).

### Product Management
- Product list with search, filter, and pagination.
- Product create/edit form.
- Ingredient assignment for products.
- Nutrition data entry.
- Image upload (Supabase Storage).
- Bulk import from CSV/JSON.
- Bulk export to CSV.

### Ingredient Management
- Ingredient list with search and filter.
- Ingredient create/edit form.
- Synonym management.
- Safety tier assignment.
- Category management.

### Data Quality
- Products missing data (incomplete profiles).
- Products needing score recomputation.
- Ingredient coverage gaps.
- Data import history and status.

### Brand & Category Management
- Brand CRUD.
- Category hierarchy management.

## Completion Criteria
- Admin can log in and access the dashboard.
- Full CRUD operations work for products and ingredients.
- Bulk import/export works with CSV files.
- Data quality dashboard surfaces actionable items.
- Admin routes are properly protected.