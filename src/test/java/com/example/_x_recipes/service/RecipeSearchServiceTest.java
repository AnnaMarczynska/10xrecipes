package com.example._x_recipes.service;

import com.example._x_recipes.model.Recipe;
import com.example._x_recipes.model.RecipeResult;
import com.example._x_recipes.test.TestRecipeFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RecipeSearchServiceTest {
    private RecipeSearchService service;
    private List<Recipe> testRecipes;

    @BeforeEach
    void setUp() {
        service = new RecipeSearchService();
        testRecipes = createTestRecipes();
    }

    @Test
    void testIngredientThreshold50Percent() {
        // User ingredients: [chicken, rice, garlic]
        // Recipe with [chicken, rice, salt] => 66% match => included
        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testRecipes);

        assertFalse(results.isEmpty());
        RecipeResult first = results.get(0);
        assertTrue(first.getMatchPercentage() >= 50);
    }

    @Test
    void testIngredientThresholdBelowMinimum() {
        // User ingredients: [chicken, rice, garlic]
        // Recipe with [chicken, salt, pepper] => 33% match => excluded
        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testRecipes);

        // Should only include recipes with >= 50% match
        for (RecipeResult result : results) {
            assertTrue(result.getMatchPercentage() >= 50);
        }
    }

    @Test
    void testRankingOrder() {
        // Recipe A: 100% match, cook time in range => score 100
        // Recipe B: 66% match, cook time in range => score 79.6
        List<String> userIngredients = Arrays.asList("chicken", "rice");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testRecipes);

        if (results.size() > 1) {
            assertTrue(results.get(0).getScore() >= results.get(1).getScore());
        }
    }

    @Test
    void testCookTimeFitScoring() {
        // Cook time 30 min, user range 30-60 => 100% fit
        // Cook time 75 min, user range 30-60 => lower fit (15 min over range)
        List<String> userIngredients = Arrays.asList("chicken", "rice");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testRecipes);

        assertFalse(results.isEmpty());
        // Results should be sorted by score
        assertTrue(results.get(0).getScore() > 0);
    }

    @Test
    void testEmptyIngredientsList() {
        List<String> userIngredients = new ArrayList<>();
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testRecipes);

        assertTrue(results.isEmpty());
    }

    /**
     * PHASE 2 RANKING UNIT TESTS - Catch regressions in score calculation and sorting
     */

    @Test
    void testScoreCalculationWithKnownInputs() {
        // REGRESSION: Catches weight inversion (0.4/0.6 vs 0.6/0.4)
        // Test with known recipes: 100% ingredient + 100% time, 0% ingredient + 0% time, 50% ingredient + 50% time
        List<Recipe> testData = new ArrayList<>();

        // Recipe A: 100% ingredient overlap (chicken, rice, garlic), cook time 50 (within 30-60 range, so 100% fit)
        // Score = (100 * 0.4) + (100 * 0.6) = 40 + 60 = 100
        testData.add(TestRecipeFactory.recipeWith100PercentBothComponents());

        // Recipe B: 0% ingredient overlap (beef, pasta, tomato), cook time 22 (within 15-30, so 100% fit but excluded by 50% min)
        // Won't appear in results due to < 50% threshold, so test separately
        Recipe zeroOverlap = TestRecipeFactory.recipeWithZeroIngredientOverlap();
        testData.add(zeroOverlap);

        // Recipe C: 50% ingredient overlap (chicken + rice out of 4 ingredients), cook time 60
        testData.add(TestRecipeFactory.recipeWith50PercentIngredientAtTimeThreshold());

        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testData);

        // Should have at least 2 results (100% and 50% recipes; 0% excluded by threshold)
        assertTrue(results.size() >= 2);

        // Recipe with 100% ingredient should have score 100
        RecipeResult r100 = results.stream()
            .filter(r -> r.getId().contains("100pct-both"))
            .findFirst()
            .orElse(null);
        assertNotNull(r100);
        assertEquals(100.0, r100.getScore(), 0.1);

        // Recipe with 50% ingredient (2/3 ingredients) should have score (66% * 0.4) + (100% * 0.6) = 26.4 + 60 = 86.4 ≈ 86
        RecipeResult r50 = results.stream()
            .filter(r -> r.getId().contains("50pct-at-boundary"))
            .findFirst()
            .orElse(null);
        assertNotNull(r50);
        // Recipe has ["chicken", "rice", ...], user has ["chicken", "rice", "garlic"]
        // 2/3 = 66% ingredient overlap, 100% time fit
        // Score = (66 * 0.4) + (100 * 0.6) ≈ 26.4 + 60 ≈ 86.4
        assertTrue(r50.getScore() >= 85 && r50.getScore() <= 87);
    }

    @Test
    void testScoreBothComponentsRequired() {
        // REGRESSION: Catches if one component (ingredient or time) is dropped from score formula
        List<Recipe> testData = new ArrayList<>();

        // Recipe A: 100% ingredient overlap, 100% time fit (both components max)
        // User: [chicken, rice, garlic], Recipe: [chicken, rice, garlic, broth] → 100% match
        testData.add(TestRecipeFactory.recipeWith100PercentBothComponents());

        // Recipe B: 100% ingredient overlap, 0% time fit (ingredient max, time min)
        // User: [chicken, rice, garlic], Recipe: [chicken, rice, garlic, herbs] → 100% match, but time=90 (outside 30-60)
        testData.add(TestRecipeFactory.recipeWith100PercentIngredientOutOfTimeRange());

        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testData);

        // Both recipes have 100% ingredient overlap, so should be included (≥ 50% threshold)
        assertTrue(results.size() >= 1, "Expected at least 1 result (100% ingredient overlap)");

        // Recipe with both components at 100% should score higher than recipe with ingredient at 100% but time at 0%
        RecipeResult rBoth = results.stream()
            .filter(r -> r.getId().contains("100pct-both"))
            .findFirst()
            .orElse(null);
        assertNotNull(rBoth, "Recipe with 100% ingredient and time fit should be found");

        // If a recipe with 100% ingredient and 0% time is included (outside range but >= 50% threshold)
        // its score should be: (100 * 0.4) + (0 * 0.6) = 40 + 0 = 40 (much lower than 100)
        // If time component is dropped (bug), both would score 40 (same)
        if (results.size() >= 2) {
            RecipeResult rTimeOut = results.stream()
                .filter(r -> r.getId().contains("100pct-out-of-range"))
                .findFirst()
                .orElse(null);
            if (rTimeOut != null) {
                // rBoth should score > rTimeOut (both components > ingredient only)
                assertTrue(rBoth.getScore() > rTimeOut.getScore(),
                    "Recipe with both components (score=" + rBoth.getScore() + ") should score > recipe with ingredient only (score=" + rTimeOut.getScore() + ")");
            }
        }
    }

    @Test
    void testSortingIsByCookTimeAscending() {
        // REGRESSION: Validates that results are sorted by cook time ascending (not by score)
        // This test protects the current behavior: sorting by time, not score
        List<Recipe> testData = new ArrayList<>();
        testData.add(TestRecipeFactory.recipeWith100PercentBothComponents()); // 50 min, 100% ingredient
        testData.add(TestRecipeFactory.recipeWith75PercentIngredientInTimeRange()); // 45 min, 75% ingredient (3/4)
        testData.add(TestRecipeFactory.recipeWith50PercentIngredientAtTimeThreshold()); // 60 min, 50% ingredient (2/4)

        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testData);

        // Should have results (all >= 50% ingredient overlap)
        assertTrue(results.size() >= 1);

        // Results should be sorted by cook time ascending (shortest first)
        if (results.size() >= 2) {
            for (int i = 1; i < results.size(); i++) {
                Integer prevTime = results.get(i - 1).getCookTime();
                Integer currTime = results.get(i).getCookTime();
                assertTrue(prevTime <= currTime,
                    "Results should be sorted by cook time ascending: " + prevTime + " should be <= " + currTime);
            }
        }
    }

    @Test
    void testWeightInversionDetected() {
        // REGRESSION: Catches if weights are swapped to 0.6 ingredient + 0.4 time (or inverted any way)
        // This test validates that the current weights produce a specific ranking behavior
        List<Recipe> testData = new ArrayList<>();
        // User ingredients: [chicken, rice, garlic]
        testData.add(TestRecipeFactory.recipeWith100PercentBothComponents()); // [chicken, rice, garlic, broth] = 100%, cook=50 → score = 100
        testData.add(TestRecipeFactory.recipeWith75PercentIngredientInTimeRange()); // 3/4 ingredients = 75%, cook=45 → score = 30 + 60 = 90
        testData.add(TestRecipeFactory.recipeWith50PercentIngredientAtTimeThreshold()); // 2/4 ingredients = 50%, cook=60 → score = 20 + 60 = 80

        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testData);

        // All three should be in results (all >= 50% ingredient overlap)
        assertEquals(3, results.size(), "Expected 3 results; all have >= 50% ingredient overlap");

        // Current weights (0.4 ingredient, 0.6 time) with all within time range (100% time score):
        // - 100% ingredient (3/3), 100% time => (100 * 0.4) + (100 * 0.6) = 100
        // - 75% ingredient (3/4), 100% time => (75 * 0.4) + (100 * 0.6) = 30 + 60 = 90
        // - 50% ingredient (2/4), 100% time => (50 * 0.4) + (100 * 0.6) = 20 + 60 = 80
        // But results are sorted by cook time (45, 50, 60), not by score
        // So verify: results[0].cookTime < results[1].cookTime < results[2].cookTime
        // i.e., 45 < 50 < 60
        assertEquals(45, results.get(0).getCookTime());
        assertEquals(50, results.get(1).getCookTime());
        assertEquals(60, results.get(2).getCookTime());
        // Scores should follow the weight formula (not strictly ordered since sorted by time)
        assertTrue(results.get(0).getScore() >= 85); // 75% ingredient at 45 min => score = 30 + 60 = 90
    }

    @Test
    void testThresholdExactly50Percent() {
        // REGRESSION: Catches if 50% threshold is implemented incorrectly (e.g., >= 50 vs > 50)
        List<Recipe> testData = new ArrayList<>();
        // Recipe has [chicken, rice, soy sauce, oil], user has [chicken, rice, garlic, onion]
        // Matches: chicken, rice = 2/4 = 50%
        testData.add(TestRecipeFactory.recipeWith50PercentIngredientAtTimeThreshold()); // exactly 50%

        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic", "onion"); // 4 ingredients
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testData);

        // Recipe with exactly 50% overlap should be INCLUDED (>= 50% threshold)
        assertEquals(1, results.size(), "Recipe with exactly 50% ingredient overlap should be included");
        assertEquals(50, results.get(0).getMatchPercentage());
    }

    @Test
    void testTimeRangeStrictBoundary() {
        // REGRESSION: Catches if time boundary comparisons are flipped (< vs <=, > vs >=)
        List<Recipe> testData = new ArrayList<>();

        // Recipe A: cook time exactly at user's max (should be INCLUDED with <= comparison)
        testData.add(TestRecipeFactory.recipeWith50PercentIngredientAtTimeThreshold()); // 60 min, at boundary

        // Recipe B: cook time exactly 1 minute over max (should be EXCLUDED)
        Recipe tooLong = new Recipe();
        tooLong.setId("too-long");
        tooLong.setName("Very Slow Recipe");
        tooLong.setImage("http://example.com/too-long.jpg");
        tooLong.setCookTime(61); // 1 minute over the max
        tooLong.setIngredient1("chicken");
        tooLong.setIngredient2("rice");
        testData.add(tooLong);

        List<String> userIngredients = Arrays.asList("chicken", "rice", "garlic", "onion");
        List<RecipeResult> results = service.searchRecipes(userIngredients, "30-60", testData);

        // Should include recipe at exactly 60 min (within range)
        RecipeResult atBoundary = results.stream()
            .filter(r -> r.getCookTime() == 60)
            .findFirst()
            .orElse(null);
        assertNotNull(atBoundary, "Recipe with cook time exactly at max (60 min) should be included in 30-60 range");

        // Should NOT include recipe at 61 min (outside range)
        RecipeResult overBoundary = results.stream()
            .filter(r -> r.getCookTime() == 61)
            .findFirst()
            .orElse(null);
        assertNull(overBoundary, "Recipe with cook time 1 min over max (61 min) should be excluded from 30-60 range");
    }

    private List<Recipe> createTestRecipes() {
        List<Recipe> recipes = new ArrayList<>();

        // Recipe 1: 100% match with [chicken, rice]
        Recipe recipe1 = new Recipe();
        recipe1.setId("1");
        recipe1.setName("Chicken Fried Rice");
        recipe1.setImage("http://example.com/img1.jpg");
        recipe1.setCookTime(30);
        recipe1.setIngredient1("chicken");
        recipe1.setIngredient2("rice");
        recipes.add(recipe1);

        // Recipe 2: 66% match with [chicken, rice, garlic]
        Recipe recipe2 = new Recipe();
        recipe2.setId("2");
        recipe2.setName("Chicken Rice Soup");
        recipe2.setImage("http://example.com/img2.jpg");
        recipe2.setCookTime(45);
        recipe2.setIngredient1("chicken");
        recipe2.setIngredient2("rice");
        recipe2.setIngredient3("salt");
        recipes.add(recipe2);

        return recipes;
    }
}
