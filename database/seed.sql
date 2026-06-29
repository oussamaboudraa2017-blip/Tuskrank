-- ============================================================
-- Tuskrank Database Seed Data
-- Lookup tables only. No products, ingredients, or brands.
-- PostgreSQL 16 / Supabase Compatible
-- ============================================================

BEGIN;

-- ============================================================
-- PET TYPES
-- ============================================================

INSERT INTO pet_types (name, slug, plural_name, description, sort_order) VALUES
    ('Dog', 'dog', 'Dogs', 'Canine companions — the most common pet type in the United States.', 1),
    ('Cat', 'cat', 'Cats', 'Feline companions — the second most popular pet in US households.', 2),
    ('Bird', 'bird', 'Birds', 'Pet birds including parrots, canaries, finches, and other avian species.', 3),
    ('Fish', 'fish', 'Fish', 'Freshwater and saltwater aquarium fish.', 4),
    ('Small Animal', 'small-animal', 'Small Animals', 'Rabbits, hamsters, guinea pigs, gerbils, and other small mammals.', 5),
    ('Reptile', 'reptile', 'Reptiles', 'Lizards, snakes, turtles, and other reptilian pets.', 6);

-- ============================================================
-- LIFE STAGES
-- ============================================================

-- Dog life stages
INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'Puppy', 'puppy', id, 'Growth and development phase for young dogs requiring higher protein and calorie density.', 0, 12, 1 FROM pet_types WHERE slug = 'dog';

INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'Adult', 'adult', id, 'Maintenance phase for fully grown adult dogs with standard nutritional requirements.', 13, 84, 2 FROM pet_types WHERE slug = 'dog';

INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'Senior', 'senior', id, 'Older dogs requiring adjusted nutrition for joint health, digestion, and weight management.', 85, NULL, 3 FROM pet_types WHERE slug = 'dog';

INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'All Life Stages', 'all-life-stages', id, 'Formulated to meet nutritional requirements for dogs at any age, per AAFCO guidelines.', NULL, NULL, 4 FROM pet_types WHERE slug = 'dog';

-- Cat life stages
INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'Kitten', 'kitten', id, 'Growth phase for young cats requiring higher protein, fat, and calorie density.', 0, 12, 1 FROM pet_types WHERE slug = 'cat';

INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'Adult', 'adult', id, 'Maintenance phase for fully grown adult cats.', 13, 120, 2 FROM pet_types WHERE slug = 'cat';

INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'Senior', 'senior', id, 'Older cats with adjusted needs for kidney support, joint health, and weight management.', 121, NULL, 3 FROM pet_types WHERE slug = 'cat';

INSERT INTO life_stages (name, slug, pet_type_id, description, min_age_months, max_age_months, sort_order)
SELECT 'All Life Stages', 'all-life-stages', id, 'Formulated to meet AAFCO nutritional profiles for cats at any age.', NULL, NULL, 4 FROM pet_types WHERE slug = 'cat';

-- ============================================================
-- FOOD FORMS
-- ============================================================

INSERT INTO food_forms (name, slug, description, sort_order) VALUES
    ('Dry Kibble', 'dry-kibble', 'Extruded dry food with low moisture content (typically 8-12%). The most common form of pet food. Long shelf life and cost-effective.', 1),
    ('Wet Canned', 'wet-canned', 'Moist food in metal cans with high moisture content (typically 70-85%). Higher palatability and hydration benefits.', 2),
    ('Wet Pouch', 'wet-pouch', 'Moist food in flexible pouch packaging. Similar nutritional profile to canned food with convenient single-serve portions.', 3),
    ('Semi-Moist', 'semi-moist', 'Soft, chewy food with moderate moisture content (typically 25-35%). Often contains more sugar and preservatives.', 4),
    ('Raw Frozen', 'raw-frozen', 'Uncooked meat, bone, and organ mixture sold frozen. Requires careful handling to prevent bacterial contamination.', 5),
    ('Raw Freeze-Dried', 'raw-freeze-dried', 'Raw ingredients that have been freeze-dried to remove moisture while preserving nutrients. Rehydrate before serving.', 6),
    ('Dehydrated', 'dehydrated', 'Ingredients dried at low temperatures to preserve nutrients. Typically requires rehydration with warm water before serving.', 7),
    ('Fresh Refrigerated', 'fresh-refrigerated', 'Gently cooked food made with fresh ingredients. Requires refrigeration and has a shorter shelf life.', 8),
    ('Treat', 'treat', 'Supplemental food items given as rewards or snacks. Not intended as a complete diet replacement.', 9),
    ('Supplement', 'supplement', 'Nutritional additives including vitamins, minerals, probiotics, and joint support compounds.', 10),
    ('Topper', 'topper', 'Supplemental food mixed with a pet''s regular meals to enhance palatability or add nutritional variety.', 11),
    ('Mixer', 'mixer', 'Base food meant to be combined with other food items to create a complete meal.', 12);

-- ============================================================
-- PROTEIN SOURCES
-- ============================================================

INSERT INTO protein_sources (name, slug, category, description, is_common_allergen, sort_order) VALUES
    ('Chicken', 'chicken', 'chicken', 'The most common animal protein in US pet foods. Widely available and highly digestible.', true, 1),
    ('Turkey', 'turkey', 'turkey', 'Lean poultry protein often used as an alternative to chicken for dogs with sensitivities.', true, 2),
    ('Beef', 'beef', 'beef', 'Rich red meat protein with high iron and B-vitamin content. A common allergen for some dogs.', true, 3),
    ('Lamb', 'lamb', 'lamb', 'Red meat protein traditionally used in limited-ingredient diets for dogs with food sensitivities.', false, 4),
    ('Pork', 'pork', 'pork', 'Protein source used in some pet foods. Less common than chicken or beef.', false, 5),
    ('Fish', 'fish', 'fish', 'General fish protein, often whitefish or pollock. Rich in omega-3 fatty acids.', false, 6),
    ('Salmon', 'salmon', 'salmon', 'Fatty fish protein high in omega-3 fatty acids (EPA and DHA). Beneficial for skin, coat, and joint health.', false, 7),
    ('Duck', 'duck', 'duck', 'Novel protein source often recommended for dogs with allergies to common proteins.', false, 8),
    ('Venison', 'venison', 'venison', 'Wild game protein with low fat content. Commonly used in limited-ingredient and hypoallergenic diets.', false, 9),
    ('Rabbit', 'rabbit', 'rabbit', 'Novel protein with high digestibility. Used in elimination diets and for pets with multiple protein allergies.', false, 10),
    ('Bison', 'bison', 'bison', 'Lean red meat protein with a nutrient profile similar to beef but generally lower in fat.', false, 11),
    ('Wild Boar', 'boar', 'boar', 'Game meat protein with a distinct flavor profile. Used in premium and specialty pet foods.', false, 12),
    ('Plant-Based', 'plant-based', 'plant_based', 'Protein derived from legumes, grains, or soy. Used in vegan/vegetarian formulas or as supplemental protein.', false, 13),
    ('Insect', 'insect', 'insect', 'Protein derived from insects (typically black soldier fly larvae). Emerging sustainable alternative protein source.', false, 14),
    ('Mixed', 'mixed', 'mixed', 'Products combining multiple primary protein sources.', false, 15),
    ('Other', 'other', 'other', 'Protein sources not classified above (e.g., ostrich, kangaroo, alligator).', false, 16);

-- ============================================================
-- INGREDIENT CATEGORIES
-- ============================================================

-- Top-level categories
INSERT INTO ingredient_categories (name, slug, description, sort_order) VALUES
    ('Animal Protein', 'animal-protein', 'Whole meats, meat meals, and by-products derived from animal sources. Primary protein building blocks.', 1),
    ('Plant Protein', 'plant-protein', 'Protein sources derived from legumes, grains, seeds, and other plant materials.', 2),
    ('Grains & Carbohydrates', 'grains-carbohydrates', 'Cereal grains, starches, and carbohydrate-rich ingredients providing energy and structure.', 3),
    ('Fats & Oils', 'fats-oils', 'Animal fats, plant oils, and other lipid sources providing essential fatty acids and energy.', 4),
    ('Fruits & Vegetables', 'fruits-vegetables', 'Whole fruits, vegetables, and their derivatives providing vitamins, minerals, and fiber.', 5),
    ('Vitamins & Minerals', 'vitamins-minerals', 'Added vitamin and mineral supplements to ensure complete and balanced nutrition.', 6),
    ('Preservatives', 'preservatives', 'Natural and artificial preservatives that extend shelf life and prevent spoilage.', 7),
    ('Flavors & Enhancers', 'flavors-enhancers', 'Natural and artificial flavors, sweeteners, and palatability enhancers.', 8),
    ('Additives & Supplements', 'additives-supplements', 'Probiotics, prebiotics, enzymes, joint supplements, and other functional additives.', 9),
    ('Binders & Thickeners', 'binders-thickeners', 'Ingredients that provide texture, structure, and moisture retention in processed pet foods.', 10),
    ('Colorants', 'colorants', 'Natural and artificial colorants added for visual appeal.', 11),
    ('By-Products', 'by-products', 'Animal by-product meals and rendered ingredients from processing.', 12);

-- Sub-categories
INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Whole Meat', 'whole-meat', id, 'Fresh, frozen, or dehydrated whole muscle meat.', 1
FROM ingredient_categories WHERE slug = 'animal-protein';

INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Meat Meal', 'meat-meal', id, 'Concentrated rendered meat protein with moisture and fat removed.', 2
FROM ingredient_categories WHERE slug = 'animal-protein';

INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Legumes', 'legumes', id, 'Peas, lentils, chickpeas, beans, and other leguminous plants.', 1
FROM ingredient_categories WHERE slug = 'plant-protein';

INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Whole Grains', 'whole-grains', id, 'Brown rice, oatmeal, barley, quinoa, and other intact grains.', 1
FROM ingredient_categories WHERE slug = 'grains-carbohydrates';

INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Refined Grains', 'refined-grains', id, 'White rice, corn meal, wheat flour, and other processed grain products.', 2
FROM ingredient_categories WHERE slug = 'grains-carbohydrates';

INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Animal Fats', 'animal-fats', id, 'Chicken fat, salmon oil, and other fats derived from animal sources.', 1
FROM ingredient_categories WHERE slug = 'fats-oils';

INSERT INTO ingredient_categories (name, slug, parent_id, description, sort_order)
SELECT 'Plant Oils', 'plant-oils', id, 'Coconut oil, sunflower oil, canola oil, flaxseed oil, and other plant-derived oils.', 2
FROM ingredient_categories WHERE slug = 'fats-oils';

-- ============================================================
-- CLAIMS
-- ============================================================

INSERT INTO claims (name, slug, claim_type, description) VALUES
    ('AAFCO Complete and Balanced', 'aafco-complete-and-balanced', 'nutritional_adequacy', 'Product meets AAFCO nutritional adequacy standards for the specified life stage.'),
    ('AAFCO Formulated to Meet', 'aafco-formulated-to-meet', 'nutritional_adequacy', 'Product is formulated to meet AAFCO nutrient profiles without animal feeding trials.'),
    ('AAFCO Animal Feeding Tests', 'aafco-animal-feeding-tests', 'nutritional_adequacy', 'Product has undergone AAFCO animal feeding trials to prove nutritional adequacy.'),
    ('Grain-Free', 'grain-free', 'dietary', 'Contains no grains (wheat, corn, rice, barley, oats, etc.). May use potato, peas, or lentils as carbohydrate sources.'),
    ('Limited Ingredient', 'limited-ingredient', 'dietary', 'Made with a reduced number of ingredients to minimize potential allergens.'),
    ('Gluten-Free', 'gluten-free', 'dietary', 'Does not contain gluten from wheat, barley, rye, or related grains.'),
    ('High Protein', 'high-protein', 'nutritional_adequacy', 'Contains higher protein content than typical formulas, often 30%+ for dry food.'),
    ('Low Fat', 'low-fat', 'nutritional_adequacy', 'Formulated with reduced fat content for weight management or pancreatic conditions.'),
    ('Weight Management', 'weight-management', 'health_benefit', 'Designed to support healthy weight loss or maintenance in overweight pets.'),
    ('Sensitive Stomach', 'sensitive-stomach', 'health_benefit', 'Formulated with easily digestible ingredients for pets with gastrointestinal sensitivity.'),
    ('Skin & Coat Health', 'skin-and-coat-health', 'health_benefit', 'Contains omega-3 and omega-6 fatty acids to support skin and coat health.'),
    ('Joint Health', 'joint-health', 'health_benefit', 'Contains glucosamine, chondroitin, or other joint-supporting compounds.'),
    ('Dental Health', 'dental-health', 'health_benefit', 'Designed to reduce plaque and tartar accumulation through texture, size, or added ingredients.'),
    ('Puppy Formula', 'puppy-formula', 'life_stage', 'Formulated to meet the nutritional needs of growing puppies (AAFCO growth pattern).'),
    ('Kitten Formula', 'kitten-formula', 'life_stage', 'Formulated to meet the nutritional needs of growing kittens (AAFCO growth pattern).'),
    ('Senior Formula', 'senior-formula', 'life_stage', 'Formulated for the nutritional needs of aging pets with adjusted protein, fat, and calorie levels.'),
    ('Breed Specific', 'breed-specific', 'breed_size', 'Designed for a specific breed or breed size with tailored nutrient profiles.'),
    ('All Natural', 'all-natural', 'manufacturing', 'Made with natural ingredients without artificial colors, flavors, or preservatives.'),
    ('Human Grade', 'human-grade', 'manufacturing', 'Made with ingredients and in facilities that meet human food safety standards.'),
    ('Made in USA', 'made-in-usa', 'manufacturing', 'Manufactured in the United States with US-sourced ingredients.'),
    ('Vet Recommended', 'vet-recommended', 'marketing', 'Marketed as recommended by veterinarians (self-reported claim).'),
    ('No Artificial Preservatives', 'no-artificial-preservatives', 'manufacturing', 'Does not contain BHA, BHT, ethoxyquin, or other synthetic preservatives.'),
    ('No By-Products', 'no-by-products', 'manufacturing', 'Does not contain animal by-product meals or rendered by-products.'),
    ('Organic', 'organic', 'certification', 'Contains USDA-certified organic ingredients.'),
    ('Non-GMO', 'non-gmo', 'certification', 'Made without genetically modified organisms.');

-- ============================================================
-- TAGS
-- ============================================================

INSERT INTO tags (name, slug, description) VALUES
    ('Best Seller', 'best-seller', 'High-volume products with strong market demand.'),
    ('Editor''s Choice', 'editors-choice', 'Products recommended by the Tuskrank editorial team.'),
    ('Budget Friendly', 'budget-friendly', 'Products offering good nutritional value at a lower price point.'),
    ('Premium', 'premium', 'Products using high-quality ingredients with transparent sourcing.'),
    ('New Arrival', 'new-arrival', 'Recently added products to the database.'),
    ('Vet Recommended', 'vet-recommended', 'Products frequently recommended by veterinary professionals.'),
    ('Hypoallergenic', 'hypoallergenic', 'Formulated to minimize allergic reactions in sensitive pets.'),
    ('Grain-Free', 'grain-free', 'Products that contain no grains.'),
    ('Limited Ingredient', 'limited-ingredient', 'Products with a minimal number of ingredients.'),
    ('High Protein', 'high-protein', 'Products with above-average protein content.'),
    ('Raw Diet', 'raw-diet', 'Raw, freeze-dried, or dehydrated raw food products.'),
    ('Organic', 'organic', 'Products containing USDA-certified organic ingredients.'),
    ('Made in USA', 'made-in-usa', 'Products manufactured in the United States.'),
    ('Recall History', 'recall-history', 'Products or brands with one or more past recalls.'),
    ('Top Rated', 'top-rated', 'Products with an overall score of 80+ (grade B or above).');

-- ============================================================
-- BREED SIZES
-- ============================================================

INSERT INTO breed_sizes (name, slug, weight_min_lbs, weight_max_lbs, description, sort_order) VALUES
    ('Toy', 'toy', 0.00, 12.00, 'Breeds under 12 lbs (e.g., Chihuahua, Pomeranian, Yorkshire Terrier). Requires small kibble size and calorie-dense formulas.', 1),
    ('Small', 'small', 12.01, 25.00, 'Breeds 12-25 lbs (e.g., Beagle, French Bulldog, Dachshund). Moderate calorie needs with smaller kibble.', 2),
    ('Medium', 'medium', 25.01, 60.00, 'Breeds 25-60 lbs (e.g., Australian Shepherd, Border Collie, Cocker Spaniel). Standard nutritional requirements.', 3),
    ('Large', 'large', 60.01, 100.00, 'Breeds 60-100 lbs (e.g., Golden Retriever, German Shepherd, Labrador). Requires joint support and controlled growth.', 4),
    ('Giant', 'giant', 100.01, NULL, 'Breeds over 100 lbs (e.g., Great Dane, Mastiff, Saint Bernard). Requires large kibble, joint support, and controlled calcium/phosphorus.', 5);

-- ============================================================
-- NUTRIENTS
-- ============================================================

INSERT INTO nutrients (name, slug, unit, description, is_guaranteed, sort_order) VALUES
    ('Crude Protein', 'crude-protein', '%', 'Minimum percentage of crude protein. Essential for muscle growth, repair, and immune function.', true, 1),
    ('Crude Fat', 'crude-fat', '%', 'Minimum percentage of crude fat. Provides essential fatty acids and energy.', true, 2),
    ('Crude Fiber', 'crude-fiber', '%', 'Maximum percentage of crude fiber. Supports healthy digestion.', true, 3),
    ('Moisture', 'moisture', '%', 'Maximum moisture content. Varies significantly between dry and wet food.', true, 4),
    ('Linoleic Acid', 'linoleic-acid', '%', 'Minimum omega-6 fatty acid. Essential for skin and coat health.', true, 5),
    ('Omega-3 Fatty Acids', 'omega-3-fatty-acids', '%', 'Minimum omega-3 fatty acids (EPA + DHA). Anti-inflammatory and supports brain, skin, and joint health.', false, 6),
    ('Omega-6 Fatty Acids', 'omega-6-fatty-acids', '%', 'Minimum omega-6 fatty acids. Supports skin barrier and coat condition.', false, 7),
    ('Calcium', 'calcium', '%', 'Minimum calcium. Essential for bone and teeth development.', true, 8),
    ('Phosphorus', 'phosphorus', '%', 'Minimum phosphorus. Works with calcium for bone health.', true, 9),
    ('Vitamin A', 'vitamin-a', 'IU/kg', 'Minimum vitamin A. Supports vision, immune function, and skin health.', true, 10),
    ('Vitamin E', 'vitamin-e', 'IU/kg', 'Minimum vitamin E. Antioxidant that supports immune function and skin health.', true, 11),
    ('Vitamin D3', 'vitamin-d3', 'IU/kg', 'Minimum vitamin D3. Essential for calcium absorption and bone metabolism.', false, 12),
    ('Vitamin B12', 'vitamin-b12', 'mg/kg', 'Minimum vitamin B12. Essential for nervous system function and red blood cell formation.', false, 13),
    ('Iron', 'iron', 'mg/kg', 'Minimum iron. Component of hemoglobin for oxygen transport.', false, 14),
    ('Zinc', 'zinc', 'mg/kg', 'Minimum zinc. Supports immune function, skin health, and wound healing.', false, 15),
    ('Selenium', 'selenium', 'mg/kg', 'Minimum selenium. Antioxidant that works with vitamin E.', false, 16),
    ('Copper', 'copper', 'mg/kg', 'Minimum copper. Essential for iron metabolism and connective tissue formation.', false, 17),
    ('Ash', 'ash', '%', 'Maximum ash content. Represents mineral content after combustion. Lower values indicate higher quality ingredients.', false, 18),
    ('Taurine', 'taurine', '%', 'Minimum taurine. Essential amino acid for cats; important for heart health in dogs.', false, 19),
    ('L-Carnitine', 'l-carnitine', 'mg/kg', 'Minimum L-carnitine. Supports fat metabolism and may aid in weight management.', false, 20),
    ('Glucosamine', 'glucosamine', 'mg/kg', 'Minimum glucosamine. Supports joint health and mobility.', false, 21),
    ('Chondroitin', 'chondroitin', 'mg/kg', 'Minimum chondroitin. Works with glucosamine to support joint cartilage.', false, 22),
    ('DHA', 'dha', '%', 'Minimum docosahexaenoic acid. Omega-3 fatty acid critical for brain and eye development in puppies and kittens.', false, 23),
    ('EPA', 'epa', '%', 'Minimum eicosapentaenoic acid. Omega-3 fatty acid with anti-inflammatory properties.', false, 24),
    ('Magnesium', 'magnesium', '%', 'Maximum magnesium. Important for enzyme function; excess can be harmful to pets with kidney disease.', false, 25);

-- ============================================================
-- BASE CATEGORIES (per pet type)
-- ============================================================

-- Dog categories
INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Dry Dog Food', 'dry-dog-food', 'Complete and balanced dry kibble formulas for dogs.', id, 1 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Wet Dog Food', 'wet-dog-food', 'Canned and pouched wet food formulas for dogs.', id, 2 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Dog Treats', 'dog-treats', 'Supplemental treats, chews, and training rewards for dogs.', id, 3 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Dog Supplements', 'dog-supplements', 'Vitamins, minerals, probiotics, and nutritional supplements for dogs.', id, 4 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Raw Dog Food', 'raw-dog-food', 'Raw, freeze-dried, and dehydrated raw food for dogs.', id, 5 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Fresh Dog Food', 'fresh-dog-food', 'Gently cooked fresh food delivered refrigerated for dogs.', id, 6 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Dog Food Toppers', 'dog-food-toppers', 'Supplemental toppers and mixers to enhance dog meals.', id, 7 FROM pet_types WHERE slug = 'dog';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Prescription Dog Food', 'prescription-dog-food', 'Veterinary-exclusive therapeutic diets for dogs with specific health conditions.', id, 8 FROM pet_types WHERE slug = 'dog';

-- Cat categories
INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Dry Cat Food', 'dry-cat-food', 'Complete and balanced dry kibble formulas for cats.', id, 1 FROM pet_types WHERE slug = 'cat';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Wet Cat Food', 'wet-cat-food', 'Canned and pouched wet food formulas for cats.', id, 2 FROM pet_types WHERE slug = 'cat';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Cat Treats', 'cat-treats', 'Supplemental treats and rewards for cats.', id, 3 FROM pet_types WHERE slug = 'cat';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Cat Supplements', 'cat-supplements', 'Vitamins, minerals, and nutritional supplements for cats.', id, 4 FROM pet_types WHERE slug = 'cat';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Raw Cat Food', 'raw-cat-food', 'Raw, freeze-dried, and dehydrated raw food for cats.', id, 5 FROM pet_types WHERE slug = 'cat';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Fresh Cat Food', 'fresh-cat-food', 'Gently cooked fresh food delivered refrigerated for cats.', id, 6 FROM pet_types WHERE slug = 'cat';

INSERT INTO categories (name, slug, description, pet_type_id, sort_order)
SELECT 'Prescription Cat Food', 'prescription-cat-food', 'Veterinary-exclusive therapeutic diets for cats with specific health conditions.', id, 7 FROM pet_types WHERE slug = 'cat';

COMMIT;