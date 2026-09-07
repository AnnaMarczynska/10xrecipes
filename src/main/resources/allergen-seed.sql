-- Allergen seed data for top 100 recipes
-- Maps recipe IDs to allergen tags based on ingredient inspection
-- Format: UPDATE recipes SET allergens = '["allergen1", "allergen2"]' WHERE id = 'recipe_id';

-- Note: This is a reference script for Phase 1 baseline.
-- Phase 2 will manually tag the actual top 100 recipes with allergen data.
-- For MVP testing, sample recipes with common allergen combinations:

-- Pasta dishes (typically contain milk/eggs)
UPDATE recipes SET allergens = '["milk", "eggs", "wheat"]' WHERE id = '52797' AND name LIKE '%Pasta Alfredo%';
UPDATE recipes SET allergens = '["milk", "eggs", "wheat"]' WHERE id = '52796' AND name LIKE '%Chicken Alfredo%';
UPDATE recipes SET allergens = '["milk", "wheat"]' WHERE id = '52795' AND name LIKE '%Spaghetti%';

-- Nut-based dishes
UPDATE recipes SET allergens = '["peanuts"]' WHERE id = '52798' AND name LIKE '%Peanut%';
UPDATE recipes SET allergens = '["tree_nuts"]' WHERE id = '52799' AND name LIKE '%Almond%';
UPDATE recipes SET allergens = '["tree_nuts", "milk"]' WHERE id = '52800' AND name LIKE '%Walnut%';

-- Seafood dishes
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52801' AND name LIKE '%Salmon%';
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52802' AND name LIKE '%Shrimp%';
UPDATE recipes SET allergens = '["fish", "shellfish"]' WHERE id = '52803' AND name LIKE '%Seafood%';

-- Egg-based dishes
UPDATE recipes SET allergens = '["eggs", "milk"]' WHERE id = '52804' AND name LIKE '%Omelette%';
UPDATE recipes SET allergens = '["eggs"]' WHERE id = '52805' AND name LIKE '%Egg%';

-- Soy-based dishes
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52806' AND name LIKE '%Tofu%';
UPDATE recipes SET allergens = '["soy", "fish"]' WHERE id = '52807' AND name LIKE '%Teriyaki%';

-- Dairy-free but common dishes (no allergens or minimal)
UPDATE recipes SET allergens = '[]' WHERE id = '52850' AND name LIKE '%Salad%';
UPDATE recipes SET allergens = '[]' WHERE id = '52851' AND name LIKE '%Grilled Chicken%';

-- Note: The actual allergen seed will be completed in Phase 2 with full ingredient review
-- of the top 100 most-favorited recipes.
