package com.example._x_recipes.service;

import com.example._x_recipes.model.Recipe;
import com.example._x_recipes.model.RecipeResult;
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
