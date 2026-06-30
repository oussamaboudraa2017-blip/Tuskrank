# Sprint 02 — Backend API Foundation

## Objective

Bootstrap the NestJS backend application and implement the core API endpoints for products, ingredients, and comparisons.

## Prerequisites

- Sprint 01 completed.
- Database schema and seed data available.
- NestJS project initialized in `apps/api/`.

## Scope

### NestJS Bootstrap
- Initialize NestJS application with TypeScript configuration.
- Configure Supabase client integration.
- Set up module structure (ProductsModule, IngredientsModule, ComparisonsModule).
- Implement global exception filter.
- Implement request validation pipe.
- Configure CORS and security headers (Helmet).

### Product Endpoints
- `GET /api/products` — List products with pagination, filtering, and sorting.
- `GET /api/products/:slug` — Get single product with full details.
- `GET /api/products/:slug/ingredients` — Get ingredients for a product.
- `GET /api/products/:slug/nutrition` — Get nutrition data for a product.
- `GET /api/products/:slug/score` — Get computed score for a product.

### Ingredient Endpoints
- `GET /api/ingredients` — List ingredients with pagination and search.
- `GET /api/ingredients/:slug` — Get single ingredient with full details.
- `GET /api/ingredients/:slug/products` — Get products containing this ingredient.

### Comparison Endpoints
- `GET /api/compare?products=slug-a,slug-b,slug-c` — Compare up to 4 products.

### Auth & Security
- Implement authentication guard using Supabase JWT.
- Implement admin role guard for protected endpoints.
- Rate limiting on all public endpoints.
- Input validation with class-validator DTOs.

### Documentation
- OpenAPI/Swagger documentation for all endpoints.
- API response examples in documentation.

## Completion Criteria
- All endpoints return correct data with proper HTTP status codes.
- Authentication and authorization work correctly.
- Input validation rejects invalid requests with 422 status.
- API is fully documented with OpenAPI/Swagger.
- Rate limiting is active on public endpoints.