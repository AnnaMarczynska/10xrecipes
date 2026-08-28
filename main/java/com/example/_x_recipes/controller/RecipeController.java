package com.example._x_recipes.controller;

import com.example._x_recipes.client.TheMealDBClient;
import com.example._x_recipes.model.Recipe;
import com.example._x_recipes.model.RecipeResult;
import com.example._x_recipes.service.RecipeSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/recipes")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class RecipeController {

    @Autowired
    private TheMealDBClient theMealDBClient;

    @Autowired
    private RecipeSearchService recipeSearchService;

    // Cache for all recipes (in-memory for MVP)
    private volatile List<Recipe> cachedRecipes;
    private volatile long cacheTime = 0;
    private static final long CACHE_DURATION = 60 * 60 * 1000; // 1 hour

    @PostMapping("/search")
    public ResponseEntity<?> searchRecipes(@RequestBody SearchRequest request) {
        try {
            // Validate input
            if (request.getIngredients() == null || request.getIngredients().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "ingredients list required",
                    "status", 400
                ));
            }

            if (request.getTimeRange() == null || request.getTimeRange().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "timeRange is required",
                    "status", 400
                ));
            }

            // Fetch recipes (with caching)
            List<Recipe> allRecipes = getAllRecipes();

            // Search and rank recipes
            List<RecipeResult> results = recipeSearchService.searchRecipes(
                request.getIngredients(),
                request.getTimeRange(),
                allRecipes
            );

            Map<String, Object> response = new HashMap<>();
            response.put("results", results);
            response.put("total", results.size());

            return ResponseEntity.ok(response);
        } catch (TheMealDBClient.TheMealDBException e) {
            return ResponseEntity.status(504).body(Map.of(
                "error", "Recipe service unavailable",
                "status", 504
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error: " + e.getMessage(),
                "status", 500
            ));
        }
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getRecipeDetails(@PathVariable String id) {
        try {
            Recipe recipe = theMealDBClient.fetchRecipeDetails(id);

            Map<String, Object> response = new HashMap<>();
            response.put("id", recipe.getId());
            response.put("name", recipe.getName());
            response.put("image", recipe.getImage());
            response.put("ingredients", buildIngredientsMap(recipe));
            response.put("instructions", recipe.getInstructions());
            response.put("cookTime", recipe.getCookTime());
            response.put("yield", recipe.getYield());

            return ResponseEntity.ok(response);
        } catch (TheMealDBClient.TheMealDBException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(504).body(Map.of(
                "error", "Recipe service unavailable",
                "status", 504
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Internal server error",
                "status", 500
            ));
        }
    }

    private List<Recipe> getAllRecipes() throws TheMealDBClient.TheMealDBException {
        synchronized (this) {
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
