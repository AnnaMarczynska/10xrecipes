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
    private static final double INGREDIENT_WEIGHT = 0.6;
    private static final double COOK_TIME_WEIGHT = 0.4;

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
            .sorted((a, b) -> b.getScore().compareTo(a.getScore()))
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

            // Calculate ingredient overlap percentage
            Set<String> normalizedRecipeIngredients = recipeIngredients.stream()
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

            long matchCount = normalizedRecipeIngredients.stream()
                .filter(userIngredients::contains)
                .count();

            int matchPercentage = (int) ((matchCount * 100) / userIngredients.size());

            if (matchPercentage < MIN_MATCH_PERCENTAGE) {
                return null;
            }

            // Calculate cook time fit score
            double cookTimeScore = calculateCookTimeScore(recipe.getCookTime(), timeRange);

            // Calculate final score
            double score = (matchPercentage * INGREDIENT_WEIGHT) + (cookTimeScore * COOK_TIME_WEIGHT);

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

        // Score: 100 if within range, linearly decreasing 20 minutes beyond range
        if (recipeTime >= minTime && recipeTime <= maxTime) {
            return 100;
        } else if (recipeTime < minTime) {
            int diff = minTime - recipeTime;
            if (diff > 20) return 0;
            return (20 - diff) * 5.0; // Linear from 100 at minTime to 0 at minTime-20
        } else {
            int diff = recipeTime - maxTime;
            if (diff > 20) return 0;
            return (20 - diff) * 5.0; // Linear from 100 at maxTime to 0 at maxTime+20
        }
    }
}
