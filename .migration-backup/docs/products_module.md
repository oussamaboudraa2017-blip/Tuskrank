# Products Module — Sprint 2B Task 1

> **Status:** Skeleton. No business logic, no CRUD endpoints, no database I/O. Sprint 2B Task 2 will populate the methods.
>
> **Location:** `apps/api/src/modules/products/`
>
> **Schema source of truth:** `database/schema.sql` (Sprint 1.x)
>
> **Endpoint catalogue:** `docs/API_ROADMAP.md` § 3
>
> **Earlier review:** `docs/SPRINT_2A_AUDIT.md` (92 / 100)

---

## 1. Folder Structure

```
modules/products/
├── dto/                              # Wire / contract DTOs
│   ├── brand-summary.dto.ts
│   ├── product-score-summary.dto.ts
│   ├── product-list-item.dto.ts
│   ├── product-detail.dto.ts
│   ├── product-ingredients.dto.ts
│   ├── products-page.dto.ts
│   └── index.ts
├── entities/                         # Internal row shapes (mirror schema)
│   ├── brand.entity.ts
│   ├── food-form.entity.ts
│   ├── nutrition-profile.entity.ts
│   ├── product-ingredient.entity.ts
│   ├── product-image.entity.ts
│   ├── product.entity.ts
│   └── index.ts
├── interfaces/                       # Filter / param / sort contracts
│   ├── list-products.filters.ts
│   ├── list-products.params.ts
│   ├── list-products.sort.ts
│   └── index.ts
├── repositories/                     # extends BaseRepository<T>; no queries yet
│   ├── brands.repository.ts
│   ├── products.repository.ts
│   └── index.ts
├── mappers/                          # Entity ↔ DTO (pure functions; no I/O)
│   ├── brand.mapper.ts
│   ├── product-list.mapper.ts
│   └── index.ts
├── products.controller.ts            # Controller scaffold
├── products.service.ts               # Service stub
├── products.module.ts                # @Module composition
└── index.ts                          # Barrel exports
```

### Schema-to-code mirror

| Schema table | Entity | Repository | DTO |
| --- | --- | --- | --- |
| `brands` | `brand.entity.ts` | `BrandsRepository` | `BrandSummaryDto` |
| `products` | `product.entity.ts` | `ProductsRepository` | `ProductListItemDto`, `ProductDetailDto` |
| `product_images` | `product-image.entity.ts` | `ProductImagesRepository` | `ProductImageDto` (part of detail) |
| `nutrition_profiles` | `nutrition-profile.entity.ts` | `NutritionProfilesRepository` | `ProductNutritionProfileDto` (part of detail) |
| `product_ingredients` | `product-ingredient.entity.ts` | `ProductIngredientsRepository` | `ProductIngredientListItemDto`, `ProductIngredientsPanelDto` |
| `food_forms` | `food-form.entity.ts` | (lookup only) | (slugs embedded in product DTOs) |
| `protein_sources` | `food-form.entity.ts` | (lookup only) | (slugs embedded in product DTOs) |
| `product_scores` (view) | `ProductScoreView` interface | (no repo) | `ProductScoreSummaryDto` |
| `product_tags` / `tags` | (future) | (future) | `ProductTagDto` (already declared) |
| `product_claims` / `claims` | (future) | (future) | `ProductClaimDto` (already declared) |

---

## 2. Folder Responsibilities

### `entities/`
**Internal row types.** Every entity is `readonly` (immutable), UUID-based, and mirrors a row in `database/schema.sql`. Entities are not exposed on the wire and never carry sensitive columns they don't need.

### `interfaces/`
**Cross-DTO contracts.** Filter / sort / param shapes that are *not* tied to a single DTO. Controllers compose DTOs from interfaces; services consume the composed `ListProductsParams`. Interfaces stay tiny and free of validation decorators (those belong on DTOs).

### `dto/`
**Wire shapes.** Every field carries `@ApiProperty`. No business logic. No `readonly`. No I/O. Class-based DTOs are the canonical NestJS / Swagger shape; functional shapes (the `ProductScoreView` interface) are internal-only and never exported on the wire.

### `repositories/`
**SQL boundary.** Extend `BaseRepository<T>` from `apps/api/src/database/base.repository.ts`. Each repository owns exactly one table (`tableName`). All `$1`-bound parameters go through `this.query(...)`. No template-interpolation of identifiers — `validateTableName(name)` is the only legitimate path.

### `mappers/`
**Pure entity ↔ DTO converters.** No I/O, no logging, no side effects. Mappers are the *only* place that knows the wire shape's structure. Service and controller call mappers; mappers call nothing.

### `products.service.ts`
**Orchestration layer.** Composes one or more repositories inside a transaction. Validates cross-row invariants. Emits audit events. The service is the *only* layer allowed to inject repositories. Controllers must NOT inject repositories.

### `products.controller.ts`
**HTTP boundary.** Mounts on `path: 'products', version: '1'`. Only this file carries `@Controller` / `@Get` / `@Post` decorators. Each route is a one-liner that delegates to the service.

### `products.module.ts`
**DI graph.** Composes `DatabaseModule` (provider of `pg.Pool`) + `CommonModule` (filter / guards / interceptors / `pino` logger) + the local service / controllers / repositories. The module exports only the service so other modules can consume Products' business capabilities in Sprint 2B+.

### `index.ts`
**Barrel exports.** Allows `app.module.ts` to import the module with a single line: `import { ProductsModule } from '@modules/products'`.

---

## 3. Responsibilities by File

| File | Single Responsibility |
| --- | --- |
| `dto/brand-summary.dto.ts` | Wire shape of a brand in product responses. |
| `dto/product-score-summary.dto.ts` | Score summary wire shape + internal `ProductScoreView` (entity-side). |
| `dto/product-list-item.dto.ts` | List row shape for `GET /api/v1/products`. |
| `dto/product-detail.dto.ts` | Detail shape (and the smaller shapes it composes: image, tag, claim, nutrition). |
| `dto/product-ingredients.dto.ts` | Panel shape for `GET /api/v1/products/:slug/ingredients`. |
| `dto/products-page.dto.ts` | Pagination wrapper for the list endpoint. |
| `entities/brand.entity.ts` | Mirror of `brands` table row. |
| `entities/food-form.entity.ts` | Mirrors `food_forms` and `protein_sources` (small lookup tables grouped). |
| `entities/nutrition-profile.entity.ts` | Mirror of `nutrition_profiles`. |
| `entities/product-ingredient.entity.ts` | Mirror of `product_ingredients` + `IngredientReference` (loose). |
| `entities/product-image.entity.ts` | Mirror of `product_images`. |
| `entities/product.entity.ts` | Mirror of `products` (with optional joined entities for `brand`, `foodForm`, `primaryProteinSource`). |
| `interfaces/list-products.filters.ts` | All filter shapes + pet/food/life-stage/breed/origin enums. |
| `interfaces/list-products.params.ts` | Composite `ListProductsParams` (filters + sort + pagination). |
| `interfaces/list-products.sort.ts` | `ProductSortField` / `ProductSortOrder` literal types. |
| `repositories/brands.repository.ts` | `BrandsRepository extends BaseRepository<BrandEntity>`. |
| `repositories/products.repository.ts` | `ProductsRepository` + `ProductImagesRepository` + `NutritionProfilesRepository` + `ProductIngredientsRepository` (all extend `BaseRepository<T>`). |
| `mappers/brand.mapper.ts` | `brandEntityToSummaryDto`. |
| `mappers/product-list.mapper.ts` | `productEntityToListItemDto` + `productScoreSummaryFromView`. |
| `products.service.ts` | `ProductsService` (constructor injection, no methods yet). |
| `products.controller.ts` | `ProductsController` (route-less, Swagger-tagged). |
| `products.module.ts` | `ProductsModule` (DI graph). |
| `index.ts` | Barrel exports. |

---

## 4. Future Endpoints (Sprint 2B Task 2+)

The full surface area — sourced from `docs/API_ROADMAP.md` § 3.

| Method | URL | Auth | Description |
| --- | --- | --- | --- |
| `GET`    | `/api/v1/products`                                   | No   | List products (paginated, many filters). |
| `GET`    | `/api/v1/products/:slug`                             | No   | Product detail (brand, ingredients, score, alternatives). |
| `GET`    | `/api/v1/products/:slug/ingredients`                 | No   | Ordered ingredient panel. |
| `GET`    | `/api/v1/products/:slug/nutrition`                   | No   | Current nutrition profile snapshot. |
| `GET`    | `/api/v1/products/:slug/images`                      | No   | Image gallery. |
| `GET`    | `/api/v1/products/:slug/tags`                        | No   | Tags applied. |
| `GET`    | `/api/v1/products/:slug/claims`                      | No   | Marketing claims. |
| `GET`    | `/api/v1/products/:slug/score-history`               | No   | Score history (per scoring version). |
| `GET`    | `/api/v1/products/:slug/related`                     | No   | Same-brand / variant / similar. |
| `GET`    | `/api/v1/products/:slug/sources`                     | No   | Scientific citations (Sprint 4). |
| `POST`   | `/api/v1/products`                                   | Yes (admin) | Create. |
| `PATCH`  | `/api/v1/products/:productId`                        | Yes (admin) | Update. |
| `POST`   | `/api/v1/products/:productId/publish`                | Yes (admin) | Publish. |
| `POST`   | `/api/v1/products/:productId/unpublish`              | Yes (admin) | Unpublish. |
| `POST`   | `/api/v1/products/:productId/soft-delete`            | Yes (admin) | Soft-delete. |
| `POST`   | `/api/v1/products/:productId/restore`                 | Yes (admin) | Restore. |

### Read endpoints — Phase 1 (Sprint 2B Task 2)

The first sprint-side task is to wire **read-only** endpoints. These are the
priority because they are public (no admin auth) and the schema is already
populated with the seed data shapes from `database/seed.sql`.

| Endpoint | Repository | Mapper |
| --- | --- | --- |
| `GET /products`               | `ProductsRepository.list`     | `product-list.mapper` |
| `GET /products/:slug`         | `ProductsRepository.findBySlug` + child repos | full-detail mapper (Sprint 2B) |
| `GET /products/:slug/ingredients` | `ProductIngredientsRepository.listByProduct` | `product-ingredients.dto` |
| `GET /products/:slug/nutrition`   | `NutritionProfilesRepository.findCurrentByProduct` | detail mapper |
| `GET /products/:slug/images`      | `ProductImagesRepository.listByProduct`         | detail mapper |
| `GET /products/:slug/tags`        | (future) `ProductTagsRepository`                | detail mapper |
| `GET /products/:slug/claims`      | (future) `ProductClaimsRepository`              | detail mapper |

### Write endpoints — Phase 2 (Sprint 2B Task 3)

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `POST /products`                | admin | Insert with `RETURNING *`; relies on `(brand_id, slug)` UNIQUE for 409. |
| `PATCH /products/:id`           | admin | Partial update; preserves slug and UPC immutability. |
| `POST /products/:id/publish`    | admin | Atomic transition; sets `published_at = now()`. |
| `POST /products/:id/unpublish`  | admin | Sets `published_at = null`. |
| `POST /products/:id/soft-delete`| admin | Sets `deleted_at = now()`. |
| `POST /products/:id/restore`     | admin | Sets `deleted_at = null`. |

---

## 5. Dependencies

### 5.1 Internal (this repo)

| Dependency | Why | Imported as |
| --- | --- | --- |
| `AppConfigModule` | `ConfigService` for env-driven behaviour (rare in module). | `@config` |
| `CommonModule` | Global exception filter, `SupabaseAuthGuard`, `ThrottlerGuard`, request-id middleware, interceptors, `okResponse()` / `paginatedResponse()` envelope helpers, `ApiError` hierarchy, decorators. | `@common` |
| `DatabaseModule` | `DatabaseService` (pg.Pool owner), `TransactionHelper`, `BaseRepository<T>`. | `@database` |
| `pino-pretty` (dev) | Log redaction baseline already configured in `common/logger/logger.config.ts`. | transitive via `CommonModule` |
| `nestjs-pino` logger | All log lines from this module flow through `PinoLogger`. | transitive via `CommonModule` |

### 5.2 External (npm)

| Package | Why |
| --- | --- |
| `@nestjs/common` | Module / Controller / Injectable / ApiProperty / etc. |
| `@nestjs/swagger` | `@ApiProperty`, `@ApiTags` (Swagger surface). |
| `class-validator` / `class-transformer` | DTO validation at the controller boundary (Sprint 2B Task 2). |
| `pg` | `pg.Pool` row types via `BaseRepository<T extends QueryResultRow>`. |
| `uuid` | `Uuid` branded type (declared in `common/types/uuid.type.ts`). |

### 5.3 Module dependency graph (Sprint 2B Task 1)

```
AppModule
└── ProductsModule
    ├── DatabaseModule         (provides BaseRepository, DatabaseService, TransactionHelper)
    ├── CommonModule           (provides SupabaseAuthGuard, envelope helpers, exception filter)
    └── controllers
        └── ProductsController
            └── ProductsService
                ├── ProductsRepository
                ├── ProductImagesRepository
                ├── NutritionProfilesRepository
                ├── ProductIngredientsRepository
                └── BrandsRepository
```

Notes:
- `ProductsModule` does **not** import `AuthModule` or `HealthModule` (different concerns, both reachable through the global guard via `CommonModule`).
- `ProductsModule` does **not** import the future `IngredientsModule` (FK target). The dependency direction reverses in Sprint 3.
- Repositories are siblings of the service, not children — each is registered in the module's `providers` and injected into the service.

---

## 6. How to Extend (Sprint 2B Task 2)

1. **Add the admin auth flow.** `ProductController` already benefits from the global `SupabaseAuthGuard`. Per-route role enforcement is opt-in via `@Roles(UserRole.Admin) @UseGuards(RolesGuard)` on each write method. The `@Roles` and `@Public` decorators already exist in `@common/decorators`.

2. **Add the query DTO.** Add `dto/list-products.query.dto.ts` extending `PaginationQueryDto` (`@common/dto/pagination.dto.ts`) with `@IsString() @IsOptional() q`, `@IsUUID() @IsOptional() brandId`, etc. Decorate with `@ApiProperty` for Swagger.

3. **Add the read service method.** `ProductsService.list(input: ListProductsParams)`:
   - Validates `params.filters.minScore <= params.filters.maxScore` (the DTO already enforces this, but the service double-checks).
   - Calls `this.products.list(input)` and `this.products.count(input)` in parallel.
   - Returns `{ items: ProductEntity[]; total: number }` to the controller.

4. **Add the repository method.** `ProductsRepository.list(input)`:
   - Builds the WHERE clause from filters.
   - Uses `$1`-bound parameters only.
   - Joins `brands`, `food_forms`, `protein_sources`, `v_top_rated_products` (for the score aggregate).
   - Returns the raw rows; the service hands them to the mapper.

5. **Add the controller method.** One `@Get()` decorated method, validates via the query DTO, calls the service, returns `paginatedResponse(...)`.

6. **Add the unit + e2e spec.** The same e2e harness used for `auth/me` (see `apps/api/test/app.e2e-spec.ts`) works for any new product endpoint. Coverage on `product-list.mapper` and the new repository method is mandatory.

---

## 7. Decisions Captured Here

These are decisions specific to the Products module and not yet
in `docs/DECISIONS.md`. (Sprint 2B will fold them into the central
ADR log.)

| Decision | Choice | Why |
| --- | --- | --- |
| D-001: DTO vs Entity placement | Entities are module-internal (not exported from the module index). DTOs are the only wire shape. | Mirrors the Auth and Health modules; entities are an implementation detail. |
| D-002: One repository per table | `ProductsRepository`, `ProductImagesRepository`, `NutritionProfilesRepository`, `ProductIngredientsRepository`, `BrandsRepository`. | Mirrors the schema 1:1; future transactions compose multiple repositories in one service method. |
| D-003: Mappers as pure functions | No classes, no I/O. `brandEntityToSummaryDto(brand)`, `productEntityToListItemDto({ product, score })`. | Mappers are deterministic; trivially unit-testable. |
| D-004: Service is the only repository consumer | Controllers must NOT inject repositories. | Keeps transactions scoped to a single use case. |
| D-005: `ProductScoreView` lives in DTO folder | It is a *projection* of `v_top_rated_products` and a *contract input* for the list mapper. | Avoids an "internal" folder that would duplicate `dto/`. |
| D-006: No DTOs in this skeleton for mutation | Admin endpoints land in Sprint 2B Task 3 alongside input-validation rules. | Keeps the skeleton focused on the read path; mutation DTOs deserve their own design pass. |

---

## 8. What This Skeleton Does NOT Do (Sprint 2B Task 1 scope)

- ❌ No queries against the database.
- ❌ No business logic in the service.
- ❌ No route handlers in the controller.
- ❌ No DTOs for admin write operations.
- ❌ No unit / e2e specs.
- ❌ No `mappers/product-detail.mapper.ts` (skeleton declares `ProductDetailDto` shape; full mapper is built when the detail endpoint lands).
- ❌ No `repository.ingredients.repository.ts` (moved to future Ingredients module).
- ❌ No `ProductTagsRepository` / `ProductClaimsRepository` (tags / claims are normalized 3NF tables; Sprint 2B will own those repositories too, see `database/schema.sql`).
- ❌ No `audit_log` writes yet — wired through the future `fn_write_audit` Postgres helper.

---

## 9. Quick Reference

### Path aliases

| Alias | Resolves to | Used in |
| --- | --- | --- |
| `@common` | `src/common/` | DTOs / errors / filters / guards / interceptors / logger / middleware / pipes / swagger / throttler. |
| `@config`  | `src/config/`  | `ConfigService`, `AppConfig`. |
| `@database` | `src/database/` | `BaseRepository`, `DatabaseService`, `TransactionHelper`. |
| `@modules/...` | `src/modules/...` | Sibling domain modules (this file is in `src/modules/products/`). |
| `@auth` | `src/modules/auth/` | (Future) import only. |
| `@health` | `src/modules/health/` | (Future) import only. |
| `@shared` | `src/shared/` | Reserved — empty in Sprint 2B. |
| `@utils`  | `src/utils/`  | Reserved — empty in Sprint 2B. |
| `@types`  | `src/types/`  | `Uuid`, `Iso8601`, `HttpUrl`, `Json` branded primitives. |

### Code standards (from `docs/BACKEND_ARCHITECTURE.md`)

- Strict TypeScript: `noImplicitAny`, `strictNullChecks`, `useUnknownInCatchVariables`.
- `eqeqeq: ['error', 'always']` — no `==` anywhere.
- `prefer-const` for immutable bindings; entities are `readonly`.
- No `console.log` in source — `PinoLogger` only.
- Single-quote strings (`'foo'`), trailing commas (`all`), 100-col line wrap.
- `class-validator` decorators on DTOs, not on interfaces or entities.
- `Prettier` formatting; `eslint --fix` is the formatter-of-record.

---

> **End of skeleton documentation. Sprint 2B Task 1 complete.**
