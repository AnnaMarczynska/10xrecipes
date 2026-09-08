package com.example._x_recipes.controller;

import com.example._x_recipes.entity.UserAllergen;
import com.example._x_recipes.service.AllergenService;
import com.example._x_recipes.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/allergens")
@CrossOrigin(origins = "*")
public class AllergenController {
    private final AllergenService allergenService;
    private final AuthService authService;

    private static final List<String> COMMON_ALLERGENS = Arrays.asList(
        "peanuts", "tree nuts", "milk", "eggs", "fish", "shellfish", "soy", "wheat",
        "sesame", "mustard", "celery", "sulfites"
    );

    public AllergenController(AllergenService allergenService, AuthService authService) {
        this.allergenService = allergenService;
        this.authService = authService;
    }

    @GetMapping("/common")
    public ResponseEntity<?> getCommonAllergens() {
        Map<String, Object> response = new HashMap<>();
        response.put("data", Map.of("allergens", COMMON_ALLERGENS));
        response.put("status", 200);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> addAllergen(@RequestBody AddAllergenRequest request) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            return ResponseEntity.ok(allergenService.addAllergen(user, request.getAllergen()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllergens() {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            List<UserAllergen> allergens = allergenService.getUserAllergensWithId(user);
            List<Map<String, Object>> response = allergens.stream().map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("allergen", a.getAllergen());
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("allergens", response, "total", response.size()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeAllergen(@PathVariable Long id) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            allergenService.removeAllergen(user, id);
            return ResponseEntity.ok(Map.of("message", "Allergen removed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class AddAllergenRequest {
        private String allergen;

        public String getAllergen() { return allergen; }
        public void setAllergen(String allergen) { this.allergen = allergen; }
    }
}
