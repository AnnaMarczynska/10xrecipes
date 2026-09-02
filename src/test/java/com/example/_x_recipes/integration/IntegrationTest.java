package com.example._x_recipes.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Testcontainers;
import com.example._x_recipes.repository.UserAllergenRepository;
import com.example._x_recipes.repository.FavoriteRepository;
import com.example._x_recipes.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
public abstract class IntegrationTest {
  @Autowired
  protected UserRepository userRepository;

  @Autowired
  protected FavoriteRepository favoriteRepository;

  @Autowired
  protected UserAllergenRepository allergenRepository;
}
