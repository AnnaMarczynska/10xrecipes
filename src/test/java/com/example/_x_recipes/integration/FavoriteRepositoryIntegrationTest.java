package com.example._x_recipes.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.entity.Favorite;
import java.util.List;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;

public class FavoriteRepositoryIntegrationTest extends IntegrationTest {
  private User testUser;

  @BeforeEach
  public void setup() {
    testUser = new User("favor@example.com", "password123");
    testUser = userRepository.save(testUser);
  }

  @Test
  public void testCreateFavorite() {
    Favorite fav = new Favorite(testUser, "recipe123", "Pasta Carbonara");
    Favorite saved = favoriteRepository.save(fav);

    assertNotNull(saved.getId());
    assertEquals("recipe123", saved.getRecipeId());
    assertEquals("Pasta Carbonara", saved.getRecipeName());
  }

  @Test
  public void testDuplicateFavoriteUniqueConstraint() {
    Favorite fav1 = new Favorite(testUser, "recipe123", "Pasta");
    favoriteRepository.save(fav1);

    Favorite fav2 = new Favorite(testUser, "recipe123", "Pasta");
    assertThrows(DataIntegrityViolationException.class, () -> {
      favoriteRepository.save(fav2);
      favoriteRepository.flush();
    });
  }

  @Test
  public void testFavoritesPerUser() {
    Favorite fav1 = new Favorite(testUser, "recipe1", "Recipe 1");
    Favorite fav2 = new Favorite(testUser, "recipe2", "Recipe 2");
    Favorite fav3 = new Favorite(testUser, "recipe3", "Recipe 3");

    favoriteRepository.save(fav1);
    favoriteRepository.save(fav2);
    favoriteRepository.save(fav3);

    List<Favorite> favorites = favoriteRepository.findByUser(testUser);
    assertEquals(3, favorites.size());
  }

  @Test
  public void testDeleteFavorite() {
    Favorite fav = new Favorite(testUser, "recipe123", "Pasta");
    Favorite saved = favoriteRepository.save(fav);

    favoriteRepository.delete(saved);

    List<Favorite> favorites = favoriteRepository.findByUser(testUser);
    assertEquals(0, favorites.size());

    User loaded = userRepository.findById(testUser.getId()).get();
    assertNotNull(loaded);
  }

  @Test
  public void testFindByUserAndRecipeId() {
    Favorite fav = new Favorite(testUser, "recipe123", "Pasta");
    favoriteRepository.save(fav);

    Optional<Favorite> found = favoriteRepository.findByUserAndRecipeId(testUser, "recipe123");
    assertTrue(found.isPresent());
    assertEquals("Pasta", found.get().getRecipeName());
  }
}
