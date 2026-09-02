package com.example._x_recipes.controller;

import com.example._x_recipes.entity.User;
import com.example._x_recipes.integration.IntegrationTest;
import com.example._x_recipes.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
public class FavoriteControllerIntegrationTest extends IntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JwtTokenProvider jwtTokenProvider;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private ObjectMapper objectMapper;

  private User testUser;
  private String testToken;

  @BeforeEach
  public void setup() {
    favoriteRepository.deleteAll();
    userRepository.deleteAll();

    testUser = new User("test@example.com", passwordEncoder.encode("password123"));
    testUser = userRepository.save(testUser);
    testToken = jwtTokenProvider.generateToken(testUser.getEmail());
  }

  @Test
  public void testAddFavorite() throws Exception {
    String requestBody = """
        {
          "recipeId": "52850",
          "recipeName": "Chicken Couscous"
        }
        """;

    mockMvc.perform(post("/api/favorites")
        .header("Authorization", "Bearer " + testToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(requestBody))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value(201))
        .andExpect(jsonPath("$.data.recipeId").value("52850"))
        .andExpect(jsonPath("$.data.recipeName").value("Chicken Couscous"))
        .andExpect(jsonPath("$.data.id").exists());
  }

  @Test
  public void testAddDuplicateFavorite() throws Exception {
    String requestBody = """
        {
          "recipeId": "52850",
          "recipeName": "Chicken Couscous"
        }
        """;

    // Add first time
    mockMvc.perform(post("/api/favorites")
        .header("Authorization", "Bearer " + testToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(requestBody))
        .andExpect(status().isCreated());

    // Try to add again
    mockMvc.perform(post("/api/favorites")
        .header("Authorization", "Bearer " + testToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(requestBody))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.error.code").value("DUPLICATE_FAVORITE"));
  }

  @Test
  public void testGetFavorites() throws Exception {
    // Add a favorite first
    String requestBody = """
        {
          "recipeId": "52850",
          "recipeName": "Chicken Couscous"
        }
        """;

    mockMvc.perform(post("/api/favorites")
        .header("Authorization", "Bearer " + testToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(requestBody))
        .andExpect(status().isCreated());

    // Get favorites
    mockMvc.perform(get("/api/favorites")
        .header("Authorization", "Bearer " + testToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value(200))
        .andExpect(jsonPath("$.data.favorites", hasSize(1)))
        .andExpect(jsonPath("$.data.total").value(1))
        .andExpect(jsonPath("$.data.favorites[0].recipeId").value("52850"));
  }

  @Test
  public void testDeleteFavorite() throws Exception {
    // Add a favorite first
    String addRequest = """
        {
          "recipeId": "52850",
          "recipeName": "Chicken Couscous"
        }
        """;

    String addResponse = mockMvc.perform(post("/api/favorites")
        .header("Authorization", "Bearer " + testToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(addRequest))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse()
        .getContentAsString();

    // Extract favorite ID
    long favoriteId = objectMapper.readTree(addResponse)
        .at("/data/id")
        .asLong();

    // Delete it
    mockMvc.perform(delete("/api/favorites/" + favoriteId)
        .header("Authorization", "Bearer " + testToken))
        .andExpect(status().isOk());

    // Verify it's gone
    mockMvc.perform(get("/api/favorites")
        .header("Authorization", "Bearer " + testToken))
        .andExpect(jsonPath("$.data.favorites", hasSize(0)));
  }

  @Test
  public void testDeleteNonexistentFavorite() throws Exception {
    mockMvc.perform(delete("/api/favorites/999")
        .header("Authorization", "Bearer " + testToken))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("FAVORITE_NOT_FOUND"));
  }

  @Test
  public void testUnauthorizedDelete() throws Exception {
    // Add favorite as testUser
    String addRequest = """
        {
          "recipeId": "52850",
          "recipeName": "Chicken Couscous"
        }
        """;

    String addResponse = mockMvc.perform(post("/api/favorites")
        .header("Authorization", "Bearer " + testToken)
        .contentType(MediaType.APPLICATION_JSON)
        .content(addRequest))
        .andExpect(status().isCreated())
        .andReturn()
        .getResponse()
        .getContentAsString();

    long favoriteId = objectMapper.readTree(addResponse)
        .at("/data/id")
        .asLong();

    // Create another user
    User anotherUser = new User("another@example.com", passwordEncoder.encode("password123"));
    anotherUser = userRepository.save(anotherUser);
    String anotherToken = jwtTokenProvider.generateToken(anotherUser.getEmail());

    // Try to delete testUser's favorite as anotherUser
    mockMvc.perform(delete("/api/favorites/" + favoriteId)
        .header("Authorization", "Bearer " + anotherToken))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED_DELETE"));
  }

  @Test
  public void testMissingAuthToken() throws Exception {
    mockMvc.perform(get("/api/favorites"))
        .andExpect(status().isUnauthorized());
  }
}
