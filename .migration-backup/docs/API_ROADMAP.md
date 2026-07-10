# Tuskrank — API Roadmap

> **Comprehensive endpoint catalogue.** Every API Tuskrank will eventually expose is documented here.
>
> **Base URL (production):** `https://api.tuskrank.com`
> **Base URL (staging):** `https://api.staging.tuskrank.com`
> **Base URL (development):** `http://localhost:4000`
>
> **Versioning:** URI versioning. Default version is `v1`. Each endpoint is namespaced under `/api/v1/...`.
>
> **Authentication:** Supabase JWT (Bearer token). Public routes opt out via `@Public()`.
>
> **Conventions:**
>
> - All responses follow the `{ success, data|error, meta }` envelope.
> - All timestamps are ISO-8601 (`Z`).
> - All ids are UUID v4.
> - All errors return a stable `code` (e.g. `VALIDATION_ERROR`, `NOT_FOUND`).
> - Pagination defaults to `page=1`, `limit=20`, `MAX_LIMIT=100`.

| Module                | Sprint  | Status       |
| --------------------- | ------- | ------------ |
| Authentication        | 2B      | Not started  |
| Products              | 2B      | Not started  |
| Brands                | 2B      | Not started  |
| Ingredients           | 3       | Not started  |
| Search                | 3       | Not started  |
| Scoring               | 4       | Not started  |
| AI Explanations       | 7       | Not started  |
| Recommendations       | 4       | Not started  |
| Comparisons           | 4       | Not started  |
| Admin                 | 6       | Not started  |
| SEO                   | 8       | Not started  |
| Analytics             | 8       | Not started  |
| Audit                 | 6       | Not started  |
| Health                | 2A      | ✅ Implemented |
| Auth (scaffold)       | 2A      | ✅ Implemented (`GET /auth/me`) |

---

## 1. Authentication (`/api/v1/auth`)

Supabase Auth integration. JWT in `Authorization: Bearer <token>` header for protected routes.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| POST   | `/api/v1/auth/signup`              | Email/password sign-up via Supabase Auth.                      | No   |
| POST   | `/api/v1/auth/login`               | Email/password sign-in, returns access/refresh JWT.              | No   |
| POST   | `/api/v1/auth/logout`              | Invalidate refresh token; clear session cookies.                | Yes  |
| POST   | `/api/v1/auth/refresh`             | Exchange refresh token for new access token.                   | No (refresh token in body) |
| POST   | `/api/v1/auth/oauth/:provider`     | OAuth callback (Google, Apple, Facebook).                       | No   |
| GET    | `/api/v1/auth/oauth/:provider/start`| 302 redirect to OAuth provider consent screen.                  | No   |
| POST   | `/api/v1/auth/password-reset/request` | Request password reset email (always 202 — no user enumeration). | No |
| POST   | `/api/v1/auth/password-reset/confirm`  | Confirm reset via emailed one-time token.                    | No   |
| POST   | `/api/v1/auth/magic-link`           | Send magic-link sign-in email.                                | No   |
| GET    | `/api/v1/auth/me`                  | Return the currently authenticated user.                       | Yes  |
| PATCH  | `/api/v1/auth/me`                  | Update profile fields (display_name, avatar_url).              | Yes  |
| DELETE | `/api/v1/auth/me`                  | Soft-delete the current account.                                | Yes  |
| GET    | `/api/v1/auth/sessions`            | List active sessions for the current user.                     | Yes  |
| DELETE | `/api/v1/auth/sessions/:sessionId` | Revoke a specific session.                                    | Yes  |

### Conventions

```jsonc
// 200 / 201 — Success envelope
{ "success": true, "data": { ... }, "meta": { "timestamp": "ISO", "traceId": "..." } }

// Error envelope
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "traceId": "..." }, "meta": { "timestamp": "ISO", "traceId": "..." } }
```

---

## 2. Brands (`/api/v1/brands`)

Brand metadata + transparency for pet-food manufacturers.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/brands`                       | List brands (paginated, filtered by `country`, `is_active`).            | No   |
| GET    | `/api/v1/brands/:slug`                 | Fetch a single brand by slug.                                            | No   |
| GET    | `/api/v1/brands/:slug/products`        | List products belonging to a brand.                                     | No   |
| GET    | `/api/v1/brands/:slug/scores`          | Aggregate scoring summary for a brand.                                  | No   |
| GET    | `/api/v1/brands/:slug/certifications`  | List certifications held by a brand.                                     | No   |
| GET    | `/api/v1/brands/:slug/transparency-reports` | Paginated transparency reports by year.                            | No   |
| GET    | `/api/v1/brands/:slug/recalls`         | Brand-scoped recall history.                                              | No   |
| POST   | `/api/v1/brands`                        | Create a brand (admin only).                                             | Yes (admin)        |
| PATCH  | `/api/v1/brands/:brandId`              | Update a brand.                                                           | Yes (admin)        |
| DELETE | `/api/v1/brands/:brandId`              | Soft-delete a brand.                                                     | Yes (admin)        |
| POST   | `/api/v1/brands/:brandId/certifications` | Attach a certification.                                              | Yes (admin)        |
| DELETE | `/api/v1/brands/:brandId/certifications/:certId` | Detach a certification.                                   | Yes (admin)        |

### Brands — Request examples

```jsonc
// GET /api/v1/brands?country=US&page=2&limit=20
// 200
{
  "success": true,
  "data": [
    {
      "id": "4f8d3c4c-67c7-4f56-9a8b-d1d6f6c2d6b5",
      "name": "Acme Pet Foods",
      "slug": "acme-pet-foods",
      "manufacturer": "Acme Corp.",
      "countryCode": "US",
      "logoImageUrl": "https://...",
      "isActive": true
    }
  ],
  "meta": {
    "page": 2, "limit": 20, "total": 134, "totalPages": 7, "hasNext": true, "hasPrev": true,
    "timestamp": "2026-06-29T10:00:00Z", "traceId": "..."
  }
}
```

```jsonc
// POST /api/v1/brands        (admin)
{
  "name": "Acme Pet Foods",
  "slug": "acme-pet-foods",
  "manufacturer": "Acme Corp.",
  "countryCode": "US",
  "websiteUrl": "https://acme.example",
  "description": "Acme is a pet food maker ..."
}

// 201
{
  "success": true,
  "data": { "id": "...", "createdAt": "...", ... }
}
```

### Brands — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 201  | Brand created. |
| 204  | Brand patched/deleted successfully. |
| 400  | Validation error. |
| 401  | Missing / invalid JWT. |
| 403  | Authenticated but non-admin tries admin route. |
| 404  | Brand not found. |
| 409  | Slug collision. |
| 429  | Rate limit exceeded. |
| 500  | Internal server error. |
| 503  | Database unavailable. |

---

## 3. Products (`/api/v1/products`)

The core catalog: food products, ingredient panels, target species / life stage.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/products`                          | List products (paginated, many filters).                              | No |
| GET    | `/api/v1/products/:slug`                    | Product detail (brand, ingredient list, current score, alternatives). | No |
| GET    | `/api/v1/products/:slug/ingredients`        | Ingredient panel (ordered).                                              | No |
| GET    | `/api/v1/products/:slug/nutrition`          | Nutrition profile for the product.                                       | No |
| GET    | `/api/v1/products/:slug/images`             | Product image gallery.                                                   | No |
| GET    | `/api/v1/products/:slug/tags`               | Tags applied to this product.                                            | No |
| GET    | `/api/v1/products/:slug/claims`             | Marketing claims.                                                        | No |
| GET    | `/api/v1/products/:slug/score-history`      | Score history (limited to current scoring version).                       | No |
| GET    | `/api/v1/products/:slug/alternatives`       | List healthier alternatives.                                             | No |
| GET    | `/api/v1/products/:slug/related`            | Related products (same brand, flavor variants, etc.).                    | No |
| GET    | `/api/v1/products/:slug/sources`            | Scientific citations backing the ingredient scores.                      | No |
| POST   | `/api/v1/products`                          | Create a product.                                                        | Yes (admin) |
| PATCH  | `/api/v1/products/:productId`              | Update a product.                                                         | Yes (admin) |
| POST   | `/api/v1/products/:productId/publish`      | Mark product as published (sets `published_at`).                          | Yes (admin) |
| POST   | `/api/v1/products/:productId/unpublish`    | Unpublish product.                                                        | Yes (admin) |
| POST   | `/api/v1/products/:productId/soft-delete`  | Soft-delete a product (sets `deleted_at`).                                | Yes (admin) |
| POST   | `/api/v1/products/:productId/restore`       | Restore a soft-deleted product.                                            | Yes (admin) |

### Products — Filters (GET /api/v1/products)

Query parameters:

| Param        | Type        | Description |
| ------------ | ----------- | ----------- |
| `q`          | text        | Free-text query against `name` + ingredient names. |
| `brand_id`   | uuid        | Filter by brand. |
| `pet_type`   | enum        | dog / cat / rabbit / bird / small_mammal. |
| `life_stage` | enum        | puppy / junior / adult / senior / geriatric. |
| `breed_size` | enum        | toy / small / medium / large / giant. |
| `food_form`  | enum        | kibble / wet / raw / freeze-dried / dehydrated / soft / topper / mixer / treat / supplement. |
| `protein_origin` | enum    | animal / plant / insect / fungi / synthetic. |
| `min_score`  | number      | Minimum current overall_score (0–100). |
| `max_score`  | number      | Maximum current overall_score. |
| `is_active`  | bool        | Defaults to `true`. |
| `is_published`| bool       | Defaults to `true`. |
| `sort_by`    | enum        | `created_at` / `published_at` / `overall_score` / `name`. |
| `sort_order` | enum        | `asc` / `desc`. |
| `page`       | int         | Defaults to 1. |
| `limit`      | int         | Defaults to 20. |

### Products — Request / Response shape

```jsonc
// GET /api/v1/products?q=chicken&pet_type=dog&min_score=70
// 200
{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "acme-adult-chicken",
      "name": "Acme Adult Chicken",
      "brandId": "...",
      "brandSlug": "acme-pet-foods",
      "foodForm": "kibble",
      "primaryProteinSource": "chicken",
      "packageSizeGrams": 5000,
      "packageSizeLabel": "5 lb",
      "isPublished": true,
      "publishedAt": "2026-06-01T00:00:00Z",
      "currentScore": {
        "overall": 84.2,
        "quality": 88.0,
        "safety": 92.0,
        "nutrition": 80.0,
        "transparency": 76.0,
        "scoringVersion": "2026.06"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 12, "totalPages": 1, ... }
}
```

```jsonc
// GET /api/v1/products/acme-adult-chicken
// 200
{
  "success": true,
  "data": {
    "id": "...", "slug": "...", "name": "...",
    "description": "...",
    "brandId": "...", "brandSlug": "...",
    "foodForm": "kibble",
    "primaryProteinSource": "chicken",
    "upc": "012345678901",
    "sku": "ACM-001",
    "packageSizeGrams": 5000,
    "images": [
      { "id": "...", "url": "https://...", "altText": "Bag", "isPrimary": true, "sortOrder": 0 }
    ],
    "tags": [ { "id": "...", "slug": "grain-free", "name": "Grain Free" } ],
    "claims": [ { "id": "...", "slug": "non-gmo", "name": "Non-GMO", "evidenceNote": "..." } ],
    "nutritionProfile": {
      "kcalPer100g": 380.0,
      "kcalPerCup": 410.0,
      "moisturePct": 8.0,
      "effectiveFrom": "2026-06-01"
    },
    "currentScore": { "...": "..." },
    "alternativesCount": 4,
    "ingredientCount": 12
  }
}
```

```jsonc
// GET /api/v1/products/acme-adult-chicken/ingredients
// 200
{
  "success": true,
  "data": [
    { "position": 1, "rawLabel": "Chicken", "isPrimary": true, "ingredientId": "...", "ingredientSlug": "chicken", "ingredientName": "Chicken", "grade": "A", "score": 92.0 },
    { "position": 2, "rawLabel": "Brown rice", "ingredientId": "...", "ingredientSlug": "brown-rice", "ingredientName": "Brown Rice", "grade": "B", "score": 78.0 }
  ],
  "meta": { ... }
}
```

```jsonc
// POST /api/v1/products        (admin)
{
  "brandId": "...",
  "name": "Acme Adult Chicken",
  "slug": "acme-adult-chicken",
  "description": "...",
  "upc": "012345678901",
  "sku": "ACM-001",
  "packageSizeGrams": 5000,
  "packageSizeLabel": "5 lb",
  "foodFormId": "...",
  "primaryProteinSourceId": "..."
}

// 201
{
  "success": true,
  "data": {
    "id": "...", "slug": "acme-adult-chicken", "isPublished": false, "publishedAt": null,
    "createdAt": "...", "updatedAt": "...", "deletedAt": null
  }
}
```

### Products — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 201  | Product created. |
| 204  | Product patched / published / unpublished / restored. |
| 400  | Validation error (e.g. invalid `upc`). |
| 401  | Missing / invalid JWT. |
| 403  | Non-admin tries admin route. |
| 404  | Product not found. |
| 409  | `(brand_id, slug)` collision or UPC already used. |
| 422  | Semantic constraint failure (e.g. cuisine mismatch). |
| 429  | Rate limit exceeded. |
| 500  | Internal server error. |
| 503  | Database unavailable. |

---

## 4. Ingredients (`/api/v1/ingredients`)

Canonical ingredient dictionary (3NF ref table).

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/ingredients`                          | List ingredients (paginated, filterable).                              | No |
| GET    | `/api/v1/ingredients/:slug`                    | Ingredient detail (current score, description, category).               | No |
| GET    | `/api/v1/ingredients/:slug/products`           | List products containing this ingredient.                                | No |
| GET    | `/api/v1/ingredients/:slug/references`         | Scientific references cited for this ingredient.                         | No |
| GET    | `/api/v1/ingredients/:slug/score-history`      | Score history (limited to current scoring version).                      | No |
| GET    | `/api/v1/ingredients/categories`               | List ingredient categories (paginated tree).                             | No |
| GET    | `/api/v1/ingredients/categories/:slug`         | Single category detail.                                                  | No |
| POST   | `/api/v1/ingredients`                          | Create ingredient.                                                       | Yes (admin) |
| PATCH  | `/api/v1/ingredients/:ingredientId`            | Update ingredient.                                                        | Yes (admin) |
| POST   | `/api/v1/ingredients/:ingredientId/soft-delete` | Soft-delete.                                                            | Yes (admin) |
| POST   | `/api/v1/ingredients/categories`               | Create a category (optionally nested).                                    | Yes (admin) |
| PATCH  | `/api/v1/ingredients/categories/:categoryId`   | Update a category.                                                       | Yes (admin) |

### Ingredients — Filters (GET /api/v1/ingredients)

| Param | Type | Description |
| ----- | ---- | ----------- |
| `q`                | text   | Free-text query against `name` / `canonical_name`. |
| `category_id`      | uuid   | Filter by category. |
| `is_animal_derived` | bool   | Filter on `is_animal_derived`. |
| `is_common_allergen`| bool  | Filter on `is_common_allergen`. |
| `is_controversial` | bool   | Filter on `is_controversial`. |
| `min_score`        | number | Minimum current overall_score. |
| `is_active`        | bool   | Default true. |
| `sort_by`          | enum   | `name` / `score` / `created_at`. |
| `sort_order`       | enum   | `asc` / `desc`. |
| `page`, `limit`    | int    | Pagination. |

### Ingredients — Request / Response shape

```jsonc
// GET /api/v1/ingredients?q=chick&is_controversial=false
// 200
{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "chicken",
      "name": "Chicken",
      "canonicalName": "chicken",
      "inciName": null,
      "category": { "id": "...", "slug": "animal-protein", "name": "Animal Protein" },
      "isAnimalDerived": true,
      "isCommonAllergen": false,
      "isControversial": false,
      "currentScore": { "score": 92.0, "grade": "A", "scoringVersion": "2026.06" },
      "productCount": 314
    }
  ],
  "meta": { ... }
}
```

```jsonc
// GET /api/v1/ingredients/chicken
// 200
{
  "success": true,
  "data": {
    "id": "...", "slug": "chicken", "name": "Chicken", "canonicalName": "chicken",
    "inciName": null,
    "category": { "id": "...", "slug": "animal-protein", "name": "Animal Protein" },
    "description": "Chicken is the most common protein source in pet foods...",
    "isAnimalDerived": true, "isCommonAllergen": false, "isControversial": false,
    "currentScore": { "score": 92.0, "grade": "A", "reasoning": "..." },
    "productCount": 314,
    "referenceCount": 27
  }
}
```

```jsonc
// POST /api/v1/ingredients        (admin)
{
  "name": "Chicken",
  "slug": "chicken",
  "canonicalName": "chicken",
  "categoryId": "...",
  "isAnimalDerived": true,
  "isCommonAllergen": false,
  "isControversial": false
}

// 201
{ "success": true, "data": { "id": "..." } }
```

### Ingredients — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 201  | Ingredient / category created. |
| 204  | Ingredient patched / soft-deleted. |
| 400  | Validation error. |
| 401  | Missing / invalid JWT. |
| 403  | Non-admin tries admin route. |
| 404  | Ingredient / category not found. |
| 409  | Slug collision. |
| 422  | Cycle in category parent chain. |
| 429  | Rate limit exceeded. |
| 500  | Internal server error. |
| 503  | Database unavailable. |

---

## 5. Search (`/api/v1/search`)

Two surfaces: full-text product search and ingredient search.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/search/products`      | Product search.                                  | No  |
| GET    | `/api/v1/search/ingredients`   | Ingredient search.                               | No  |
| GET    | `/api/v1/search/brands`         | Brand search.                                     | No  |
| GET    | `/api/v1/search/global`         | Multi-entity search (returns typed results).       | No  |
| GET    | `/api/v1/search/synonyms`       | Read-only enumeration of canonical synonyms.      | No  |
| GET    | `/api/v1/search/trending`       | Trending searches (last 24h, 7d).                 | No  |
| GET    | `/api/v1/search/analytics`     | Search analytics (admin only).                     | Yes (admin) |

### Search — Query parameters

| Param | Type | Description |
| ----- | ---- | ----------- |
| `q`                | text     | The query string (required). |
| `pet_type`         | enum     | Filter results to one species. |
| `min_score`        | number   | Minimum current score. |
| `limit`            | int      | Defaults to 10, max 50 (search has lower caps than list endpoints). |
| `locale`           | enum     | Defaults to `en-US`. |

### Search — Response shape

```jsonc
// GET /api/v1/search/products?q=chicken&pet_type=dog
// 200
{
  "success": true,
  "data": {
    "results": [
      {
        "rank": 1,
        "score": 0.93,
        "matchType": "exact",
        "product": {
          "id": "...", "slug": "acme-adult-chicken", "name": "Acme Adult Chicken",
          "brand": { "id": "...", "slug": "acme-pet-foods", "name": "Acme Pet Foods" },
          "currentScore": { "overall": 84.2 }
        }
      }
    ],
    "totalResults": 12,
    "latencyMs": 18,
    "query": "chicken"
  }
}
```

```jsonc
// GET /api/v1/search/global?q=chicken&limit=5
// 200
{
  "success": true,
  "data": {
    "results": [
      { "kind": "ingredient", "rank": 1, "score": 0.97, "ingredient": { "id": "...", "slug": "chicken", "name": "Chicken" } },
      { "kind": "product",    "rank": 2, "score": 0.93, "product":    { ... } },
      { "kind": "brand",      "rank": 3, "score": 0.81, "brand":      { ... } }
    ],
    "totalResults": 47,
    "latencyMs": 24,
    "query": "chicken"
  }
}
```

```jsonc
// GET /api/v1/search/analytics?from=2026-06-01&to=2026-06-30        (admin)
// 200
{
  "success": true,
  "data": {
    "totals": { "queries": 124782, "zeroResultQueries": 23901, "avgLatencyMs": 18 },
    "topQueries": [
      { "normalized": "chicken dog food", "count": 9421 },
      { "normalized": "grain free puppy", "count": 6001 }
    ],
    "topZeroResults": [
      { "normalized": "vegan cat food", "count": 1342 }
    ]
  }
}
```

### Search — Status codes

| Code | When |
| ---- | ---- |
| 200  | Results (possibly empty). |
| 400  | Missing `q` parameter. |
| 401  | Admin route missing auth. |
| 403  | Admin route without admin role. |
| 408  | Search timed out (15 s). |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 6. Scoring (`/api/v1/scoring`)

Score read endpoints (writes are admin / batch).

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/scoring/products/:productId`           | Current product score (all dimensions).                                   | No |
| GET    | `/api/v1/scoring/products/:productId/history`   | Score history (paginated, filter by version).                              | No |
| GET    | `/api/v1/scoring/ingredients/:ingredientId`      | Current ingredient score.                                                  | No |
| GET    | `/api/v1/scoring/ingredients/:ingredientId/history` | Ingredient score history.                                              | No |
| GET    | `/api/v1/scoring/brands/:brandId/summary`         | Brand aggregate.                                                          | No |
| POST   | `/api/v1/scoring/products/:productId/recompute` | Trigger a recompute (job-like).                                           | Yes (admin) |
| POST   | `/api/v1/scoring/ingredients/:ingredientId/recompute` | Trigger a recompute.                                              | Yes (admin) |
| POST   | `/api/v1/scoring/jobs/:jobId/cancel`             | Cancel a pending recompute job.                                            | Yes (admin) |

### Scoring — Response shape

```jsonc
// GET /api/v1/scoring/products/:productId
// 200
{
  "success": true,
  "data": {
    "productId": "...",
    "scoringVersion": "2026.06",
    "computedAt": "2026-06-29T02:00:00Z",
    "overall": 84.2,
    "quality": 88.0,
    "safety": 92.0,
    "nutrition": 80.0,
    "transparency": 76.0,
    "grade": "B+",
    "reasoning": "Mostly clean ingredients; minor concerns about ambiguous protein source 'meat meal'..."
  }
}
```

```jsonc
// GET /api/v1/scoring/brands/:brandId/summary
// 200
{
  "success": true,
  "data": {
    "brandId": "...",
    "productCount": 12,
    "avgOverallScore": 81.4,
    "avgQualityScore": 84.0,
    "avgSafetyScore": 88.7,
    "avgNutritionScore": 78.1,
    "avgTransparencyScore": 72.5,
    "openRecallCount": 0,
    "scoringVersion": "2026.06",
    "computedAt": "2026-06-29T02:00:00Z"
  }
}
```

```jsonc
// POST /api/v1/scoring/products/:productId/recompute        (admin)
// 202
{
  "success": true,
  "data": {
    "jobId": "...",
    "status": "queued",
    "productId": "...",
    "queuedAt": "..."
  }
}
```

### Scoring — Status codes

| Code | When |
| ---- | ---- |
| 200  | Read success. |
| 202  | Recompute job queued. |
| 401  | Admin route missing auth. |
| 403  | Admin route without admin role. |
| 404  | Product / ingredient / brand not found. |
| 409  | A recompute is already queued/running for this entity. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 7. AI Explanations (`/api/v1/ai`)

AI-generated explanations of ingredient panels. All writes go through a queue and are rate-limited per user.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/ai/products/:productId/explanation`    | Latest AI explanation of the product's ingredient panel.               | No  |
| POST   | `/api/v1/ai/products/:productId/explanation`    | Request an explanation (returns 201 if cached, 202 if queued).         | Yes |
| GET    | `/api/v1/ai/ingredients/:ingredientId/explanation`| Latest explanation for a single ingredient.                            | No  |
| POST   | `/api/v1/ai/ingredients/:ingredientId/explanation`| Request an explanation.                                                | Yes |
| POST   | `/api/v1/ai/feedback`                            | Thumbs-up/down + free text on a generated explanation.                  | Yes |
| GET    | `/api/v1/ai/jobs/:jobId`                         | Job status (queued / running / done / error).                            | Yes (owner only) |

### AI — Response shape

```jsonc
// GET /api/v1/ai/products/:productId/explanation
// 200
{
  "success": true,
  "data": {
    "explanationId": "...",
    "productId": "...",
    "modelId": "gpt-4o",
    "modelVersion": "2026-06",
    "summary": "Acme Adult Chicken has a strong ingredient profile with named animal protein, but is short on omega-3 and uses 'meat meal' which we cannot trace to a specific species.",
    "keyPoints": [
      { "type": "positive", "text": "Named meat protein (chicken)" },
      { "type": "caution",  "text": "Includes 'meat meal' — non-disclosed species" },
      { "type": "positive", "text": "No artificial colours" }
    ],
    "citations": [
      { "ingredientId": "...", "supporting": true, "referenceIds": ["..."] }
    ],
    "disclaimer": "AI-generated summaries may be inaccurate. Always read the full ingredient panel and consult your vet for medical advice.",
    "createdAt": "2026-06-29T12:34:56Z",
    "feedback": { "score": null }
  }
}
```

```jsonc
// POST /api/v1/ai/products/:productId/explanation
// 202 (queued)
{ "success": true, "data": { "jobId": "...", "status": "queued" } }
// 201 (cached)
{ "success": true, "data": { "explanationId": "...", "summary": "..." } }
```

```jsonc
// POST /api/v1/ai/feedback
{
  "explanationId": "...",
  "score": 1,            // -1 = bad, 0 = neutral, 1 = good
  "comment": "Helpful"
}

// 204
```

### AI — Status codes

| Code | When |
| ---- | ---- |
| 200  | Existing explanation. |
| 201  | New explanation generated synchronously. |
| 202  | Explanation queued. |
| 204  | Feedback accepted. |
| 400  | Validation error. |
| 401  | Missing / invalid JWT. |
| 402  | AI quota exhausted (Stripe-style — payment required). |
| 404  | Product / ingredient not found. |
| 409  | Job already in flight. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 502  | Upstream AI provider failure. |
| 503  | Database unavailable. |

---

## 8. Recommendations (`/api/v1/products/:slug/recommendations`)

Sub-module nested under Products for cleaner URLs.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/products/:slug/alternatives`          | List healthier alternatives.                                                | No |
| GET    | `/api/v1/products/:slug/related`               | Same-brand / variant / similar products.                                    | No |
| GET    | `/api/v1/products/:slug/compare/:targetSlug`   | Side-by-side compare payload (used by /compare/[a]-vs-[b] page).              | No |
| POST   | `/api/v1/products/:slug/alternatives:recompute` | Trigger an alternatives recompute (admin).                                 | Yes (admin) |

### Recommendations — Query parameters

| Param | Type | Description |
| ----- | ---- | ----------- |
| `limit`         | int  | Defaults to 5, max 20. |
| `pet_type`      | enum | Restrict alternative search to a species. |
| `life_stage`    | enum | Restrict by life stage (e.g. alternatives for puppies). |
| `include_relations` | array[string] | `flavor-variant`, `size-variant`, `same-brand`, `similar-profile`. |

### Recommendations — Response shape

```jsonc
// GET /api/v1/products/acme-adult-chicken/alternatives?limit=3
// 200
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "scoreDelta": +4.5,
      "reasoning": "Higher quality protein source and full ingredient transparency.",
      "alternative": {
        "id": "...", "slug": "ocean-life-adult-salmon", "name": "Ocean Life Adult Salmon",
        "brand": { "id": "...", "slug": "ocean-life", "name": "Ocean Life" },
        "currentScore": { "overall": 88.7, "safety": 96.0 }
      }
    }
  ],
  "meta": { "scoringVersion": "2026.06", "traceId": "..." }
}
```

```jsonc
// GET /api/v1/products/acme-adult-chicken/related?include_relations=flavor-variant,same-brand
// 200
{
  "success": true,
  "data": [
    { "relationType": "flavor-variant", "product": { ... } },
    { "relationType": "same-brand",    "product": { ... } }
  ]
}
```

```jsonc
// GET /api/v1/products/acme-adult-chicken/compare/ocean-life-adult-salmon
// 200
{
  "success": true,
  "data": {
    "a": { "product": { "id": "..." }, "score": { "overall": 84.2 }, "ingredients": [...], "nutrition": {...} },
    "b": { "product": { "id": "..." }, "score": { "overall": 88.7 }, "ingredients": [...], "nutrition": {...} },
    "winner": "b",
    "scoringVersion": "2026.06"
  }
}
```

### Recommendations — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 202  | Recompute queued. |
| 401  | Admin route missing auth. |
| 403  | Admin route without admin role. |
| 404  | Source or alternative product not found. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 9. Admin (`/api/v1/admin`)

All admin endpoints require the `admin` role. Routes are NOT exposed if Supabase Auth role claims are missing.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/admin/users`                          | List users (paginated, filter by role, email).                              | Yes (admin) |
| GET    | `/api/v1/admin/users/:userId`                  | Get user detail.                                                              | Yes (admin) |
| PATCH  | `/api/v1/admin/users/:userId`                  | Update user role / is_active.                                                 | Yes (admin) |
| DELETE | `/api/v1/admin/users/:userId`                  | Soft-delete user.                                                              | Yes (admin) |
| GET    | `/api/v1/admin/audit`                          | Read audit_logs (paginated, filter by entity, actor, action).                 | Yes (admin) |
| GET    | `/api/v1/admin/audit/:auditId`                 | Single audit record.                                                            | Yes (admin) |
| GET    | `/api/v1/admin/audit/export`                   | CSV / NDJSON export (admin).                                                   | Yes (admin) |
| GET    | `/api/v1/admin/recalls`                        | Admin manage recalls.                                                          | Yes (admin) |
| POST   | `/api/v1/admin/recalls`                        | Create a recall entry.                                                          | Yes (admin) |
| PATCH  | `/api/v1/admin/recalls/:recallId`              | Update a recall.                                                                 | Yes (admin) |
| POST   | `/api/v1/admin/recalls/:recallId/resolve`     | Mark a recall resolved.                                                          | Yes (admin) |
| GET    | `/api/v1/admin/score-history`                  | Global score history with filters.                                              | Yes (admin) |
| POST   | `/api/v1/admin/jobs/:jobId/cancel`             | Cancel any job (AI, scoring, ingest).                                          | Yes (admin) |
| GET    | `/api/v1/admin/feature-flags`                  | Read feature flags.                                                             | Yes (admin) |
| PATCH  | `/api/v1/admin/feature-flags/:flag`            | Toggle a feature flag.                                                          | Yes (admin) |

### Admin — Response shape

```jsonc
// GET /api/v1/admin/users?role=admin&limit=20
// 200
{
  "success": true,
  "data": [
    {
      "id": "...",
      "email": "ops@tuskrank.com",
      "displayName": "Ops",
      "role": "admin",
      "isActive": true,
      "createdAt": "2025-08-12T...",
      "lastSignInAt": "2026-06-29T..."
    }
  ],
  "meta": { ... }
}
```

```jsonc
// GET /api/v1/admin/audit?entity_type=product_scores&from=2026-06-01&to=2026-06-30&page=1
// 200
{
  "success": true,
  "data": [
    {
      "auditId": "...",
      "occurredAt": "2026-06-29T02:00:00Z",
      "actorType": "system",
      "action": "update",
      "entityType": "product_scores",
      "entityId": "...",
      "requestId": "...",
      "diff": { "before": { ... }, "after": { ... } }
    }
  ],
  "meta": { "page": 1, "total": 2390, ... }
}
```

```jsonc
// PATCH /api/v1/admin/users/:userId
{ "role": "admin", "isActive": true }

// 200
{ "success": true, "data": { "id": "...", "role": "admin", ... } }
```

### Admin — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read / update. |
| 201  | Resource created. |
| 204  | Resource soft-deleted. |
| 400  | Validation error. |
| 401  | Missing / invalid JWT. |
| 403  | Authenticated but not admin. |
| 404  | User / audit / recall / job not found. |
| 409  | Conflict (e.g. cancelling a finished job). |
| 422  | Illegal state change. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 10. SEO (`/api/v1/seo`)

SEO assets + sitemap endpoints.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/seo/pages`                      | List seo_pages (admin).                                                            | Yes (admin) |
| GET    | `/api/v1/seo/pages/:pageId`              | Page detail.                                                                       | Yes (admin) |
| POST   | `/api/v1/seo/pages`                      | Create a page.                                                                     | Yes (admin) |
| PATCH  | `/api/v1/seo/pages/:pageId`              | Update a page (canonical, robots, JSON-LD, etc.).                                 | Yes (admin) |
| DELETE | `/api/v1/seo/pages/:pageId`              | Soft-delete a page.                                                                | Yes (admin) |
| GET    | `/api/v1/seo/pages/:pageId/faq`          | List FAQ items for a page (admin).                                                  | Yes (admin) |
| POST   | `/api/v1/seo/pages/:pageId/faq`          | Add an FAQ item.                                                                   | Yes (admin) |
| PATCH  | `/api/v1/seo/pages/:pageId/faq/:faqId`    | Update an FAQ item.                                                                  | Yes (admin) |
| DELETE | `/api/v1/seo/pages/:pageId/faq/:faqId`    | Delete an FAQ item.                                                                  | Yes (admin) |
| GET    | `/api/v1/seo/sitemap.xml`                 | XML sitemap (paginated).                                                            | No (public) |
| GET    | `/api/v1/seo/sitemap-products.xml`        | XML sitemap slice for products.                                                     | No |
| GET    | `/api/v1/seo/sitemap-ingredients.xml`     | XML sitemap slice for ingredients.                                                  | No |
| GET    | `/api/v1/seo/sitemap-brands.xml`          | XML sitemap slice for brands.                                                       | No |
| GET    | `/api/v1/seo/sitemap-compare.xml`         | Comparison pages sitemap.                                                            | No |
| GET    | `/api/v1/seo/robots.txt`                  | Robots policy.                                                                     | No |
| GET    | `/api/v1/seo/manifest.webmanifest`        | PWA manifest.                                                                      | No |
| GET    | `/api/v1/seo/opensearch.xml`              | OpenSearch descriptor.                                                              | No |
| GET    | `/api/v1/seo/structured-data/:kind/:slug` | Server-rendered JSON-LD blob (redirected from `<link rel="alternate" type="application/ld+json">`). | No |

### SEO — Public response shape (sitemap)

```xmlc
// GET /api/v1/seo/sitemap-products.xml?page=12
HTTP/1.1 200 OK
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tuskrank.com/products/acme-adult-chicken</loc>
    <lastmod>2026-06-29T02:00:00Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ...
</urlset>
```

```jsonc
// GET /api/v1/seo/structured-data/product/acme-adult-chicken
// 200
{
  "success": true,
  "data": {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Acme Adult Chicken",
    "image": "https://...",
    "brand": { "@type": "Brand", "name": "Acme Pet Foods" },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": 4.5, "reviewCount": 220 },
    ...
  }
}
```

### SEO — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 201  | SEO page / FAQ created. |
| 204  | Page / FAQ deleted. |
| 400  | Validation error (e.g. invalid JSON-LD). |
| 401  | Admin route missing auth. |
| 403  | Non-admin tries admin route. |
| 404  | SEO page / FAQ not found. |
| 409  | `(kind, slug)` collision. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 11. Analytics (`/api/v1/analytics`)

Aggregated read endpoints that produce charts/dashboards for the public site and the admin console.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/analytics/search`               | Search analytics (popular queries, zero-result queries).                       | Yes (admin)        |
| GET    | `/api/v1/analytics/products/top-scored`   | Top-scored products aggregated daily / weekly.                                  | No                 |
| GET    | `/api/v1/analytics/ingredients/top`       | Most-referenced ingredients.                                                    | No                 |
| GET    | `/api/v1/analytics/brands/coverage`       | Per-brand coverage stats (e.g. products per country, certifications count).        | No                 |
| GET    | `/api/v1/analytics/recommendations/clicks`| Click-through rate on healthier alternatives.                                  | Yes (admin)        |
| GET    | `/api/v1/analytics/compare/usage`         | Compare-page usage.                                                             | Yes (admin)        |
| GET    | `/api/v1/analytics/ai/usage`              | AI explanation usage + cost.                                                    | Yes (admin)        |
| POST   | `/api/v1/analytics/events`                | Ingest a client-side event (server-side fallback for clients without `navigator.sendBeacon`). | No |

### Analytics — Response shape

```jsonc
// GET /api/v1/analytics/search?window=24h
// 200 (admin)
{
  "success": true,
  "data": {
    "window": "24h",
    "totals": { "queries": 4210, "zeroResults": 612, "avgLatencyMs": 18 },
    "topQueries": [
      { "normalized": "chicken dog food", "count": 401 },
      { "normalized": "grain free puppy",  "count": 290 }
    ],
    "entityBreakdown": {
      "product":    1810,
      "ingredient": 1400,
      "brand":        660,
      "global":       340
    }
  }
}
```

```jsonc
// POST /api/v1/analytics/events
{
  "kind": "product_view",
  "productSlug": "acme-adult-chicken",
  "referrer": "https://tuskrank.com/brands/acme-pet-foods",
  "occurredAt": "2026-06-29T10:00:00Z"
}

// 204
```

### Analytics — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 204  | Event accepted. |
| 400  | Bad event payload. |
| 401  | Admin route missing auth. |
| 403  | Non-admin tries admin route. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 12. Audit (`/api/v1/audit`)

Read-only projections of `audit_logs`. Most calls are admin; the public-facing audit is limited to specific actions (e.g. recall listings).

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/admin/audit`                     | Paginated audit feed (full column set).                                                  | Yes (admin)        |
| GET    | `/api/v1/admin/audit/:auditId`            | Single audit record (canonical).                                                          | Yes (admin)        |
| GET    | `/api/v1/admin/audit/export`              | NDJSON / CSV export within window.                                                         | Yes (admin)        |
| GET    | `/api/v1/audit/products/:slug`            | Read-only public audit slice for a product (e.g. score publishes, recalls affecting it).   | No                 |
| GET    | `/api/v1/audit/ingredients/:slug`         | Public audit slice for an ingredient.                                                       | No                 |
| GET    | `/api/v1/audit/brands/:slug`              | Public audit slice for a brand.                                                            | No                 |

> Note: the public-facing `/api/v1/audit/*` routes expose only a **safe subset** of audit data — never raw `before`/`after` payloads.

### Audit — Response shape

```jsonc
// GET /api/v1/audit/products/acme-adult-chicken
// 200
{
  "success": true,
  "data": [
    {
      "occurredAt": "2026-06-29T02:00:00Z",
      "actorType": "system",
      "action": "score_publish",
      "entityType": "product_scores",
      "entityId": "...",
      "scoringVersion": "2026.06",
      "summary": "Score updated: 84.2 → 85.0"
    }
  ]
}
```

### Audit — Status codes

| Code | When |
| ---- | ---- |
| 200  | Successful read. |
| 400  | Validation error (e.g. invalid date range). |
| 401  | Admin route missing auth. |
| 403  | Non-admin tries admin route. |
| 404  | Entity not found. |
| 429  | Rate limit exceeded. |
| 500  | Internal error. |
| 503  | Database unavailable. |

---

## 13. Health (`/api/v1/health`)

Operational probes.

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| GET    | `/api/v1/health`              | Combined liveness + readiness (Terminus).                                  | No (probe-only) |
| GET    | `/api/v1/health/live`         | Kubernetes `livenessProbe`.                                                  | No (probe-only) |
| GET    | `/api/v1/health/ready`        | Kubernetes `readinessProbe` (includes Postgres probe).                    | No (probe-only) |

### Health — Response shape

```jsonc
// GET /api/v1/health
// 200
{
  "status": "ok",
  "info": {
    "memory_heap":     { "status": "up" },
    "memory_rss":      { "status": "up" },
    "postgres":        { "status": "up", "latencyMs": 4 }
  },
  "error": {},
  "details": { ... }
}
```

```jsonc
// GET /api/v1/health/live
// 200
{ "success": true, "data": { "status": "alive" } }

// GET /api/v1/health/ready
// 503 (Postgres down)
{ "status": "error", "error": { "postgres": { "status": "down" } } }
```

### Health — Status codes

| Code | When |
| ---- | ---- |
| 200  | Probe healthy. |
| 503  | Probe unhealthy (DB down, OOM, etc.). |

---

## 14. Concerns

### 14.1 Common Response Envelope

```jsonc
// Success
{ "success": true, "data": ..., "meta": { "timestamp": "ISO", "traceId": "..." } }
// Error
{ "success": false, "error": { "code": "...", "message": "...", "traceId": "..." }, "meta": { "timestamp": "ISO", "traceId": "..." } }
```

### 14.2 Pagination Envelope

```jsonc
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1, "limit": 20, "total": 134, "totalPages": 7,
    "hasPrev": false, "hasNext": true,
    "sortBy": "created_at", "sortOrder": "desc",
    "links": { "self": "...", "first": "...", "prev": null, "next": "...", "last": "..." },
    "timestamp": "...", "traceId": "..."
  }
}
```

### 14.3 Error Codes

| Code | HTTP | Meaning |
| ---- | ---- | ------- |
| `VALIDATION_ERROR`        | 400  | Validation failed. |
| `BAD_REQUEST`             | 400  | Generic 400. |
| `UNAUTHORIZED`           | 401  | Missing/invalid JWT. |
| `FORBIDDEN`              | 403  | Authenticated but insufficient permissions. |
| `NOT_FOUND`               | 404  | Resource missing. |
| `CONFLICT`                | 409  | Uniqueness / state conflict. |
| `UNPROCESSABLE_ENTITY`    | 422  | Semantic constraint failure. |
| `RATE_LIMITED`            | 429  | Throttle guard triggered. |
| `REQUEST_TIMEOUT`         | 408  | `RequestTimeoutException`. |
| `PAYLOAD_TOO_LARGE`       | 413  | Body parser limit. |
| `INTERNAL_ERROR`          | 500  | Unhandled exception (server log captures detail). |
| `DATABASE_UNAVAILABLE`    | 503  | Postgres unreachable. |
| `UPSTREAM_FAILURE`        | 502  | Supabase / AI provider / external. |

### 14.4 Auth Headers

All authenticated endpoints accept:

```
Authorization: Bearer <supabase_jwt>
```

Optional forwarded headers (gateway may provide; server respects whichever arrived first):

```
x-request-id
x-correlation-id
```

### 14.5 Pagination Defaults

| Field | Default | Max |
| ----- | ------- | --- |
| `page`  | 1   | –   |
| `limit` | 20  | 100 (some endpoints cap at 50 / 20) |

---

## 15. Concerns — Cross-Cutting

### 15.1 Idempotency

- Safe POSTs (signup, login, refresh, /events) accept an `Idempotency-Key: <uuid>` header. The API caches the response by `(actor, route, key)` for 24 h to protect against double-submits.

### 15.2 Rate Limiting

| Route                                   | Limit (per IP) |
| --------------------------------------- | -------------- |
| `POST /auth/login`, `POST /auth/signup`  | 10 / 5 min     |
| `POST /auth/password-reset/*`           | 5  / 1 h       |
| `POST /ai/*`                             | 30 / 1 h       |
| `GET /*`                                 | 120 / 1 min (default) |
| `POST /admin/*`                          | 60  / 1 min    |

### 15.3 Caching

| Route                                | Strategy |
| ------------------------------------ | -------- |
| `GET /brands/:slug`                   | `s-maxage=300, stale-while-revalidate=86400` |
| `GET /products/:slug`                 | `s-maxage=120, stale-while-revalidate=3600` |
| `GET /ingredients/:slug`              | `s-maxage=600, stale-while-revalidate=86400` |
| `GET /search/*`                       | no-cache |
| `GET /ai/*`                           | `s-maxage=300, stale-while-revalidate=21600` |

### 15.4 Versioning

- All routes prefixed with `/api/v1/...`. URI versioning.
- Default version is `v1` (`API_DEFAULT_VERSION=1`). Future: `v2` retained for major breakages.

### 15.5 Future: Webhooks

| Method | URL | Purpose | Auth |
| ------ | --- | ------- | ---- |
| POST   | `/api/v1/webhooks/endpoints`              | Register a webhook endpoint. | Yes (admin) |
| GET    | `/api/v1/webhooks/endpoints`              | List webhook endpoints. | Yes (admin) |
| DELETE | `/api/v1/webhooks/endpoints/:endpointId`  | Soft-delete. | Yes (admin) |
| POST   | `/api/v1/webhooks/endpoints/:endpointId/deliveries/:eventType` | Test delivery. | Yes (admin) |

Events emitted: `product.published`, `product.score_published`, `recall.created`, `recall.resolved`, `search.explanation.generated`, `certification.granted`, `certification.expired`.

---

## 16. Versioning the API Roadmap

| Sprint  | Modules Expected To Land |
| ------- | ------------------------ |
| 2A | Foundation (Health + Auth scaffolding). |
| 2B | **Auth**, **Brands**, **Products** (read + admin). |
| 3  | **Ingredients**, **Search**, SEO skeletons. |
| 4  | **Scoring**, **Recommendations**. |
| 5  | Frontend (apps/web) — consumes existing API. |
| 6  | **Admin** (auth + audit + recall UI). |
| 7  | **AI Explanations**. |
| 8  | **SEO** (sitemaps, JSON-LD), **Analytics**. |
| 9  | Tests (contract, e2e, load). |
| 10 | Deployment / multi-region. |

---

> **Note:** This document is descriptive only. Implementation rolls out module-by-module per the sprint roadmap above. No endpoints are implemented in Sprint 2A other than `/health/*` and the auth `/auth/me` scaffold.
