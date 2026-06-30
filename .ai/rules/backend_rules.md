# Backend Rules

## NestJS Conventions

- Organize code into modules. One module per domain (ProductsModule, IngredientsModule, etc.).
- Each module contains: controller, service, DTOs, and module definition.
- Use dependency injection throughout. No manual instantiation of services.
- Use guards for authentication/authorization, not middleware where guards are sufficient.
- Use interceptors for cross-cutting concerns (logging, response transformation).
- Use pipes for request validation and transformation.

## API Design

- RESTful endpoints following standard conventions.
- Resource naming: plural nouns (`/products`, `/ingredients`, `/comparisons`).
- Use proper HTTP methods: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (delete).
- Return consistent response envelope: `{ data, meta }` for collections, `{ data }` for single resources.
- Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 409, 422, 500).
- Paginate all list endpoints: `?page=1&limit=20` with `Link` header.
- Filter with query parameters: `?brand=acme&category=dry-food`.

## Validation

- Validate all incoming DTOs with class-validator decorators.
- Reject invalid requests with 422 status and descriptive error messages.
- Never trust client input, even for authenticated users.
- Sanitize string inputs to prevent injection attacks.

## Error Handling

- Use NestJS built-in exceptions (`NotFoundException`, `BadRequestException`, etc.).
- Implement a global exception filter for consistent error response format.
- Log all errors with structured logging (include request ID, path, method, status).
- Never expose stack traces or internal details in API responses.

## Performance

- Use caching (Redis or in-memory) for expensive or frequent queries.
- Implement rate limiting on all public endpoints.
- Use response compression (gzip/brotli).
- Keep controller methods thin — delegate to services.
- Use lazy loading for modules that are not always needed.

## Security

- All admin endpoints require authentication via Supabase service role key.
- Public endpoints are rate-limited and validated.
- Never expose the service role key to the client.
- Use CORS with explicit allowed origins.
- Set appropriate security headers (Helmet middleware).