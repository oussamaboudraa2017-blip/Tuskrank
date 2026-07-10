-- ============================================================
-- Tuskrank — Production Database Seed Data
-- ------------------------------------------------------------
-- Lookup tables only. No products, brands, or ingredients seeded.
-- All inserts use ON CONFLICT (slug / natural key) DO NOTHING so
-- re-running this file is safe and idempotent.
-- ============================================================

SET client_min_messages = WARNING;

-- ============================================================
-- Pet Types
-- ============================================================
INSERT INTO pet_types (slug, name, description) VALUES
    ('dog',   'Dog',   'Domestic dog (Canis lupus familiaris).'),
    ('cat',   'Cat',   'Domestic cat (Felis catus).'),
    ('rabbit','Rabbit','Domestic rabbit (Oryctolagus cuniculus).'),
    ('bird',  'Bird',  'Companion birds (parakeet, parrot, etc.).'),
    ('small-mammal', 'Small Mammal', 'Hamsters, guinea pigs, gerbils, etc.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Life Stages (per pet type)
-- ============================================================
-- DOG
WITH dog AS (SELECT id FROM pet_types WHERE slug='dog')
INSERT INTO life_stages (pet_type_id, slug, name, sort_order)
SELECT dog.id, ls.slug, ls.name, ls.sort_order
FROM dog
CROSS JOIN (VALUES
    ('puppy',     'Puppy',     10),
    ('junior',    'Junior',    20),
    ('adult',     'Adult',     30),
    ('senior',    'Senior',    40),
    ('geriatric', 'Geriatric', 50)
) AS ls(slug, name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM life_stages WHERE pet_type_id = dog.id AND slug = ls.slug
);

-- CAT
WITH cat AS (SELECT id FROM pet_types WHERE slug='cat')
INSERT INTO life_stages (pet_type_id, slug, name, sort_order)
SELECT cat.id, ls.slug, ls.name, ls.sort_order
FROM cat
CROSS JOIN (VALUES
    ('kitten',    'Kitten',    10),
    ('junior',    'Junior',    20),
    ('adult',     'Adult',     30),
    ('senior',    'Senior',    40),
    ('geriatric', 'Geriatric', 50)
) AS ls(slug, name, sort_order)
WHERE NOT EXISTS (
    SELECT 1 FROM life_stages WHERE pet_type_id = cat.id AND slug = ls.slug
);

-- ============================================================
-- Breed Sizes
-- ============================================================
WITH dog AS (SELECT id FROM pet_types WHERE slug='dog')
INSERT INTO breed_sizes (pet_type_id, slug, name, min_weight_kg, max_weight_kg)
SELECT dog.id, bs.slug, bs.name, bs.min_kg, bs.max_kg
FROM dog
CROSS JOIN (VALUES
    ('toy',    'Toy Breed',     1.0,  6.0),
    ('small',  'Small Breed',   6.0,  11.0),
    ('medium', 'Medium Breed', 11.0,  25.0),
    ('large',  'Large Breed',  25.0,  45.0),
    ('giant',  'Giant Breed',  45.0,  90.0)
) AS bs(slug, name, min_kg, max_kg)
WHERE NOT EXISTS (
    SELECT 1 FROM breed_sizes WHERE pet_type_id = dog.id AND slug = bs.slug
);

-- ============================================================
-- Food Forms
-- ============================================================
INSERT INTO food_forms (slug, name) VALUES
    ('kibble',         'Kibble'),
    ('wet',            'Wet Food'),
    ('raw',            'Raw'),
    ('freeze-dried',   'Freeze-Dried'),
    ('dehydrated',     'Dehydrated'),
    ('soft',           'Soft'),
    ('topper',         'Topper'),
    ('mixer',          'Mixer'),
    ('treat',          'Treat'),
    ('supplement',     'Supplement')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Protein Sources
-- ============================================================
INSERT INTO protein_sources (slug, name, origin) VALUES
    ('chicken',     'Chicken',     'animal'),
    ('beef',        'Beef',        'animal'),
    ('lamb',        'Lamb',        'animal'),
    ('salmon',      'Salmon',      'animal'),
    ('tuna',        'Tuna',        'animal'),
    ('turkey',      'Turkey',      'animal'),
    ('duck',        'Duck',        'animal'),
    ('rabbit',      'Rabbit',      'animal'),
    ('venison',     'Venison',     'animal'),
    ('white-fish',  'White Fish',  'animal'),
    ('egg',         'Egg',         'animal'),
    ('pea',         'Pea',         'plant'),
    ('lentil',      'Lentil',      'plant'),
    ('soy',         'Soy',         'plant'),
    ('insect',      'Insect',      'insect'),
    ('plant',       'Plant',       'plant')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Ingredient Categories (with one-level parent nesting)
-- ============================================================
INSERT INTO ingredient_categories (slug, name, description, sort_order) VALUES
    ('animal-protein', 'Animal Protein',   'Proteins derived from animal tissue.',         10),
    ('plant-protein',  'Plant Protein',    'Proteins derived from plants (pea, lentil, soy).', 20),
    ('fat-and-oil',    'Fat and Oil',      'Animal fats and plant oils.',                 30),
    ('carbohydrate',   'Carbohydrate',     'Cereals, grains, tubers, starches.',         40),
    ('fiber',          'Fiber',            'Sources of dietary fiber.',                  50),
    ('fruit',          'Fruit',            'Whole fruits and fruit derivatives.',        60),
    ('vegetable',      'Vegetable',        'Whole vegetables and derivatives.',          70),
    ('additive',       'Additive',         'Vitamins, minerals, preservatives, palatants.', 80),
    ('contested',      'Contested',        'Ingredients with safety or quality concerns.', 90),
    ('other',          'Other',            'Uncategorized or mixed ingredients.',       100)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Claims (marketing / nutritional)
-- ============================================================
INSERT INTO claims (slug, name, description) VALUES
    ('grain-free',           'Grain Free',           'Formulated without grains (wheat, corn, etc.).'),
    ('limited-ingredient',   'Limited Ingredient',   'Contains a reduced number of ingredients.'),
    ('hypoallergenic',       'Hypoallergenic',       'Designed to reduce the risk of allergic reactions.'),
    ('organic',              'Organic',              'Made from organically produced ingredients.'),
    ('non-gmo',              'Non-GMO',              'No genetically modified ingredients.'),
    ('high-protein',         'High Protein',         'Formulated with elevated protein content.'),
    ('low-fat',              'Low Fat',              'Formulated with reduced fat content.'),
    ('prescription',         'Prescription',         'Therapeutic diet (veterinary supervision).'),
    ('raw',                  'Raw',                  'Uncooked, minimally processed.'),
    ('freeze-dried',         'Freeze Dried',         'Freeze-dehydrated product.'),
    ('holistic',             'Holistic',             'Marketed as a whole-body formulation.'),
    ('natural',              'Natural',              'Marketed as containing natural ingredients.')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Tags
-- ============================================================
INSERT INTO tags (slug, name) VALUES
    ('new',                'New'),
    ('staff-pick',         'Staff Pick'),
    ('puppy',              'Puppy'),
    ('kitten',             'Kitten'),
    ('adult',              'Adult'),
    ('senior',             'Senior'),
    ('weight-management',  'Weight Management'),
    ('sensitive-stomach',  'Sensitive Stomach'),
    ('hairball-control',   'Hairball Control'),
    ('skin-and-coat',      'Skin and Coat'),
    ('dental',             'Dental'),
    ('joint',              'Joint Health'),
    ('low-glycemic',       'Low Glycemic'),
    ('no-byproduct',       'No By-Product')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Relation Types (used by related_products)
-- ============================================================
INSERT INTO relation_types (slug, name, description, is_directed) VALUES
    ('flavor-variant',   'Flavor Variant',    'Same product, different flavor.',             false),
    ('size-variant',     'Size Variant',      'Same product, different package size.',       false),
    ('same-brand',       'Same Brand',        'Other products by the same brand.',           false),
    ('similar-profile',  'Similar Profile',   'Similar nutritional profile or category.',    false),
    ('substitute',       'Substitute',        'Recommended substitute (directed).',          true),
    ('complement',       'Complement',        'Pairs well with this product (directed).',    true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- End of seed file
-- ============================================================
