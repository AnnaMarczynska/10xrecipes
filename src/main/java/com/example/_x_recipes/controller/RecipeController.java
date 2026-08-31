package com.example._x_recipes.controller;

import com.example._x_recipes.client.TheMealDBClient;
import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.model.Recipe;
import com.example._x_recipes.model.RecipeResult;
import com.example._x_recipes.service.RecipeSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = "*")
@Tag(name = "Recipes", description = "Recipe search and discovery endpoints")
public class RecipeController {

    @Autowired
    private TheMealDBClient theMealDBClient;

    @Autowired
    private RecipeSearchService recipeSearchService;

    // Cache for all recipes (in-memory for MVP)
    private volatile List<Recipe> cachedRecipes;
    private volatile long cacheTime = 0;
    private static final long CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the API is running and healthy")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "API is healthy")
    public ResponseEntity<com.example._x_recipes.model.ApiResponse<?>> health() {
        Map<String, String> data = new HashMap<>();
        data.put("status", "healthy");
        return ResponseEntity.ok(com.example._x_recipes.model.ApiResponse.success(data));
    }

    @PostMapping("/search")
    @Operation(summary = "Search recipes", description = "Search for recipes by ingredients and cooking time")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Search successful")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request parameters")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "504", description = "Recipe service unavailable")
    public ResponseEntity<com.example._x_recipes.model.ApiResponse<?>> searchRecipes(@RequestBody SearchRequest request) throws TheMealDBClient.TheMealDBException {
        try {
            // Validate input
            if (request.getIngredients() == null || request.getIngredients().isEmpty()) {
                throw new IllegalArgumentException("ingredients list required");
            }

            if (request.getTimeRange() == null || request.getTimeRange().isEmpty()) {
                throw new IllegalArgumentException("timeRange is required");
            }

            // Fetch recipes (with caching)
            List<Recipe> allRecipes;
            try {
                allRecipes = getAllRecipes();
            } catch (TheMealDBClient.TheMealDBException e) {
                throw e;
            }

            // Get recipes matching ingredients (without strict time filtering yet)
            // We need more than 10 since we'll filter by time range after enriching with cook times
            List<Recipe> candidateRecipes = allRecipes.stream()
                .filter(recipe -> {
                    // Quick filter: must have >= 50% ingredient match
                    List<String> ingredients = recipe.getIngredients();
                    if (ingredients == null || ingredients.isEmpty()) return false;

                    int matchCount = 0;
                    for (String userIngredient : request.getIngredients()) {
                        if (ingredients.stream()
                            .anyMatch(ing -> ing.toLowerCase().contains(userIngredient.toLowerCase()))) {
                            matchCount++;
                        }
                    }
                    return (matchCount * 100 / request.getIngredients().size()) >= 50;
                })
                .limit(20)
                .collect(Collectors.toList());

            // Enrich with full recipe details including cook times (all candidates)
            List<Recipe> enrichedRecipes = new ArrayList<>();
            for (Recipe recipe : candidateRecipes) {
                try {
                    Recipe fullRecipe = theMealDBClient.fetchRecipeDetails(recipe.getId());
                    Integer cookTime = null;

                    // Try to get cook time from strCookTime field
                    if (fullRecipe.getCookTime() != null) {
                        cookTime = fullRecipe.getCookTime();
                    } else if (fullRecipe.getInstructions() != null) {
                        // Parse cook time from instructions
                        cookTime = extractCookTimeFromInstructions(fullRecipe.getInstructions());
                    }

                    if (cookTime != null) {
                        fullRecipe.setCookTime(cookTime);
                    }
                    enrichedRecipes.add(fullRecipe);
                } catch (Exception e) {
                    // If fetch fails, use original recipe
                    enrichedRecipes.add(recipe);
                }
            }

            // Now rank with enriched recipes (strict time filtering + sort by cook time)
            List<RecipeResult> finalResults = recipeSearchService.searchRecipes(
                request.getIngredients(),
                request.getTimeRange(),
                enrichedRecipes.stream().filter(r -> r != null).collect(Collectors.toList())
            );

            Map<String, Object> response = new HashMap<>();
            response.put("results", finalResults);
            response.put("total", finalResults.size());

            return ResponseEntity.ok(com.example._x_recipes.model.ApiResponse.success(response));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (TheMealDBClient.TheMealDBException e) {
            throw e;
        }
    }

    @GetMapping("/{id}/details")
    @Operation(summary = "Get recipe details", description = "Retrieve detailed information about a specific recipe")
    @Parameter(name = "id", description = "Recipe ID", required = true)
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Recipe details retrieved")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "504", description = "Recipe service unavailable")
    public ResponseEntity<com.example._x_recipes.model.ApiResponse<?>> getRecipeDetails(@PathVariable String id) throws TheMealDBClient.TheMealDBException {
        try {
            Recipe recipe = theMealDBClient.fetchRecipeDetails(id);

            // Get cook time from recipe data or parse from instructions
            Integer cookTime = recipe.getCookTime();
            if (cookTime == null && recipe.getInstructions() != null) {
                cookTime = extractCookTimeFromInstructions(recipe.getInstructions());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("id", recipe.getId());
            response.put("name", recipe.getName());
            response.put("image", recipe.getImage());
            response.put("ingredients", buildIngredientsMap(recipe));
            response.put("instructions", recipe.getInstructions());
            response.put("cookTime", cookTime);
            response.put("yield", recipe.getYield());

            return ResponseEntity.ok(com.example._x_recipes.model.ApiResponse.success(response));
        } catch (TheMealDBClient.TheMealDBException e) {
            if (e.getMessage().contains("not found")) {
                throw new IllegalArgumentException("Recipe not found");
            }
            throw e;
        }
    }

    private List<Recipe> getAllRecipes() throws TheMealDBClient.TheMealDBException {
        long now = System.currentTimeMillis();

        // Use cached recipes if fresh
        if (cachedRecipes != null && (now - cacheTime) < CACHE_DURATION) {
            return cachedRecipes;
        }

        // Fetch fresh recipes
        cachedRecipes = theMealDBClient.fetchAllRecipes();
        cacheTime = now;

        return cachedRecipes;
    }

    private Integer extractCookTimeFromInstructions(String instructions) {
        if (instructions == null || instructions.isEmpty()) {
            return null;
        }

        int totalMinutes = 0;
        String lowerInstructions = instructions.toLowerCase();

        // Find all patterns like "X min" or "X mins" or "X minute" or "X minutes"
        // Only match if preceded by cooking verbs (cook, bake, simmer, fry, boil, roast, heat, etc.)
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
            "(?:cook|bake|simmer|fry|boil|roast|heat|grill|broil|steam|braise|stew|poach|sauté|sautee)\\s+.*?(\\d+)\\s*(?:min|minute)",
            java.util.regex.Pattern.CASE_INSENSITIVE
        );
        java.util.regex.Matcher matcher = pattern.matcher(lowerInstructions);

        while (matcher.find()) {
            try {
                int minutes = Integer.parseInt(matcher.group(1));
                // Only consider reasonable cooking times (1-60 minutes per step)
                if (minutes >= 1 && minutes <= 60) {
                    totalMinutes += minutes;
                }
            } catch (NumberFormatException e) {
                // Skip this match
            }
        }

        // If we found cooking times, add 5 minutes for prep
        if (totalMinutes > 0) {
            return Math.min(totalMinutes + 5, 120); // cap at 120 minutes
        }

        return null;
    }

    private List<Map<String, String>> buildIngredientsMap(Recipe recipe) {
        List<Map<String, String>> ingredients = new java.util.ArrayList<>();
        List<String> recipeIngredients = recipe.getIngredients();

        if (recipeIngredients != null) {
            for (String ingredient : recipeIngredients) {
                Map<String, String> item = new HashMap<>();
                item.put("name", ingredient);
                item.put("amount", ""); // TheMealDB doesn't provide amounts in search results
                ingredients.add(item);
            }
        }

        return ingredients;
    }

    public static class SearchRequest {
        private List<String> ingredients;
        private String timeRange;

        public List<String> getIngredients() { return ingredients; }
        public void setIngredients(List<String> ingredients) { this.ingredients = ingredients; }
        public String getTimeRange() { return timeRange; }
        public void setTimeRange(String timeRange) { this.timeRange = timeRange; }
    }
}
