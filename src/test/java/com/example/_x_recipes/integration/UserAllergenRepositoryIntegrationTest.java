package com.example._x_recipes.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.entity.UserAllergen;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;

public class UserAllergenRepositoryIntegrationTest extends IntegrationTest {
  private User testUser;

  @BeforeEach
  public void setup() {
    testUser = new User("allergen@example.com", "password123");
    testUser = userRepository.save(testUser);
  }

  @Test
  public void testCreateAllergen() {
    UserAllergen allergen = new UserAllergen(testUser, "peanuts");
    UserAllergen saved = allergenRepository.save(allergen);

    assertNotNull(saved.getId());
    assertEquals("peanuts", saved.getAllergen());
  }

  @Test
  public void testDuplicateAllergenConstraint() {
    UserAllergen allergen1 = new UserAllergen(testUser, "peanuts");
    allergenRepository.save(allergen1);

    UserAllergen allergen2 = new UserAllergen(testUser, "peanuts");
    assertThrows(DataIntegrityViolationException.class, () -> {
      allergenRepository.save(allergen2);
      allergenRepository.flush();
    });
  }

  @Test
  public void testFindByUser() {
    UserAllergen allergen1 = new UserAllergen(testUser, "peanuts");
    UserAllergen allergen2 = new UserAllergen(testUser, "shellfish");
    allergenRepository.save(allergen1);
    allergenRepository.save(allergen2);

    List<UserAllergen> allergens = allergenRepository.findByUser(testUser);
    assertEquals(2, allergens.size());
  }

  @Test
  public void testAllergenDeletion() {
    UserAllergen allergen = new UserAllergen(testUser, "peanuts");
    UserAllergen saved = allergenRepository.save(allergen);

    allergenRepository.delete(saved);

    List<UserAllergen> allergens = allergenRepository.findByUser(testUser);
    assertEquals(0, allergens.size());

    User loaded = userRepository.findById(testUser.getId()).get();
    assertNotNull(loaded);
  }

  @Test
  public void testExistsByUserAndAllergen() {
    UserAllergen allergen = new UserAllergen(testUser, "peanuts");
    allergenRepository.save(allergen);

    boolean exists = allergenRepository.existsByUserAndAllergen(testUser, "peanuts");
    assertTrue(exists);

    boolean notExists = allergenRepository.existsByUserAndAllergen(testUser, "dairy");
    assertFalse(notExists);
  }
}
