package com.example._x_recipes.service;

import com.example._x_recipes.entity.User;
import com.example._x_recipes.entity.UserAllergen;
import com.example._x_recipes.model.Recipe;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AllergenFilterService {

    public List<Recipe> filterByUserAllergens(List<Recipe> recipes, User user) {
        if (user == null || user.getAllergens() == null || user.getAllergens().isEmpty()) {
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
