package com.example._x_recipes.test;

import com.example._x_recipes.model.Recipe;
import java.util.ArrayList;
import java.util.List;

/**
 * Factory for creating comprehensive mock Recipe objects for testing.
 * Provides recipes spanning all ingredient-overlap levels and cook-time ranges
 * to enable boundary-condition testing.
 *
 * Matrix: 5 overlap levels × 4 time ranges = 20 base recipes
 * - Overlap: 0%, 30%, 50%, 75%, 100%
 * - Time ranges: <15min, 15-30min, 30-60min, 60+min
 */
public class TestRecipeFactory {

    /**
     * Returns all 20+ test recipes covering the full spectrum of overlaps and time ranges.
     */
    public static List<Recipe> getAllTestRecipes() {
        List<Recipe> recipes = new ArrayList<>();

        // 0% OVERLAP RECIPES
        recipes.add(createRecipe("no-overlap-short", "Beef Stew Quick", 10,
            "beef", "potato", "onion"));
        recipes.add(createRecipe("no-overlap-medium-short", "Beef Pasta Light", 22,
            "beef", "pasta", "tomato"));
        recipes.add(createRecipe("no-overlap-medium-long", "Beef Roast", 45,
            "beef", "carrot", "celery"));
        recipes.add(createRecipe("no-overlap-long", "Beef Brisket Slow Cooker", 75,
            "beef", "paprika", "mustard"));

        // 30% OVERLAP RECIPES (1/3 ingredients match: chicken matches in all)
        recipes.add(createRecipe("overlap-30-short", "Chicken Quick Fry", 10,
            "chicken", "pasta", "spinach"));
        recipes.add(createRecipe("overlap-30-medium-short", "Chicken Pasta Pesto", 22,
            "chicken", "pesto", "garlic", "lemon"));
        recipes.add(createRecipe("overlap-30-medium-long", "Chicken Parmesan", 45,
            "chicken", "breadcrumb", "parmesan"));
        recipes.add(createRecipe("overlap-30-long", "Chicken Soup Slow Cook", 75,
            "chicken", "broth", "noodle"));

        // 50% OVERLAP RECIPES (2/4 ingredients match: chicken + rice)
        recipes.add(createRecipe("overlap-50-short", "Chicken Rice Stir Fry", 10,
            "chicken", "rice", "soy sauce", "ginger"));
        recipes.add(createRecipe("overlap-50-medium-short", "Chicken Rice Bowl", 22,
            "chicken", "rice", "spinach", "sesame"));
        recipes.add(createRecipe("overlap-50-medium-long", "Chicken Rice Pilaf", 45,
            "chicken", "rice", "celery", "onion"));
        recipes.add(createRecipe("overlap-50-long", "Chicken Rice Casserole Baked", 75,
            "chicken", "rice", "cream", "cheese"));

        // 75% OVERLAP RECIPES (3/4 ingredients match: chicken + rice + garlic)
        recipes.add(createRecipe("overlap-75-short", "Garlic Chicken Rice Quick", 10,
            "chicken", "rice", "garlic", "pepper"));
        recipes.add(createRecipe("overlap-75-medium-short", "Chicken Garlic Rice Pan", 22,
            "chicken", "rice", "garlic", "oil"));
        recipes.add(createRecipe("overlap-75-medium-long", "Chicken Garlic Rice Saute", 45,
            "chicken", "rice", "garlic", "lemon"));
        recipes.add(createRecipe("overlap-75-long", "Chicken Garlic Rice Baked", 75,
            "chicken", "rice", "garlic", "cream"));

        // 100% OVERLAP RECIPES (all 3 ingredients match: chicken + rice + garlic)
        recipes.add(createRecipe("overlap-100-short", "Garlic Chicken Fried Rice", 12,
            "chicken", "rice", "garlic"));
        recipes.add(createRecipe("overlap-100-medium-short", "Chicken Rice Garlic Pan", 25,
            "chicken", "garlic", "rice", "oil"));
        recipes.add(createRecipe("overlap-100-medium-long", "Chicken Garlic Rice Stew", 50,
            "chicken", "rice", "garlic", "broth"));
        recipes.add(createRecipe("overlap-100-long", "Slow Cooker Chicken Garlic Rice", 90,
            "chicken", "rice", "garlic", "herbs"));

        // ADDITIONAL BOUNDARY RECIPES FOR EDGE CASES
        // Exact time boundary: 15 min (boundary between <15 and 15-30)
        recipes.add(createRecipe("boundary-15-exact", "Quick Chicken Rice", 15,
            "chicken", "rice", "garlic"));
        // Exact time boundary: 30 min (boundary between 15-30 and 30-60)
        recipes.add(createRecipe("boundary-30-exact", "Standard Chicken Rice", 30,
            "chicken", "rice", "garlic"));
        // Exact time boundary: 60 min (boundary between 30-60 and 60+)
        recipes.add(createRecipe("boundary-60-exact", "Long Cook Chicken Rice", 60,
            "chicken", "rice", "garlic"));
        // Just below threshold: 14 min (should be in <15)
        recipes.add(createRecipe("boundary-14-min", "Ultra Quick Rice", 14,
            "chicken", "rice", "garlic"));
        // Just above 30-60 boundary: 61 min (should be in 60+)
        recipes.add(createRecipe("boundary-61-min", "Extended Chicken Rice", 61,
            "chicken", "rice", "garlic"));

        return recipes;
    }

    /**
     * Creates a single recipe with the given properties.
     * Ingredients are set sequentially into ingredient1, ingredient2, etc.
     */
    private static Recipe createRecipe(String id, String name, Integer cookTime, String... ingredients) {
        Recipe recipe = new Recipe();
        recipe.setId(id);
        recipe.setName(name);
        recipe.setImage("https://via.placeholder.com/150?text=" + name.replace(" ", "+"));
        recipe.setCookTime(cookTime);

        // Set ingredients sequentially
        if (ingredients.length > 0) recipe.setIngredient1(ingredients[0]);
        if (ingredients.length > 1) recipe.setIngredient2(ingredients[1]);
        if (ingredients.length > 2) recipe.setIngredient3(ingredients[2]);
        if (ingredients.length > 3) recipe.setIngredient4(ingredients[3]);
        if (ingredients.length > 4) recipe.setIngredient5(ingredients[4]);

        return recipe;
    }

    /**
     * Convenience method to get recipes for a specific overlap level.
     * Used for targeted testing of boundary conditions.
     */
    public static List<Recipe> getRecipesForOverlapLevel(int overlapPercentage) {
        List<Recipe> all = getAllTestRecipes();
        List<Recipe> filtered = new ArrayList<>();

        for (Recipe recipe : all) {
            String id = recipe.getId();
            if ((overlapPercentage == 0 && id.startsWith("no-overlap")) ||
                (overlapPercentage == 30 && id.startsWith("overlap-30")) ||
                (overlapPercentage == 50 && id.startsWith("overlap-50")) ||
                (overlapPercentage == 75 && id.startsWith("overlap-75")) ||
                (overlapPercentage == 100 && id.startsWith("overlap-100"))) {
                filtered.add(recipe);
            }
        }
        return filtered;
    }

    /**
     * Convenience method to get recipes for a specific time range.
     */
    public static List<Recipe> getRecipesForTimeRange(String range) {
        List<Recipe> all = getAllTestRecipes();
        List<Recipe> filtered = new ArrayList<>();

        for (Recipe recipe : all) {
            Integer time = recipe.getCookTime();
            if (time == null) continue;

            boolean inRange = false;
            if ("<15".equals(range) && time < 15) inRange = true;
            else if ("15-30".equals(range) && time >= 15 && time <= 30) inRange = true;
            else if ("30-60".equals(range) && time >= 30 && time <= 60) inRange = true;
            else if ("60+".equals(range) && time > 60) inRange = true;

            if (inRange) {
                filtered.add(recipe);
            }
        }
        return filtered;
    }
}
