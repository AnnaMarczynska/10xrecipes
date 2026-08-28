package com.example._x_recipes.service;

import com.example._x_recipes.model.Recipe;
import com.example._x_recipes.model.RecipeResult;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecipeSearchService {

    private static final int MIN_MATCH_PERCENTAGE = 50;
    private static final double INGREDIENT_WEIGHT = 0.4;  // Reduced from 0.6
    private static final double COOK_TIME_WEIGHT = 0.6;   // Increased from 0.4

    public List<RecipeResult> searchRecipes(List<String> userIngredients, String timeRange, List<Recipe> allRecipes) {
        if (userIngredients == null || userIngredients.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        // Normalize user ingredients to lowercase
        Set<String> normalizedUserIngredients = userIngredients.stream()
            .map(String::toLowerCase)
            .collect(Collectors.toSet());

        // Filter and score recipes
        List<RecipeResult> results = allRecipes.stream()
            .map(recipe -> scoreRecipe(recipe, normalizedUserIngredients, timeRange))
            .filter(result -> result != null && result.getMatchPercentage() >= MIN_MATCH_PERCENTAGE)
            .filter(result -> isWithinTimeRange(result.getCookTime(), timeRange))  // Filter out recipes outside time range
            .sorted((a, b) -> {
                // Sort by cook time ascending (shortest first)
                if (a.getCookTime() != null && b.getCookTime() != null) {
                    return a.getCookTime().compareTo(b.getCookTime());
                }
                return 0;
            })
            .limit(10)
            .collect(Collectors.toList());

        return results;
    }

    private RecipeResult scoreRecipe(Recipe recipe, Set<String> userIngredients, String timeRange) {
        try {
            List<String> recipeIngredients = recipe.getIngredients();
            if (recipeIngredients == null || recipeIngredients.isEmpty()) {
                return null;
            }

            // Calculate ingredient overlap percentage using substring matching
            int matchCount = 0;
            for (String userIngredient : userIngredients) {
                boolean found = recipeIngredients.stream()
                    .anyMatch(recipeIng -> recipeIng.toLowerCase().contains(userIngredient.toLowerCase()));
                if (found) {
                    matchCount++;
                }
            }

            int matchPercentage = (int) ((matchCount * 100) / userIngredients.size());

            if (matchPercentage < MIN_MATCH_PERCENTAGE) {
                return null;
            }

            // Calculate cook time fit score
            double cookTimeScore = calculateCookTimeScore(recipe.getCookTime(), timeRange);

            // Calculate final score
            double score = (matchPercentage * INGREDIENT_WEIGHT) + (cookTimeScore * COOK_TIME_WEIGHT);

            if (matchPercentage >= 100) {
                System.out.println("DEBUG: " + recipe.getName() + " - cookTime=" + recipe.getCookTime() + " timeRange=" + timeRange + " cookTimeScore=" + cookTimeScore + " score=" + score);
            }

            return new RecipeResult(
                recipe.getId(),
                recipe.getName(),
                recipe.getImage(),
                recipe.getCookTime(),
                (int) matchCount,
                matchPercentage,
                Math.round(score * 10.0) / 10.0
            );
        } catch (Exception e) {
            return null;
        }
    }

    private boolean isWithinTimeRange(Integer recipeTime, String timeRange) {
        if (recipeTime == null || recipeTime <= 0) {
            return false;
        }

        // Parse time range
        int minTime = 0, maxTime = Integer.MAX_VALUE;

        if ("<15".equals(timeRange)) {
            maxTime = 15;
        } else if ("15-30".equals(timeRange)) {
            minTime = 15;
            maxTime = 30;
        } else if ("30-60".equals(timeRange)) {
            minTime = 30;
            maxTime = 60;
        } else if ("60+".equals(timeRange)) {
            minTime = 60;
        }

        // Strict filtering: only recipes within the range
        return recipeTime >= minTime && recipeTime <= maxTime;
    }

    private double calculateCookTimeScore(Integer recipeTime, String timeRange) {
        if (recipeTime == null || recipeTime <= 0) {
            return 0;
        }

        // Parse time range (e.g., "30-60", "<15", "60+")
        int minTime = 0, maxTime = Integer.MAX_VALUE;

        if ("<15".equals(timeRange)) {
            maxTime = 15;
        } else if ("15-30".equals(timeRange)) {
            minTime = 15;
            maxTime = 30;
        } else if ("30-60".equals(timeRange)) {
            minTime = 30;
            maxTime = 60;
        } else if ("60+".equals(timeRange)) {
            minTime = 60;
        }

        // Perfect score if within range
        if (recipeTime >= minTime && recipeTime <= maxTime) {
            return 100;
        }

        // Outside range: penalty based on distance
        if (recipeTime < minTime) {
            int diff = minTime - recipeTime;
            // Harsh penalty for being below range
            return Math.max(0, 50 - diff * 5);  // Decreases by 5 per minute below
        } else {
            int diff = recipeTime - maxTime;
            // Harsh penalty for being above range
            return Math.max(0, 50 - diff * 5);  // Decreases by 5 per minute above
        }
    }
}
