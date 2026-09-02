package com.example._x_recipes.controller;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.exception.DuplicateFavoriteException;
import com.example._x_recipes.exception.FavoriteNotFoundException;
import com.example._x_recipes.exception.UnauthorizedException;
import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.model.ErrorDetail;
import com.example._x_recipes.service.FavoriteService;
import com.example._x_recipes.service.AuthService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@CrossOrigin(origins = "${app.cors.allowed-origins:http://localhost:3000}")
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
        } catch (DuplicateFavoriteException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("DUPLICATE_FAVORITE", "Recipe already in favorites", null, HttpStatus.CONFLICT.value()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("ADD_FAVORITE_ERROR", "Failed to add favorite: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR.value()));
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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("GET_FAVORITES_ERROR", "Failed to retrieve favorites: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR.value()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> removeFavorite(@PathVariable Long id) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            favoriteService.removeFavorite(user, id);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("UNAUTHORIZED_DELETE", "You do not have permission to delete this favorite", null, HttpStatus.FORBIDDEN.value()));
        } catch (FavoriteNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("FAVORITE_NOT_FOUND", "Favorite not found", null, HttpStatus.NOT_FOUND.value()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("DELETE_FAVORITE_ERROR", "Failed to delete favorite", null, HttpStatus.BAD_REQUEST.value()));
        }
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<?>> updateFavoriteNotes(@PathVariable Long id, @RequestBody UpdateNotesRequest request) {
        try {
            String email = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            var user = authService.getUserByEmail(email);
            favoriteService.updateFavoriteNotes(user, id, request.getNotes());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (UnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("UNAUTHORIZED_UPDATE", "You do not have permission to update this favorite", null, HttpStatus.FORBIDDEN.value()));
        } catch (FavoriteNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("FAVORITE_NOT_FOUND", "Favorite not found", null, HttpStatus.NOT_FOUND.value()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("INVALID_NOTES", "Notes cannot exceed 500 characters", null, HttpStatus.BAD_REQUEST.value()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error("UPDATE_NOTES_ERROR", "Failed to update favorite notes", null, HttpStatus.BAD_REQUEST.value()));
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AddFavoriteRequest {
        private String recipeId;
        private String recipeName;

        public String getRecipeId() { return recipeId; }
        public void setRecipeId(String recipeId) { this.recipeId = recipeId; }

        public String getRecipeName() { return recipeName; }
        public void setRecipeName(String recipeName) { this.recipeName = recipeName; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UpdateNotesRequest {
        private String notes;

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
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

    @JsonIgnoreProperties(ignoreUnknown = true)
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
