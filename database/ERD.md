# Tuskrank — ER Diagram

> Generated for the post-Sprint-1.x.2 production database.
> Includes all 39 tables, 8 ENUMs, partial-unique indexes, and cascade policy.
> Render with any Markdown viewer that supports Mermaid (GitHub, VS Code, Obsidian).

```mermaid
erDiagram

    %% ============================================================
    %% EXTENSIONS (declared in schema.sql)
    %% ============================================================

    %% pgcrypto | pg_trgm | citext
    %% plus the 8 user-defined enums:
    %%   protein_origin, nutrient_bound, seo_page_kind,
    %%   recall_severity, recall_status, nutrition_source,
    %%   score_history_trigger, actor_type_t, evidence_type_t

    %% ============================================================
    %% SECTION 1 — LOOKUP TABLES (no FKs into anything else)
    %% ============================================================

    pet_types {
        uuid id PK
        text slug UK
        text name
        text description
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    life_stages {
        uuid id PK
        uuid pet_type_id FK
        text slug
        text name
        int sort_order
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    breed_sizes {
        uuid id PK
        uuid pet_type_id FK
        text slug
        text name
        numeric min_weight_kg
        numeric max_weight_kg
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    food_forms {
        uuid id PK
        text slug UK
        text name
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    protein_sources {
        uuid id PK
        text slug UK
        text name
        protein_origin origin
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    ingredient_categories {
        uuid id PK
        text slug UK
        text name
        text description
        uuid parent_id FK
        int sort_order
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    categories {
        uuid id PK
        uuid pet_type_id FK
        text slug
        text name
        text description
        uuid parent_id FK
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    claims {
        uuid id PK
        text slug UK
        text name
        text description
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    tags {
        uuid id PK
        text slug UK
        text name
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    nutrients {
        uuid id PK
        text slug UK
        text name
        text symbol
        text unit
        text description
        boolean is_guaranteed
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    certifications {
        uuid id PK
        text slug UK
        text name
        text description
        text issuer
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    relation_types {
        uuid id PK
        text slug UK
        text name
        text description
        boolean is_directed
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 2 — CORE: BRANDS / PRODUCTS / INGREDIENTS
    %% ============================================================

    brands {
        uuid id PK
        text name
        text slug UK
        text manufacturer
        char country_code
        text website_url
        text description
        text logo_image_url
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    ingredients {
        uuid id PK
        text name
        text slug UK
        text inci_name
        uuid category_id FK
        citext canonical_name
        text description
        boolean is_animal_derived
        boolean is_common_allergen
        boolean is_controversial
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    products {
        uuid id PK
        uuid brand_id FK
        text name
        text slug
        text description
        text upc
        text sku
        numeric package_size_grams
        text package_size_label
        uuid food_form_id FK
        uuid primary_protein_source_id FK
        boolean is_active
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    product_ingredients {
        uuid id PK
        uuid product_id FK
        uuid ingredient_id FK
        int position
        text raw_label
        boolean is_primary
        numeric percentage_value
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 3 — PRODUCT INFORMATION EXTENSIONS
    %% ============================================================

    product_targeting {
        uuid id PK
        uuid product_id FK
        uuid pet_type_id FK
        uuid life_stage_id FK
        uuid breed_size_id FK
        uuid category_id FK
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    product_images {
        uuid id PK
        uuid product_id FK
        text storage_path
        text public_url
        text alt_text
        int width_px
        int height_px
        bigint bytes
        text mime_type
        int sort_order
        boolean is_primary
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    nutrition_profiles {
        uuid id PK
        uuid product_id FK
        numeric kcal_per_100g
        numeric kcal_per_cup
        numeric moisture_pct
        date effective_from
        date effective_to
        nutrition_source source
        text notes
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    product_nutrients {
        uuid id PK
        uuid product_id FK
        uuid nutrient_id FK
        uuid nutrition_profile_id FK
        numeric amount
        text unit
        nutrient_bound bound
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    product_claims {
        uuid id PK
        uuid product_id FK
        uuid claim_id FK
        text evidence_note
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    product_tags {
        uuid id PK
        uuid product_id FK
        uuid tag_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 4 — SCORING
    %% ============================================================

    ingredient_scores {
        uuid id PK
        uuid ingredient_id FK
        numeric score
        text grade
        text reasoning
        text scoring_version
        boolean is_current
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    product_scores {
        uuid id PK
        uuid product_id FK
        numeric overall_score
        numeric quality_score
        numeric safety_score
        numeric nutrition_score
        numeric transparency_score
        text scoring_version
        boolean is_current
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    score_history {
        uuid id PK
        uuid product_id FK
        numeric overall_score
        numeric quality_score
        numeric safety_score
        numeric nutrition_score
        numeric transparency_score
        text scoring_version
        timestamptz computed_at
        score_history_trigger triggered_by
        text notes
        timestamptz created_at
    }

    %% ============================================================
    %% SECTION 5 — SCIENCE / CITATIONS
    %% ============================================================

    scientific_references {
        uuid id PK
        text title
        text authors
        text publication
        int published_year
        text doi
        text url
        text summary
        text citation_key UK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    ingredient_references {
        uuid id PK
        uuid ingredient_id FK
        uuid reference_id FK
        evidence_type_t evidence_type
        numeric relevance_score
        text notes
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 6 — TRUST
    %% ============================================================

    recalls {
        uuid id PK
        uuid brand_id FK
        uuid product_id FK
        text title
        text description
        date announced_on
        date resolved_on
        recall_severity severity
        recall_status status
        text source_label
        text source_url
        text case_number
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    brand_certifications {
        uuid id PK
        uuid brand_id FK
        uuid certification_id FK
        date issued_on
        date expires_on
        text certificate_url
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    transparency_reports {
        uuid id PK
        uuid brand_id FK
        int reporting_year
        text title
        text summary
        text url
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 7 — SEARCH
    %% ============================================================

    search_keywords {
        uuid id PK
        citext normalized
        text raw
        text entity_type
        uuid entity_id
        text locale
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    search_synonyms {
        uuid id PK
        citext canonical
        citext synonym
        text locale
        text entity_type
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    popular_searches {
        uuid id PK
        citext normalized
        timestamptz window_start
        timestamptz window_end
        bigint count
        text locale
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    search_logs {
        uuid id PK
        timestamptz took_at
        uuid user_id
        text session_id
        text normalized
        text raw
        int result_count
        int latency_ms
        text_array entity_types
        text request_id
        inet ip_address
        text user_agent
    }

    %% ============================================================
    %% SECTION 8 — RECOMMENDATIONS
    %% ============================================================

    product_alternatives {
        uuid id PK
        uuid product_id FK
        uuid alternative_product_id FK
        numeric score_delta
        text reasoning
        text scoring_version
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    related_products {
        uuid id PK
        uuid product_id FK
        uuid related_product_id FK
        uuid relation_type_id FK
        numeric weight
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 9 — SEO
    %% ============================================================

    seo_pages {
        uuid id PK
        seo_page_kind kind
        text slug
        uuid entity_id
        text title
        text meta_title
        text meta_description
        text canonical_url UK
        text robots
        text language
        jsonb structured_data
        timestamptz last_rendered_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    faq_items {
        uuid id PK
        uuid page_id FK
        text question
        text answer
        int sort_order
        text language
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    %% ============================================================
    %% SECTION 10 — SYSTEM / AUDIT
    %% ============================================================

    audit_logs {
        uuid id PK
        timestamptz occurred_at
        uuid actor_id
        actor_type_t actor_type
        text entity_type
        uuid entity_id
        text action
        jsonb before
        jsonb after
        jsonb diff
        text request_id
        inet ip_address
        text user_agent
    }

    %% ============================================================
    %% RELATIONSHIPS (labeled with ON DELETE behavior)
    %% ============================================================

    %% --- Lookup self-refs ---
    pet_types            ||--o{ life_stages           : "RESTRICT"
    pet_types            ||--o{ breed_sizes           : "RESTRICT"
    pet_types            ||--o{ categories            : "RESTRICT"
    pet_types            ||--o{ product_targeting     : "RESTRICT"
    life_stages          ||--o{ product_targeting     : "RESTRICT"
    breed_sizes          ||--o{ product_targeting     : "RESTRICT"
    categories           ||--o{ categories           : "SET NULL (self)"
    categories           ||--o{ product_targeting     : "RESTRICT"
    ingredient_categories ||--o{ ingredient_categories : "SET NULL (self)"
    ingredient_categories ||--o{ ingredients         : "RESTRICT"

    %% --- Core brand / product / ingredient ---
    brands                ||--o{ products             : "RESTRICT"
    food_forms            ||--o{ products             : "RESTRICT"
    protein_sources       ||--o{ products             : "RESTRICT"
    products              ||--o{ product_ingredients  : "CASCADE"
    ingredients           ||--o{ product_ingredients  : "RESTRICT"

    %% --- Product extensions ---
    products              ||--o{ product_targeting    : "CASCADE"
    products              ||--o{ product_images       : "CASCADE"
    products              ||--o{ product_claims       : "CASCADE"
    products              ||--o{ product_tags         : "CASCADE"
    claims                ||--o{ product_claims       : "RESTRICT"
    tags                  ||--o{ product_tags         : "RESTRICT"

    %% --- Nutrition ---
    products              ||--o{ nutrition_profiles   : "CASCADE"
    nutrition_profiles    ||--o{ product_nutrients    : "CASCADE"
    nutrients             ||--o{ product_nutrients    : "RESTRICT"
    products              ||--o{ product_nutrients    : "CASCADE"

    %% --- Scoring ---
    ingredients           ||--o{ ingredient_scores    : "CASCADE"
    products              ||--o{ product_scores       : "CASCADE"
    products              ||--o{ score_history        : "CASCADE"

    %% --- Science ---
    scientific_references ||--o{ ingredient_references : "CASCADE"
    ingredients           ||--o{ ingredient_references : "CASCADE"

    %% --- Trust ---
    brands                ||--o{ recalls              : "SET NULL"
    products              ||--o{ recalls              : "SET NULL"
    brands                ||--o{ brand_certifications : "CASCADE"
    certifications        ||--o{ brand_certifications : "CASCADE"
    brands                ||--o{ transparency_reports : "CASCADE"

    %% --- Recommendations ---
    products              ||--o{ product_alternatives : "CASCADE (source)"
    products              ||--o{ product_alternatives : "CASCADE (alt)"
    products              ||--o{ related_products     : "CASCADE (source)"
    products              ||--o{ related_products     : "CASCADE (target)"
    relation_types        ||--o{ related_products     : "RESTRICT"

    %% --- SEO ---
    seo_pages             ||--o{ faq_items            : "CASCADE"

    %% --- Logical views (no FK by design; computed) ---
    brands                ||..o{ search_keywords      : "logical: entity_type='brand'"
    products              ||..o{ search_keywords      : "logical: entity_type='product'"
    ingredients           ||..o{ search_keywords      : "logical: entity_type='ingredient'"
    products              ||..o{ product_ingredients  : "triggers raw_label keywords"
```
