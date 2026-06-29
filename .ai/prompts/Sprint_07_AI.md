# Sprint 07 — AI-Powered Analysis

## Objective

Integrate LLM capabilities to provide AI-generated product analysis, ingredient explanations, and conversational Q&A for pet food intelligence.

## Prerequisites

- Sprint 02 completed (backend API).
- Sprint 05 completed (frontend pages with placeholder sections).
- OpenAI (or compatible LLM) API key configured.

## Scope

### Product Analysis
- Generate AI analysis for each product covering:
  - Overall assessment and key takeaways.
  - Notable ingredients (positive and concerning).
  - Nutritional evaluation.
  - Recommendation summary.
- Cache generated analyses in `product_analyses` table.
- Manual trigger and bulk generation via admin.

### Ingredient Explanations
- Generate AI explanation for each ingredient covering:
  - What the ingredient is and its nutritional function.
  - Common quality tiers and how to evaluate.
  - Known safety concerns or controversies.
  - Which pet types it is suitable for.
- Cache in `ingredient_analyses` table.

### Conversational Q&A
- Chat interface on product pages ("Ask about this product").
- Chat interface on ingredient pages ("Ask about this ingredient").
- Context-aware responses citing specific product/ingredient data.
- Rate limiting on chat endpoints.
- Session-based conversation history (not persisted long-term).

### AI Integration Layer
- NestJS service for LLM API communication.
- Prompt templates for consistent output.
- Response validation and sanitization.
- Fallback behavior when LLM is unavailable.
- Token usage tracking and cost monitoring.

### Caching Strategy
- Cache AI responses in database.
- Cache invalidation on product/ingredient data changes.
- TTL-based cache for Q&A responses.

## Completion Criteria
- Product pages display AI-generated analysis.
- Ingredient pages display AI-generated explanations.
- Q&A chat works with context-aware responses.
- Cached responses load instantly on subsequent visits.
- AI costs are monitored and within budget.