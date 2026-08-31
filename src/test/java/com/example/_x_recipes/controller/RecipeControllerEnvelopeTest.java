package com.example._x_recipes.controller;

import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.model.ErrorDetail;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RecipeControllerEnvelopeTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testSearchResponseEnvelopeStructure() {
        // Test that ApiResponse creates proper envelope structure for search
        var results = new java.util.HashMap<String, Object>();
        results.put("results", java.util.List.of());
        results.put("total", 0);

        ApiResponse<?> response = ApiResponse.success(results, 200);

        assertEquals(results, response.getData());
        assertNull(response.getError());
        assertEquals(200, response.getStatus());
    }

    @Test
    void testSearchErrorEnvelopeStructure() {
        // Test that ApiResponse creates proper error envelope
        ErrorDetail error = new ErrorDetail("INVALID_REQUEST", "ingredients list required", "ingredients");
        ApiResponse<?> response = ApiResponse.error(error, 400);

        assertNull(response.getData());
        assertNotNull(response.getError());
        assertEquals("INVALID_REQUEST", response.getError().getCode());
        assertEquals("ingredients list required", response.getError().getMessage());
        assertEquals(400, response.getStatus());
    }

    @Test
    void testRecipeDetailsResponseEnvelopeStructure() {
        // Test envelope structure for recipe details
        var recipeData = new java.util.HashMap<String, Object>();
        recipeData.put("id", "123");
        recipeData.put("name", "Chicken Curry");

        ApiResponse<?> response = ApiResponse.success(recipeData, 200);

        assertEquals(recipeData, response.getData());
        assertNull(response.getError());
        assertEquals(200, response.getStatus());
    }

    @Test
    void testRecipeDetailsErrorEnvelopeStructure() {
        // Test error envelope for recipe not found
        ErrorDetail error = new ErrorDetail("NOT_FOUND", "Recipe not found", "id: invalid");
        ApiResponse<?> response = ApiResponse.error(error, 404);

        assertNull(response.getData());
        assertNotNull(response.getError());
        assertEquals("NOT_FOUND", response.getError().getCode());
        assertEquals(404, response.getStatus());
    }

    @Test
    void testTheMealDBServiceErrorEnvelopeStructure() {
        // Test error envelope for TheMealDB service errors
        ErrorDetail error = new ErrorDetail("THEMEALDB_ERROR", "Recipe service unavailable", "Connection timeout");
        ApiResponse<?> response = ApiResponse.error(error, 504);

        assertNull(response.getData());
        assertNotNull(response.getError());
        assertEquals("THEMEALDB_ERROR", response.getError().getCode());
        assertEquals("Recipe service unavailable", response.getError().getMessage());
        assertEquals(504, response.getStatus());
    }

    @Test
    void testErrorDetailSafety() {
        // Verify that error details don't include sensitive information markers
        ErrorDetail error = new ErrorDetail("ERROR", "message", "safe details only");

        assertFalse(error.getDetails().contains("java.lang"));
        assertFalse(error.getDetails().contains("at "));
        assertFalse(error.getDetails().contains(".java:"));
    }
}
