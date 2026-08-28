package com.example._x_recipes.client;

import com.example._x_recipes.model.Recipe;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Component
public class TheMealDBClient {
    private static final String THEMEALDB_API_BASE = "https://www.themealdb.com/api/json/v1/1";
    private static final Duration TIMEOUT = Duration.ofSeconds(5);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public TheMealDBClient() {
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }

    public List<Recipe> fetchAllRecipes() throws TheMealDBException {
        // Fetch all recipes by querying multiple letters to build a comprehensive list
        // TheMealDB has a /search.php?f=<letter> endpoint to list meals by first letter
        List<Recipe> allRecipes = new ArrayList<>();

        try {
            // Fetch recipes for each letter a-z
            for (char c = 'a'; c <= 'z'; c++) {
                String url = THEMEALDB_API_BASE + "/search.php?f=" + c;
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(url))
                    .timeout(TIMEOUT)
                    .GET()
                    .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() != 200) {
                    continue; // Skip this letter if not found
                }

                JsonNode jsonNode = objectMapper.readTree(response.body());
                JsonNode meals = jsonNode.get("meals");

                if (meals != null && meals.isArray()) {
                    for (JsonNode mealNode : meals) {
                        try {
                            Recipe recipe = objectMapper.treeToValue(mealNode, Recipe.class);
                            if (recipe != null && recipe.getId() != null) {
                                allRecipes.add(recipe);
                            }
                        } catch (Exception e) {
                            // Skip malformed recipes
                            continue;
                        }
                    }
                }
            }

            return allRecipes;
        } catch (java.net.http.HttpTimeoutException e) {
            throw new TheMealDBException("TheMealDB request timed out after " + TIMEOUT.toSeconds() + " seconds");
        } catch (Exception e) {
            throw new TheMealDBException("Failed to fetch recipes from TheMealDB: " + e.getMessage());
        }
    }

    public Recipe fetchRecipeDetails(String mealId) throws TheMealDBException {
        try {
            String url = THEMEALDB_API_BASE + "/lookup.php?i=" + mealId;
            HttpRequest request = HttpRequest.newBuilder()
                .uri(new URI(url))
                .timeout(TIMEOUT)
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new TheMealDBException("Recipe not found: " + mealId);
            }

            JsonNode jsonNode = objectMapper.readTree(response.body());
            JsonNode meals = jsonNode.get("meals");

            if (meals != null && meals.isArray() && meals.size() > 0) {
                return objectMapper.treeToValue(meals.get(0), Recipe.class);
            }

            throw new TheMealDBException("Recipe not found: " + mealId);
        } catch (java.net.http.HttpTimeoutException e) {
            throw new TheMealDBException("TheMealDB request timed out after " + TIMEOUT.toSeconds() + " seconds");
        } catch (TheMealDBException e) {
            throw e;
        } catch (Exception e) {
            throw new TheMealDBException("Failed to fetch recipe details: " + e.getMessage());
        }
    }

    public static class TheMealDBException extends Exception {
        public TheMealDBException(String message) {
            super(message);
        }
    }
}
