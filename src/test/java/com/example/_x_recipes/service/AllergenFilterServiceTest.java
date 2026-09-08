package com.example._x_recipes.service;

import com.example._x_recipes.entity.User;
import com.example._x_recipes.entity.UserAllergen;
import com.example._x_recipes.model.Recipe;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AllergenFilterService - Allergen Safety Tests")
class AllergenFilterServiceTest {

    private AllergenFilterService allergenFilterService;
    private User userWithAllergens;
    private User userWithoutAllergens;

    @BeforeEach
    void setUp() {
        allergenFilterService = new AllergenFilterService();

        // User with peanut allergen
        userWithAllergens = new User();
        userWithAllergens.setId(1L);
        UserAllergen allergen = new UserAllergen();
        allergen.setAllergen("peanut");
        userWithAllergens.setAllergens(List.of(allergen));

        // User with no allergens
        userWithoutAllergens = new User();
        userWithoutAllergens.setId(2L);
        userWithoutAllergens.setAllergens(new ArrayList<>());
    }

    @Test
    @DisplayName("Should filter out recipes containing user allergen (lowercase match)")
    void testFilterRecipeWithUserAllergen() {
        Recipe recipe = new Recipe();
        recipe.setName("Peanut Butter Cookie");
        recipe.setAllergens(Arrays.asList("peanut", "dairy"));

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertTrue(filtered.isEmpty(), "Recipe with peanut should be filtered out");
    }

    @Test
    @DisplayName("Should keep recipes without user allergen")
    void testKeepRecipeWithoutUserAllergen() {
        Recipe recipe = new Recipe();
        recipe.setName("Chicken Pasta");
        recipe.setAllergens(Arrays.asList("gluten", "dairy"));

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertEquals(1, filtered.size(), "Recipe without peanut should be kept");
        assertEquals("Chicken Pasta", filtered.get(0).getName());
    }

    @Test
    @DisplayName("Should match allergens case-insensitively")
    void testCaseInsensitiveAllergenMatching() {
        Recipe recipe1 = new Recipe();
        recipe1.setName("Recipe1");
        recipe1.setAllergens(List.of("Peanut")); // Capitalized

        Recipe recipe2 = new Recipe();
        recipe2.setName("Recipe2");
        recipe2.setAllergens(List.of("PEANUT")); // All caps

        List<Recipe> recipes = Arrays.asList(recipe1, recipe2);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertTrue(filtered.isEmpty(), "Both recipes with case variations of peanut should be filtered");
    }

    @Test
    @DisplayName("Should match partial ingredient names (peanut matches peanuts)")
    void testPartialAllergenMatching() {
        Recipe recipe = new Recipe();
        recipe.setName("Recipe with Peanuts");
        recipe.setAllergens(List.of("peanuts")); // plural

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertTrue(filtered.isEmpty(), "peanuts should match peanut allergen");
    }

    @Test
    @DisplayName("Should respect multiple user allergens")
    void testMultipleUserAllergens() {
        User userWithMultipleAllergens = new User();
        userWithMultipleAllergens.setId(3L);
        UserAllergen allergen1 = new UserAllergen();
        allergen1.setAllergen("peanut");
        UserAllergen allergen2 = new UserAllergen();
        allergen2.setAllergen("milk");
        userWithMultipleAllergens.setAllergens(Arrays.asList(allergen1, allergen2));

        Recipe recipe1 = new Recipe();
        recipe1.setName("Peanut Recipe");
        recipe1.setAllergens(List.of("peanut"));

        Recipe recipe2 = new Recipe();
        recipe2.setName("Dairy Recipe");
        recipe2.setAllergens(List.of("milk"));

        Recipe recipe3 = new Recipe();
        recipe3.setName("Safe Recipe");
        recipe3.setAllergens(List.of("gluten"));

        List<Recipe> recipes = Arrays.asList(recipe1, recipe2, recipe3);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithMultipleAllergens);

        assertEquals(1, filtered.size(), "Only recipe3 should remain");
        assertEquals("Safe Recipe", filtered.get(0).getName());
    }

    @Test
    @DisplayName("Should return all recipes when user has no allergens")
    void testNoAllergyFiltering() {
        Recipe recipe1 = new Recipe();
        recipe1.setName("Recipe1");
        recipe1.setAllergens(List.of("peanut"));

        Recipe recipe2 = new Recipe();
        recipe2.setName("Recipe2");
        recipe2.setAllergens(List.of("milk"));

        List<Recipe> recipes = Arrays.asList(recipe1, recipe2);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithoutAllergens);

        assertEquals(2, filtered.size(), "All recipes should be returned when user has no allergens");
    }

    @Test
    @DisplayName("Should return all recipes when user is null")
    void testNullUserReturnsAllRecipes() {
        Recipe recipe = new Recipe();
        recipe.setName("Recipe");
        recipe.setAllergens(List.of("peanut"));

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, null);

        assertEquals(1, filtered.size(), "Null user should return all recipes without filtering");
    }

    @Test
    @DisplayName("Should handle recipes with no allergens list")
    void testRecipeWithNullAllergens() {
        Recipe recipe = new Recipe();
        recipe.setName("Recipe");
        recipe.setAllergens(null);

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertEquals(1, filtered.size(), "Recipe with null allergens should be kept");
    }

    @Test
    @DisplayName("Should handle recipes with empty allergens list")
    void testRecipeWithEmptyAllergens() {
        Recipe recipe = new Recipe();
        recipe.setName("Recipe");
        recipe.setAllergens(new ArrayList<>());

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertEquals(1, filtered.size(), "Recipe with empty allergens should be kept");
    }

    @Test
    @DisplayName("Should handle empty recipe list")
    void testEmptyRecipeList() {
        List<Recipe> recipes = new ArrayList<>();
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertTrue(filtered.isEmpty(), "Empty recipe list should return empty");
    }

    @Test
    @DisplayName("Should filter recipe with allergen in larger list")
    void testFilterFromMultipleAllergens() {
        Recipe recipe = new Recipe();
        recipe.setName("Complex Recipe");
        recipe.setAllergens(Arrays.asList("wheat", "peanut", "sesame", "dairy"));

        List<Recipe> recipes = List.of(recipe);
        List<Recipe> filtered = allergenFilterService.filterByUserAllergens(recipes, userWithAllergens);

        assertTrue(filtered.isEmpty(), "Recipe should be filtered even with multiple allergens");
    }
}
