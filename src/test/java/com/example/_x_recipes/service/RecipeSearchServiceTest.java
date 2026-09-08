package com.example._x_recipes.service;

import com.example._x_recipes.model.Recipe;
import com.example._x_recipes.model.RecipeResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("RecipeSearchService - Search Accuracy & Ranking Tests")
class RecipeSearchServiceTest {

    private RecipeSearchService recipeSearchService;

    @BeforeEach
    void setUp() {
        recipeSearchService = new RecipeSearchService();
    }

    private Recipe createRecipe(String id, String name, Integer cookTime, String... ingredients) {
        Recipe recipe = new Recipe();
        recipe.setId(id);
        recipe.setName(name);
        recipe.setCookTime(cookTime);
        recipe.setIngredients(Arrays.asList(ingredients));
        return recipe;
    }

    @Test
    @DisplayName("Should find recipes matching ingredients")
    void testSearchWithMatchingIngredients() {
        Recipe recipe1 = createRecipe("r1", "Chicken Pasta", 30, "chicken", "pasta", "tomato");
        Recipe recipe2 = createRecipe("r2", "Beef Stew", 60, "beef", "potato", "carrot");

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", Arrays.asList(recipe1, recipe2)
        );

        assertTrue(results.stream().anyMatch(r -> r.getId().equals("r1")), "Chicken Pasta should be found");
    }

    @Test
    @DisplayName("Should enforce 50% ingredient match threshold")
    void testMinimumIngredientMatchThreshold() {
        Recipe recipe = createRecipe("r1", "Complex Dish", 45,
            "chicken", "pasta", "tomato", "garlic", "basil", "olive oil", "parmesan");

        List<String> userIngredients = Arrays.asList("chicken", "pasta", "rice");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "30-60", List.of(recipe)
        );

        assertFalse(results.isEmpty(), "Recipe with 66% match should be included");
    }

    @Test
    @DisplayName("Should reject recipes below 50% ingredient match")
    void testBelowThresholdRejected() {
        Recipe recipe = createRecipe("r1", "Wrong Recipe", 45, "beef", "rice", "beans");

        List<String> userIngredients = Arrays.asList("chicken", "pasta", "tomato");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "30-60", List.of(recipe)
        );

        assertTrue(results.isEmpty(), "Recipe with 0% ingredient match should be rejected");
    }

    @Test
    @DisplayName("Should filter by cooking time range: 20-60 minutes")
    void testCookTimeFiltering() {
        Recipe tooFast = createRecipe("r1", "Quick Snack", 10, "chicken", "pasta");
        Recipe perfect = createRecipe("r2", "Chicken Pasta", 35, "chicken", "pasta");
        Recipe tooSlow = createRecipe("r3", "Slow Roast", 90, "chicken", "pasta");

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", Arrays.asList(tooFast, perfect, tooSlow)
        );

        assertEquals(1, results.size(), "Only recipe with 20-60 min should be included");
        assertEquals("r2", results.get(0).getId());
    }

    @Test
    @DisplayName("Should filter by time range: under 15 minutes")
    void testCookTimeFilteringUnder15() {
        Recipe quick = createRecipe("r1", "Quick Recipe", 10, "chicken");
        Recipe medium = createRecipe("r2", "Medium Recipe", 25, "chicken");

        List<String> userIngredients = List.of("chicken");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "<15", Arrays.asList(quick, medium)
        );

        assertEquals(1, results.size());
        assertEquals("r1", results.get(0).getId());
    }

    @Test
    @DisplayName("Should filter by time range: 60+ minutes")
    void testCookTimeFiltering60Plus() {
        Recipe slow = createRecipe("r1", "Slow Recipe", 90, "beef");
        Recipe quick = createRecipe("r2", "Quick Recipe", 30, "beef");

        List<String> userIngredients = List.of("beef");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "60+", Arrays.asList(slow, quick)
        );

        assertEquals(1, results.size());
        assertEquals("r1", results.get(0).getId());
    }

    @Test
    @DisplayName("Should rank results by cook time (shortest first)")
    void testResultsRankedByCookTime() {
        Recipe recipe1 = createRecipe("r1", "Recipe 1", 50, "chicken", "pasta");
        Recipe recipe2 = createRecipe("r2", "Recipe 2", 30, "chicken", "pasta");
        Recipe recipe3 = createRecipe("r3", "Recipe 3", 45, "chicken", "pasta");

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", Arrays.asList(recipe1, recipe2, recipe3)
        );

        assertEquals(3, results.size());
        assertEquals(30, results.get(0).getCookTime());
        assertEquals(45, results.get(1).getCookTime());
        assertEquals(50, results.get(2).getCookTime());
    }

    @Test
    @DisplayName("Should handle case-insensitive ingredient matching")
    void testCaseInsensitiveMatching() {
        Recipe recipe = createRecipe("r1", "Recipe", 30, "Chicken", "Pasta");

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", List.of(recipe)
        );

        assertFalse(results.isEmpty(), "Case-insensitive matching should work");
    }

    @Test
    @DisplayName("Should handle partial ingredient matching")
    void testPartialIngredientMatching() {
        Recipe recipe = createRecipe("r1", "Recipe", 30, "chicken breast", "pasta noodles");

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", List.of(recipe)
        );

        assertFalse(results.isEmpty(), "Substring matching should work");
    }

    @Test
    @DisplayName("Should reject search with empty ingredients")
    void testSearchWithEmptyIngredients() {
        Recipe recipe = createRecipe("r1", "Recipe", 30, "chicken", "pasta");

        List<RecipeResult> results = recipeSearchService.searchRecipes(
            new ArrayList<>(), "20-60", List.of(recipe)
        );

        assertTrue(results.isEmpty(), "Empty ingredients should return no results");
    }

    @Test
    @DisplayName("Should reject search with null ingredients")
    void testSearchWithNullIngredients() {
        Recipe recipe = createRecipe("r1", "Recipe", 30, "chicken", "pasta");

        List<RecipeResult> results = recipeSearchService.searchRecipes(
            null, "20-60", List.of(recipe)
        );

        assertTrue(results.isEmpty(), "Null ingredients should return no results");
    }

    @Test
    @DisplayName("Should handle recipes with null ingredients")
    void testRecipeWithNullIngredients() {
        Recipe recipe = new Recipe();
        recipe.setId("r1");
        recipe.setName("Recipe");
        recipe.setIngredients(null);
        recipe.setCookTime(30);

        List<String> userIngredients = List.of("chicken");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", List.of(recipe)
        );

        assertTrue(results.isEmpty(), "Recipe with null ingredients should be skipped");
    }

    @Test
    @DisplayName("Should handle recipes with null cook time")
    void testRecipeWithNullCookTime() {
        Recipe recipe = createRecipe("r1", "Recipe", null, "chicken", "pasta");
        recipe.setCookTime(null);

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", List.of(recipe)
        );

        assertTrue(results.isEmpty(), "Recipe with null cook time should be filtered out");
    }

    @Test
    @DisplayName("Should limit results to 10 recipes")
    void testResultsLimitedToTen() {
        List<Recipe> recipes = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            recipes.add(createRecipe("r" + i, "Recipe " + i, 30 + i, "chicken", "pasta"));
        }

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", recipes
        );

        assertTrue(results.size() <= 10, "Results should be limited to 10");
    }

    @Test
    @DisplayName("Should calculate match percentage correctly")
    void testMatchPercentageCalculation() {
        Recipe recipe = createRecipe("r1", "Recipe", 30, "chicken", "pasta", "tomato");

        List<String> userIngredients = Arrays.asList("chicken", "pasta", "rice");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", List.of(recipe)
        );

        assertFalse(results.isEmpty());
        assertEquals(66, results.get(0).getMatchPercentage());
    }

    @Test
    @DisplayName("Should handle empty recipe list")
    void testEmptyRecipeList() {
        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", new ArrayList<>()
        );

        assertTrue(results.isEmpty());
    }

    @Test
    @DisplayName("Should handle recipe with empty ingredients list")
    void testRecipeWithEmptyIngredientsList() {
        Recipe recipe = createRecipe("r1", "Recipe", 30);

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "20-60", List.of(recipe)
        );

        assertTrue(results.isEmpty(), "Recipe with no ingredients should be rejected");
    }

    @Test
    @DisplayName("Should prioritize exact ingredient matches")
    void testExactIngredientMatches() {
        Recipe perfect = createRecipe("r1", "Perfect Match", 35, "chicken", "pasta", "tomato");
        Recipe partial = createRecipe("r2", "Partial Match", 35, "chicken", "rice", "beans");

        List<String> userIngredients = Arrays.asList("chicken", "pasta");
        List<RecipeResult> results = recipeSearchService.searchRecipes(
            userIngredients, "30-60", Arrays.asList(partial, perfect)
        );

        assertEquals("r1", results.get(0).getId(), "Perfect match should rank higher");
    }
}
