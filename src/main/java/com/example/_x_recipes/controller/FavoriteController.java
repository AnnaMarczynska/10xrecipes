package com.example._x_recipes.controller;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.model.ErrorDetail;
import com.example._x_recipes.service.FavoriteService;
import com.example._x_recipes.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
    public ResponseEntity<ApiResponse<?>> addFavorite(@RequestBody AddFavoriteRequest request) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            var result = favoriteService.addFavorite(user, request.getRecipeId(), request.getRecipeName());

            Favorite fav = (Favorite) result.get("favorite");
            FavoriteDTO dto = new FavoriteDTO(fav.getId(), fav.getRecipeId(), fav.getRecipeName(), fav.getNotes(), fav.getAddedAt());
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto, HttpStatus.CREATED.value()));
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("already")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("DUPLICATE_FAVORITE", e.getMessage(), null, HttpStatus.CONFLICT.value()));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("ADD_FAVORITE_ERROR", e.getMessage(), null, HttpStatus.BAD_REQUEST.value()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getFavorites() {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            List<Favorite> favorites = favoriteService.getUserFavorites(user);

            List<FavoriteDTO> dtos = favorites.stream()
                .map(fav -> new FavoriteDTO(fav.getId(), fav.getRecipeId(), fav.getRecipeName(), fav.getNotes(), fav.getAddedAt()))
                .collect(Collectors.toList());

            FavoritesListDTO listDto = new FavoritesListDTO(dtos, dtos.size());
            return ResponseEntity.ok(ApiResponse.success(listDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("GET_FAVORITES_ERROR", e.getMessage(), null, HttpStatus.UNAUTHORIZED.value()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> removeFavorite(@PathVariable Long id) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            favoriteService.removeFavorite(user, id);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("UNAUTHORIZED_DELETE", e.getMessage(), null, HttpStatus.FORBIDDEN.value()));
            }
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("FAVORITE_NOT_FOUND", e.getMessage(), null, HttpStatus.NOT_FOUND.value()));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("DELETE_FAVORITE_ERROR", e.getMessage(), null, HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<?>> updateFavoriteNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            favoriteService.updateFavoriteNotes(user, id, request.getNotes());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("UNAUTHORIZED_UPDATE", e.getMessage(), null, HttpStatus.FORBIDDEN.value()));
            }
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("FAVORITE_NOT_FOUND", e.getMessage(), null, HttpStatus.NOT_FOUND.value()));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("UPDATE_NOTES_ERROR", e.getMessage(), null, HttpStatus.BAD_REQUEST.value()));
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

    public static class FavoriteDTO {
        private Long id;
        private String recipeId;
        private String recipeName;
        private String notes;
        private LocalDateTime addedAt;

        public FavoriteDTO(Long id, String recipeId, String recipeName, String notes, LocalDateTime addedAt) {
            this.id = id;
            this.recipeId = recipeId;
            this.recipeName = recipeName;
            this.notes = notes;
            this.addedAt = addedAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getRecipeId() { return recipeId; }
        public void setRecipeId(String recipeId) { this.recipeId = recipeId; }

        public String getRecipeName() { return recipeName; }
        public void setRecipeName(String recipeName) { this.recipeName = recipeName; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }

        public LocalDateTime getAddedAt() { return addedAt; }
        public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }
    }

    public static class FavoritesListDTO {
        private List<FavoriteDTO> favorites;
        private Integer total;

        public FavoritesListDTO(List<FavoriteDTO> favorites, Integer total) {
            this.favorites = favorites;
            this.total = total;
        }

        public List<FavoriteDTO> getFavorites() { return favorites; }
        public void setFavorites(List<FavoriteDTO> favorites) { this.favorites = favorites; }

        public Integer getTotal() { return total; }
        public void setTotal(Integer total) { this.total = total; }
    }
}
