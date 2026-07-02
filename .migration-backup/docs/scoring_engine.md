# Scoring Engine

> Tuskrank product scoring engine — modular, configurable, extensible.

---

## Architecture

The scoring engine uses the **Strategy Pattern** to compute product scores across 7 independent categories. Each category is implemented as a standalone strategy that can be modified, replaced, or extended without affecting other categories.

```
┌─────────────────────────────────────────────────────┐
│                  ScoringController                   │
│            POST /scoring/score                      │
│            POST /scoring/bulk                       │
│            POST /scoring/preview                    │
│            GET  /scoring/current                    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  ScoringService                      │
│   - Orchestrates scoring flow                       │
│   - Fetches product data via repository             │
│   - Runs engine, persists results                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  ScoringEngine                       │
│   - Composes strategies with configurable weights   │
│   - Computes overall score = Σ(weight × category)   │
│   - Derives grade from score                        │
│   - Collects warnings and recommendations           │
└───┬──────┬──────┬──────┬──────┬──────┬──────┬──────┘
    │      │      │      │      │      │      │
┌───▼──┐┌──▼───┐┌─▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐
│ IQS  ││ TS   ││ NBS││ PLS ││ SES ││ CIS ││ LTS │
│ 35%  ││ 20%  ││ 15%││ 10% ││ 10% ││ 5%  ││ 5%  │
└──────┘└──────┘└────┘└─────┘└─────┘└─────┘└─────┘
```

### Module Structure

```
modules/scoring/
├── scoring.module.ts           # NestJS module wiring
├── scoring.controller.ts       # REST endpoints
├── scoring.service.ts          # Orchestration layer
├── engine/
│   └── scoring.engine.ts       # Strategy composition engine
├── strategies/
│   ├── ingredient-quality.strategy.ts
│   ├── transparency.strategy.ts
│   ├── nutritional-balance.strategy.ts
│   ├── processing-level.strategy.ts
│   ├── controversial-ingredients.strategy.ts
│   ├── scientific-evidence.strategy.ts
│   └── label-transparency.strategy.ts
├── repositories/
│   └── scoring.repository.ts   # DB queries for product data
├── dto/
│   ├── scoring.dto.ts          # Input DTOs
│   └── scoring-result.dto.ts   # Output DTOs
├── types/
│   └── index.ts                # CategoryScore, ScoringResult, etc.
├── enums/
│   └── index.ts                # ScoringCategory, ScoreGrade, etc.
├── constants/
│   └── index.ts                # Default weights, grade boundaries
├── interfaces/
│   └── index.ts                # ScoringStrategy, ScoringEngine
└── errors/
    └── index.ts                # Scoring-specific error classes
```

---

## Scoring Flow

1. **Controller** receives request (score product, bulk score, preview)
2. **Service** fetches product data via repository (ingredients, nutrition, brand, claims, references)
3. **Engine** runs all 7 strategies against the product data
4. Each strategy returns a `CategoryScore` (score 0–100, confidence 0–1, reasoning)
5. Engine applies configurable weights: `overallScore = Σ(weight × categoryScore)`
6. Engine derives letter grade from overall score
7. Engine collects warnings and recommendations from all strategies
8. **Service** persists results to `product_scores` and `score_history`
9. **Controller** returns `ScoringResult` wrapped in `okResponse()`

---

## Strategy Pattern

Each scoring category implements the `ScoringStrategy` interface:

```typescript
interface ScoringStrategy {
  readonly category: ScoringCategory;

  score(input: ProductScoringInput): CategoryScore;
  getWarnings(input: ProductScoringInput, score: CategoryScore): ScoringWarning[];
  getRecommendations(input: ProductScoringInput, score: CategoryScore): ScoringRecommendation[];
}
```

### Strategy Independence

- Strategies are **pure functions** — no side effects, no I/O
- Each strategy operates only on `ProductScoringInput` data
- Strategies can be tested in isolation
- New strategies can be added by implementing the interface
- Existing strategies can be replaced without affecting others

### Default Strategies

| # | Strategy | Category | Weight | Key Signals |
|---|----------|----------|--------|-------------|
| 1 | `IngredientQualityStrategy` | Ingredient Quality | 35% | Ingredient count, protein source, safety scores, diversity |
| 2 | `TransparencyStrategy` | Transparency | 20% | Naming specificity, brand transparency, certifications |
| 3 | `NutritionalBalanceStrategy` | Nutritional Balance | 15% | Protein, fat, fiber, moisture, ash, kcal levels |
| 4 | `ProcessingLevelStrategy` | Processing Level | 10% | Food form, processing indicators, named meat vs meal |
| 5 | `ScientificEvidenceStrategy` | Scientific Evidence | 10% | Reference count, evidence type, source diversity |
| 6 | `ControversialIngredientsStrategy` | Controversial Ingredients | 5% | Fillers, artificial colors/preservatives, sweeteners |
| 7 | `LabelTransparencyStrategy` | Label Transparency | 5% | Guaranteed analysis, ingredient list, certifications |

---

## Weight System

Weights are **configurable at runtime** via `ScoringConfig`:

```typescript
interface ScoringConfig {
  weights?: Partial<Record<ScoringCategory, number>>;
  version?: string;
  includeReasoning?: boolean;
  maxWarnings?: number;
  maxRecommendations?: number;
}
```

### Default Weights

```typescript
{
  ingredient_quality: 0.35,
  transparency: 0.20,
  nutritional_balance: 0.15,
  processing_level: 0.10,
  scientific_evidence: 0.10,
  controversial_ingredients: 0.05,
  label_transparency: 0.05,
}
```

### Weight Normalization

If weights don't sum to 1.0, the engine automatically normalizes them:

```typescript
// User provides: { ingredient_quality: 0.5, transparency: 0.3 }
// After normalization: { ingredient_quality: 0.625, transparency: 0.375 }
```

### Overriding Weights

Via API:
```json
POST /api/v1/scoring/score
{
  "productId": "...",
  "ingredientQualityWeight": 0.40,
  "transparencyWeight": 0.25
}
```

---

## Score Output

### ScoringResult

```typescript
{
  productId: "uuid",
  overallScore: 78,           // 0–100
  grade: "B+",                // A+ through F
  categories: [               // 7 category scores
    { category: "ingredient_quality", score: 82, confidence: 0.85, reasoning: "..." },
    { category: "transparency", score: 70, confidence: 0.90, reasoning: "..." },
    ...
  ],
  weightedScores: {           // Score × weight per category
    ingredient_quality: 28.7,
    transparency: 14.0,
    ...
  },
  warnings: [                 // Flagged concerns
    { category: "...", severity: "medium", code: "LOW_PROTEIN", message: "..." }
  ],
  recommendations: [          // Improvement suggestions
    { category: "...", priority: 1, code: "IMPROVE_INGREDIENTS", message: "...", estimatedImpact: 15 }
  ],
  confidence: 0.82,           // Overall confidence (0–1)
  version: "1.0.0",
  computedAt: "2026-06-29T12:00:00.000Z"
}
```

### Grade Boundaries

| Score Range | Grade |
|-------------|-------|
| 97–100 | A+ |
| 93–96 | A |
| 90–92 | A- |
| 87–89 | B+ |
| 83–86 | B |
| 80–82 | B- |
| 77–79 | C+ |
| 73–76 | C |
| 70–72 | C- |
| 67–69 | D+ |
| 63–66 | D |
| 60–62 | D- |
| 0–59 | F |

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/scoring/score` | Public | Score a single product |
| POST | `/api/v1/scoring/bulk` | Public | Score multiple products |
| POST | `/api/v1/scoring/preview` | Public | Preview score (no persistence) |
| GET | `/api/v1/scoring/current?productId=X` | Public | Get current score from DB |

---

## Database Tables

### product_scores

Stores the current and historical scores for products.

- `overall_score` — weighted overall score (0–100)
- `quality_score` — ingredient quality category score
- `safety_score` — controversial ingredients category score
- `nutrition_score` — nutritional balance category score
- `transparency_score` — transparency category score
- `scoring_version` — algorithm version (e.g., "1.0.0")
- `is_current` — only one score per product is current (partial unique)

### score_history

Append-only audit trail of all score computations.

- Same score columns as `product_scores`
- `triggered_by` — ENUM: manual, scheduled, data_change, import, seed
- `computed_at` — when the score was computed
- `notes` — free-text notes about the scoring run

---

## Future Extensions

### ML Models

The `ScoringStrategy` interface is designed to support ML-based scoring:

```typescript
class MLIngredientQualityStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.IngredientQuality;

  score(input: ProductScoringInput): CategoryScore {
    // Call ML model API
    const prediction = this.mlModel.predict(input);
    return { score: prediction.score, confidence: prediction.confidence, ... };
  }
}
```

### AI Explanations

The `reasoning` field in `CategoryScore` can be populated by AI:

```typescript
score(input: ProductScoringInput): CategoryScore {
  const aiReasoning = await this.aiService.explain(input, this.category);
  return { ...categoryScore, reasoning: aiReasoning };
}
```

### Veterinary Rules

Strategies can incorporate veterinary expertise:

```typescript
class VeterinaryRulesStrategy implements ScoringStrategy {
  readonly category = ScoringCategory.VeterinaryCompliance;

  score(input: ProductScoringInput): CategoryScore {
    // Check against veterinary nutritional guidelines
    const violations = this.checkAAFCO(input);
    const score = 100 - (violations.length * 10);
    return { score, ... };
  }
}
```

### Country-Specific Regulations

Strategies can be country-aware:

```typescript
score(input: ProductScoringInput): CategoryScore {
  const regulations = this.getRegulations(input.brand.countryCode);
  const compliance = this.checkCompliance(input, regulations);
  return { score: compliance.score, ... };
}
```

---

## Configuration

### Changing Weights

Edit `constants/index.ts`:
```typescript
export const DEFAULT_SCORING_WEIGHTS: Record<ScoringCategory, number> = {
  [ScoringCategory.IngredientQuality]: 0.40,  // was 0.35
  ...
};
```

### Adding a New Category

1. Add enum value to `ScoringCategory`
2. Implement `ScoringStrategy` interface
3. Register strategy in `ScoringService` constructor
4. Add weight to `DEFAULT_SCORING_WEIGHTS`
5. Add DB column if persisting (or return in API only)

### Replacing a Strategy

1. Create new class implementing `ScoringStrategy`
2. Replace the old strategy in `ScoringService` constructor
3. No other changes needed — the engine adapts automatically

---

## Performance Considerations

- **Bulk scoring**: Process up to 50 products per request
- **Batch DB writes**: Uses transactions for atomicity
- **Async persistence**: Score computation and persistence are separate steps
- **Caching**: Current scores are cached in `product_scores` table (read without recomputation)
- **Confidence scoring**: Low-confidence scores indicate insufficient data, not poor quality

---

## Testing

Each strategy can be unit-tested in isolation:

```typescript
const strategy = new IngredientQualityStrategy();
const result = strategy.score(mockProductInput);
expect(result.score).toBeGreaterThan(0);
expect(result.confidence).toBeGreaterThan(0);
```

The engine can be integration-tested:

```typescript
const engine = new ScoringEngine([new IngredientQualityStrategy(), ...]);
const result = engine.score(mockProductInput);
expect(result.overallScore).toBeGreaterThanOrEqual(0);
expect(result.overallScore).toBeLessThanOrEqual(100);
expect(result.categories).toHaveLength(7);
```
