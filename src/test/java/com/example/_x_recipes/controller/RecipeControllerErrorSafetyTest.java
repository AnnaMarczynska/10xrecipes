package com.example._x_recipes.controller;

import com.example._x_recipes.client.TheMealDBClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for error message safety in RecipeController.
 * Verifies that error responses contain no mealId, exception details, or stack traces.
 * Tests R5 oracle requirement: error messages must be generic to prevent information leakage.
 */
@SpringBootTest
@AutoConfigureMockMvc
class RecipeControllerErrorSafetyTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TheMealDBClient theMealDBClient;

    @Test
    void testSearchErrorResponseDoesNotLeakExceptionDetails() throws Exception {
        // Mock TheMealDBClient to throw exception with sensitive info
        when(theMealDBClient.fetchAllRecipes())
            .thenThrow(new TheMealDBClient.TheMealDBException("Database connection failed: postgres://db:5432"));

        MvcResult result = mockMvc.perform(
            post("/api/recipes/search")
                .contentType("application/json")
                .content("{\"ingredients\": [\"chicken\"], \"timeRange\": \"30-60\"}")
        ).andExpect(status().is5xxServerError()).andReturn();

        String response = result.getResponse().getContentAsString();

        // Verify sensitive information is NOT leaked
        assertThat(response).doesNotContain("postgres://");
        assertThat(response).doesNotContain("Database connection failed");
        assertThat(response).doesNotContain("Exception");
        assertThat(response).doesNotContain("Throwable");
        // TheMealDBException returns 504 with safe message
        assertThat(response).contains("Recipe service unavailable");
    }

    @Test
    void testDetailsErrorResponseDoesNotLeakMealId() throws Exception {
        // Mock TheMealDBClient to throw exception with sensitive info
        when(theMealDBClient.fetchRecipeDetails("999"))
            .thenThrow(new TheMealDBClient.TheMealDBException("Database error: invalid connection string"));

        MvcResult result = mockMvc.perform(
            get("/api/recipes/999/details")
        ).andExpect(status().is5xxServerError()).andReturn();

        String response = result.getResponse().getContentAsString();

        // Verify mealId and sensitive info are NOT exposed
        assertThat(response).doesNotContain("999");
        assertThat(response).doesNotContain("mealId");
        assertThat(response).doesNotContain("Database error");
        assertThat(response).doesNotContain("invalid connection string");
        assertThat(response).doesNotContain("TheMealDBException");
    }

    @Test
    void testDetailsTimeoutErrorDoesNotExposeThreshold() throws Exception {
        // Mock timeout exception that includes timeout duration
        when(theMealDBClient.fetchRecipeDetails(anyString()))
            .thenThrow(new TheMealDBClient.TheMealDBException("TheMealDB request timed out after 5 seconds"));

        MvcResult result = mockMvc.perform(
            get("/api/recipes/456/details")
        ).andExpect(status().is5xxServerError()).andReturn();

        String response = result.getResponse().getContentAsString();

        // Verify implementation details are hidden
        assertThat(response).doesNotContain("timed out");
        assertThat(response).doesNotContain("5 seconds");
        assertThat(response).doesNotContain("TheMealDB");
        assertThat(response).contains("Recipe service unavailable");
    }

    @Test
    void testSearchErrorResponseIsGeneric() throws Exception {
        // Mock unexpected exception
        when(theMealDBClient.fetchAllRecipes())
            .thenThrow(new RuntimeException("NullPointerException in cache layer"));

        MvcResult result = mockMvc.perform(
            post("/api/recipes/search")
                .contentType("application/json")
                .content("{\"ingredients\": [\"pasta\"], \"timeRange\": \"<30\"}")
        ).andExpect(status().is5xxServerError()).andReturn();

        String response = result.getResponse().getContentAsString();

        // Verify no implementation details exposed
        assertThat(response).doesNotContain("NullPointerException");
        assertThat(response).doesNotContain("cache layer");
        assertThat(response).contains("Internal server error");
        assertThat(response).doesNotContain("stackTrace");
    }

    @Test
    void testDetailsErrorResponseDoesNotContainStackTrace() throws Exception {
        // Mock exception that might include stack info
        when(theMealDBClient.fetchRecipeDetails(anyString()))
            .thenThrow(new TheMealDBClient.TheMealDBException("at com.example.Recipe.parse(Recipe.java:42)"));

        MvcResult result = mockMvc.perform(
            get("/api/recipes/789/details")
        ).andExpect(status().is5xxServerError()).andReturn();

        String response = result.getResponse().getContentAsString();

        // Verify file paths and line numbers are hidden
        assertThat(response).doesNotContain("Recipe.java");
        assertThat(response).doesNotContain(":42");
        assertThat(response).doesNotContain("at com.example");
        assertThat(response).contains("Recipe service unavailable");
    }
}
