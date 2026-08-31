package com.example._x_recipes.service;

import com.example._x_recipes.entity.UserAllergen;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.repository.UserAllergenRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AllergenService {
    private final UserAllergenRepository userAllergenRepository;

    public AllergenService(UserAllergenRepository userAllergenRepository) {
        this.userAllergenRepository = userAllergenRepository;
    }

    public Map<String, Object> addAllergen(User user, String allergen) throws Exception {
        if (allergen == null || allergen.trim().isEmpty()) {
            throw new Exception("Allergen name cannot be empty");
        }

        allergen = allergen.trim().toLowerCase();

        if (allergen.length() > 50) {
            throw new Exception("Allergen name cannot exceed 50 characters");
        }
        if (allergen.length() < 2) {
            throw new Exception("Allergen name must be at least 2 characters");
        }

        if (userAllergenRepository.existsByUserAndAllergen(user, allergen)) {
            throw new Exception("Allergen already in profile");
        }

        UserAllergen userAllergen = new UserAllergen(user, allergen);
        userAllergenRepository.save(userAllergen);

        Map<String, Object> response = new HashMap<>();
        response.put("id", userAllergen.getId());
        response.put("allergen", userAllergen.getAllergen());
        return response;
    }

    public void removeAllergen(User user, Long allergenId) throws Exception {
        UserAllergen allergen = userAllergenRepository.findById(allergenId)
                .orElseThrow(() -> new Exception("Allergen not found"));

        if (!allergen.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized");
        }

        userAllergenRepository.delete(allergen);
    }

    public List<String> getUserAllergens(User user) {
        return userAllergenRepository.findByUser(user).stream()
                .map(UserAllergen::getAllergen)
                .collect(Collectors.toList());
    }

    public List<UserAllergen> getUserAllergensWithId(User user) {
        return userAllergenRepository.findByUser(user);
    }
}
