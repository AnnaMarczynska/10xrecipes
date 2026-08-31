package com.example._x_recipes.controller;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.service.FavoriteService;
import com.example._x_recipes.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/favorites")
@CrossOrigin(origins = "*")
public class FavoriteController {
    private final FavoriteService favoriteService;
    private final AuthService authService;

    public FavoriteController(FavoriteService favoriteService, AuthService authService) {
        this.favoriteService = favoriteService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody AddFavoriteRequest request) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            return ResponseEntity.ok(favoriteService.addFavorite(user, request.getRecipeId(), request.getRecipeName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getFavorites() {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            List<Favorite> favorites = favoriteService.getUserFavorites(user);
            List<Map<String, Object>> response = favorites.stream().map(fav -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", fav.getId());
                map.put("recipeId", fav.getRecipeId());
                map.put("recipeName", fav.getRecipeName());
                map.put("notes", fav.getNotes());
                map.put("addedAt", fav.getAddedAt());
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(Map.of("favorites", response, "total", response.size()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long id) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            favoriteService.removeFavorite(user, id);
            return ResponseEntity.ok(Map.of("message", "Favorite removed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<?> updateFavoriteNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            favoriteService.updateFavoriteNotes(user, id, request.getNotes());
            return ResponseEntity.ok(Map.of("message", "Notes updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class AddFavoriteRequest {
        private String recipeId;
        private String recipeName;

        public String getRecipeId() { return recipeId; }
        public void setRecipeId(String recipeId) { this.recipeId = recipeId; }

        public String getRecipeName() { return recipeName; }
        public void setRecipeName(String recipeName) { this.recipeName = recipeName; }
    }

    public static class UpdateNotesRequest {
        private String notes;

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }
}
