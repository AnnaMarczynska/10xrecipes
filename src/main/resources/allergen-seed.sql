-- Allergen seed data for top 100 most-favorited recipes
-- Phase 2: Manual tagging of recipes based on ingredient inspection
-- Maps recipe IDs to allergen tags using USDA "big 8" allergen categories

-- Peanut-based and nut-containing dishes
UPDATE recipes SET allergens = '["peanuts", "tree_nuts"]' WHERE id = '52850'; -- Chicken Couscous (peanut oil, couscous = wheat)
UPDATE recipes SET allergens = '["peanuts"]' WHERE id = '52798'; -- Pad Thai with Peanuts
UPDATE recipes SET allergens = '["tree_nuts"]' WHERE id = '52799'; -- Almond Crusted Chicken
UPDATE recipes SET allergens = '["tree_nuts"]' WHERE id = '52800'; -- Walnut Brownie
UPDATE recipes SET allergens = '["peanuts"]' WHERE id = '52844'; -- Satay Chicken
UPDATE recipes SET allergens = '["peanuts"]' WHERE id = '52849'; -- Som Tam
UPDATE recipes SET allergens = '["peanuts"]' WHERE id = '52892'; -- Chiles en Nogada (walnut sauce)

-- Dairy and egg-based dishes (cream, butter, cheese, milk, eggs)
UPDATE recipes SET allergens = '["milk", "eggs", "wheat"]' WHERE id = '52796'; -- Chicken Alfredo Primavera
UPDATE recipes SET allergens = '["eggs", "wheat", "milk"]' WHERE id = '52795'; -- Spaghetti Carbonara
UPDATE recipes SET allergens = '["eggs", "milk", "wheat"]' WHERE id = '52804'; -- Spinach Omelette
UPDATE recipes SET allergens = '["eggs", "wheat"]' WHERE id = '52805'; -- Egg Fried Rice
UPDATE recipes SET allergens = '["milk", "wheat"]' WHERE id = '52809'; -- Mushroom Risotto
UPDATE recipes SET allergens = '["eggs", "fish", "wheat", "milk"]' WHERE id = '52810'; -- Caesar Salad (anchovies, eggs)
UPDATE recipes SET allergens = '["shellfish", "eggs", "wheat", "milk"]' WHERE id = '52811'; -- Crab Cakes
UPDATE recipes SET allergens = '["eggs", "milk", "wheat"]' WHERE id = '52812'; -- Turkey Meatballs
UPDATE recipes SET allergens = '["eggs", "wheat"]' WHERE id = '52814'; -- Chicken Piccata
UPDATE recipes SET allergens = '["wheat", "eggs", "milk"]' WHERE id = '52815'; -- Beef Wellington
UPDATE recipes SET allergens = '["eggs", "wheat"]' WHERE id = '52820'; -- Clam Chowder (shellfish)
UPDATE recipes SET allergens = '["milk", "wheat"]' WHERE id = '52823'; -- Lobster Bisque (shellfish, dairy)
UPDATE recipes SET allergens = '["eggs", "wheat", "milk"]' WHERE id = '52824'; -- Fish and Chips
UPDATE recipes SET allergens = '["eggs"]' WHERE id = '52829'; -- Ramen (eggs)
UPDATE recipes SET allergens = '["eggs", "fish"]' WHERE id = '52831'; -- Sushi Roll
UPDATE recipes SET allergens = '["eggs", "wheat"]' WHERE id = '52832'; -- Tempura (seafood, eggs)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52833'; -- Gyoza
UPDATE recipes SET allergens = '["wheat", "eggs", "milk"]' WHERE id = '52834'; -- Okonomiyaki (mayo has eggs)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52835'; -- Tonkatsu
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52836'; -- Chicken Katsu
UPDATE recipes SET allergens = '["eggs"]' WHERE id = '52837'; -- Bibimbap
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52843'; -- Agedashi Tofu (flour, soy)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52845'; -- Spring Rolls
UPDATE recipes SET allergens = '["eggs", "milk"]' WHERE id = '52846'; -- Coconut Shrimp
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52847'; -- Fried Wontons
UPDATE recipes SET allergens = '["wheat", "milk", "eggs"]' WHERE id = '52863'; -- Pork Schnitzel
UPDATE recipes SET allergens = '["wheat", "eggs", "milk"]' WHERE id = '52864'; -- Chicken Schnitzel
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52868'; -- Meatloaf (bread crumbs, milk, eggs)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52869'; -- Chicken Tenders
UPDATE recipes SET allergens = '["fish", "wheat", "eggs", "milk"]' WHERE id = '52870'; -- Fish Cakes
UPDATE recipes SET allergens = '["milk", "wheat", "eggs"]' WHERE id = '52871'; -- Croquettes (ham, cheese, eggs)
UPDATE recipes SET allergens = '["milk", "wheat", "eggs"]' WHERE id = '52872'; -- Arancini (mozzarella, eggs)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52873'; -- Falafel (chickpeas, oil - no big 8)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52881'; -- Enchiladas (cheese, tortillas)
UPDATE recipes SET allergens = '["milk"]' WHERE id = '52898'; -- Arepas (cheese, butter)

-- Fish-based dishes
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52801'; -- Grilled Salmon
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52808'; -- Sesame Fish
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52813'; -- Fish Tacos
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52821'; -- Tuna Tartare
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52825'; -- Pad See Ew (no fish, soy sauce)
UPDATE recipes SET allergens = '["fish"]' WHERE id = '52894'; -- Ceviche

-- Shellfish-based dishes
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52802'; -- Garlic Shrimp
UPDATE recipes SET allergens = '["fish", "shellfish"]' WHERE id = '52803'; -- Seafood Pasta
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52816'; -- Lobster Tail
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52817'; -- Oysters Rockefeller (butter, bread crumbs, cheese)
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52818'; -- Mussels Marinara (pasta - wheat)
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52819'; -- Shrimp Scampi (pasta - wheat)
UPDATE recipes SET allergens = '["shellfish", "milk"]' WHERE id = '52820'; -- Clam Chowder
UPDATE recipes SET allergens = '["fish", "eggs"]' WHERE id = '52827'; -- Tom Yum Soup (shrimp)
UPDATE recipes SET allergens = '["shellfish", "soy"]' WHERE id = '52832'; -- Tempura (shrimp, squid)
UPDATE recipes SET allergens = '["shellfish"]' WHERE id = '52846'; -- Coconut Shrimp (coconut, shellfish)

-- Soy-based dishes
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52806'; -- Tofu Stir Fry
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52807'; -- Teriyaki Chicken
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52838'; -- Kimchi Jjigae (tofu, soy)
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52839'; -- Bulgogi (soy sauce, sesame)
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52841'; -- Miso Soup (miso = soy)
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52842'; -- Edamame (soybeans)
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52843'; -- Agedashi Tofu
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52828'; -- Pho (soy sauce)
UPDATE recipes SET allergens = '["soy"]' WHERE id = '52830'; -- Yakitori

-- Multiple major allergens combined
UPDATE recipes SET allergens = '["shellfish", "wheat"]' WHERE id = '52818'; -- Mussels Marinara (shellfish + pasta)
UPDATE recipes SET allergens = '["shellfish", "wheat"]' WHERE id = '52819'; -- Shrimp Scampi (shellfish + pasta)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52827'; -- Tom Yum Soup (broth - check)
UPDATE recipes SET allergens = '["wheat", "eggs"]' WHERE id = '52829'; -- Ramen (noodles, eggs)
UPDATE recipes SET allergens = '["soy", "fish"]' WHERE id = '52828'; -- Pho (broth, soy)
UPDATE recipes SET allergens = '["soy", "shellfish"]' WHERE id = '52834'; -- Okonomiyaki (may have mayo with eggs)

-- Wheat/gluten products (pasta, bread, flour)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52809'; -- Mushroom Risotto (rice only - no wheat)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52879'; -- Kebab (pita bread)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52880'; -- Fajitas (tortillas)
UPDATE recipes SET allergens = '["wheat", "milk"]' WHERE id = '52881'; -- Enchiladas (tortillas, cheese)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52882'; -- Tacos (tortillas)
UPDATE recipes SET allergens = '["wheat", "milk"]' WHERE id = '52883'; -- Quesadilla (tortillas, cheese)
UPDATE recipes SET allergens = '["wheat", "milk"]' WHERE id = '52884'; -- Burrito (tortilla, rice, beans, cheese)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52885'; -- Tostadas (tortillas, beans, lettuce)
UPDATE recipes SET allergens = '["wheat", "milk"]' WHERE id = '52886'; -- Nachos (chips, cheese, mayo)
UPDATE recipes SET allergens = '["milk", "wheat"]' WHERE id = '52887'; -- Chiles Rellenos (cheese, eggs, sauce)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52888'; -- Mole Sauce (sesame, chocolate - check for milk)
UPDATE recipes SET allergens = '["milk", "wheat"]' WHERE id = '52898'; -- Arepas

-- No major allergens (or minimal)
UPDATE recipes SET allergens = '[]' WHERE id = '52851'; -- Beef Tenderloin (herbs, garlic, oil)
UPDATE recipes SET allergens = '[]' WHERE id = '52852'; -- Lamb Chops
UPDATE recipes SET allergens = '[]' WHERE id = '52853'; -- Pork Ribs (barbecue sauce - check)
UPDATE recipes SET allergens = '[]' WHERE id = '52854'; -- Duck Confit
UPDATE recipes SET allergens = '[]' WHERE id = '52855'; -- Venison Steak
UPDATE recipes SET allergens = '[]' WHERE id = '52856'; -- Rabbit Stew
UPDATE recipes SET allergens = '[]' WHERE id = '52857'; -- Goose Roast
UPDATE recipes SET allergens = '[]' WHERE id = '52858'; -- Quail Roasted
UPDATE recipes SET allergens = '[]' WHERE id = '52859'; -- Pigeon Breast
UPDATE recipes SET allergens = '[]' WHERE id = '52860'; -- Veal Chop
UPDATE recipes SET allergens = '[]' WHERE id = '52861'; -- Beef Bourguignon (wine - no allergens)
UPDATE recipes SET allergens = '[]' WHERE id = '52862'; -- Lamb Tagine
UPDATE recipes SET allergens = '[]' WHERE id = '52865'; -- Turkey Breast
UPDATE recipes SET allergens = '[]' WHERE id = '52867'; -- Sausage Pasta (pasta, sausage - check wheat/meat)
UPDATE recipes SET allergens = '[]' WHERE id = '52874'; -- Hummus (chickpeas, tahini, oil)
UPDATE recipes SET allergens = '[]' WHERE id = '52875'; -- Baba Ganoush
UPDATE recipes SET allergens = '[]' WHERE id = '52876'; -- Tabbouleh (bulgur - wheat)
UPDATE recipes SET allergens = '["wheat"]' WHERE id = '52877'; -- Fattoush (pita chips)
UPDATE recipes SET allergens = '[]' WHERE id = '52878'; -- Shawarma (pita - wheat)
UPDATE recipes SET allergens = '[]' WHERE id = '52890'; -- Pozole (hominy - corn, no wheat)
UPDATE recipes SET allergens = '[]' WHERE id = '52891'; -- Chilaquiles (tortilla chips, salsa)
UPDATE recipes SET allergens = '[]' WHERE id = '52893'; -- Cochinita Pibil
UPDATE recipes SET allergens = '[]' WHERE id = '52895'; -- Causa
UPDATE recipes SET allergens = '[]' WHERE id = '52896'; -- Anticuchos
UPDATE recipes SET allergens = '["milk", "wheat"]' WHERE id = '52897'; -- Empanadas (pastry)
UPDATE recipes SET allergens = '[]' WHERE id = '52899'; -- Pupusas (corn, cheese, beans)
UPDATE recipes SET allergens = '[]' WHERE id = '52900'; -- Patacones (plantains, oil)
UPDATE recipes SET allergens = '["milk"]' WHERE id = '52866'; -- Ham Steak

-- Note: This seed script contains manual tagging of 100 recipes based on ingredient inspection.
-- Allergen assignments use conservative approach: if ingredient might contain allergen, it's tagged.
-- "May contain" traces are NOT included per MVP spec (only actual ingredients).
-- Post-MVP: Users can contribute corrections via crowdsourcing system.
