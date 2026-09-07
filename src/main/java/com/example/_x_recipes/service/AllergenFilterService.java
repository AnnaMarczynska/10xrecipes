package com.example._x_recipes.service;

import com.example._x_recipes.entity.User;
import com.example._x_recipes.entity.UserAllergen;
import com.example._x_recipes.model.Recipe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AllergenFilterService {
    private static final Logger logger = LoggerFactory.getLogger(AllergenFilterService.class);

    public List<Recipe> filterByUserAllergens(List<Recipe> recipes, User user) {
        if (user == null) {
            logger.warn("User is null, returning all recipes without allergen filtering");
            return recipes;
        }

        if (user.getAllergens() == null || user.getAllergens().isEmpty()) {
            logger.debug("User has no allergens set, returning all recipes");
            return recipes;
        }

        Set<String> userAllergens = user.getAllergens()
            .stream()
            .map(UserAllergen::getAllergen)
            .collect(Collectors.toSet());

        return recipes.stream()
            .filter(recipe -> recipe.getAllergens() == null ||
                              recipe.getAllergens().isEmpty() ||
                              recipe.getAllergens().stream()
                                .noneMatch(userAllergens::contains))
            .collect(Collectors.toList());
    }
}
