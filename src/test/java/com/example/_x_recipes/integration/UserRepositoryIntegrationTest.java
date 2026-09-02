package com.example._x_recipes.integration;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.entity.Favorite;
import java.util.Optional;

public class UserRepositoryIntegrationTest extends IntegrationTest {

  @Test
  public void testCreateAndFetchUser() {
    User user = new User("test@example.com", "password123");
    User saved = userRepository.save(user);

    assertNotNull(saved.getId());
    assertEquals("test@example.com", saved.getEmail());
    assertEquals("password123", saved.getPassword());
  }

  @Test
  public void testFindByEmail() {
    User user = new User("search@example.com", "password123");
    userRepository.save(user);

    Optional<User> found = userRepository.findByEmail("search@example.com");
    assertTrue(found.isPresent());
    assertEquals("search@example.com", found.get().getEmail());
  }

  @Test
  public void testUserFavoritesRelationship() {
    User user = new User("favorites@example.com", "password123");
    User saved = userRepository.save(user);

    Favorite fav1 = new Favorite(saved, "recipe123", "Pasta");
    Favorite fav2 = new Favorite(saved, "recipe456", "Salad");
    favoriteRepository.save(fav1);
    favoriteRepository.save(fav2);

    User loaded = userRepository.findById(saved.getId()).get();
    assertEquals(2, loaded.getFavorites().size());
  }

  @Test
  public void testUserAllergensCascade() {
    User user = new User("allergen@example.com", "password123");
    User saved = userRepository.save(user);

    com.example._x_recipes.entity.UserAllergen allergen = new com.example._x_recipes.entity.UserAllergen(saved, "peanuts");
    allergenRepository.save(allergen);

    User loaded = userRepository.findById(saved.getId()).get();
    assertEquals(1, loaded.getAllergens().size());
  }
}
