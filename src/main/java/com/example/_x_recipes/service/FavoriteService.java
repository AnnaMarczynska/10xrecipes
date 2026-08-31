package com.example._x_recipes.service;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.repository.FavoriteRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;

    public FavoriteService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    public Map<String, Object> addFavorite(User user, String recipeId, String recipeName) throws Exception {
        if (favoriteRepository.existsByUserAndRecipeId(user, recipeId)) {
            throw new Exception("Recipe already in favorites");
        }

        Favorite favorite = new Favorite(user, recipeId, recipeName);
        favoriteRepository.save(favorite);

        Map<String, Object> response = new HashMap<>();
        response.put("id", favorite.getId());
        response.put("recipeId", favorite.getRecipeId());
        response.put("recipeName", favorite.getRecipeName());
        response.put("addedAt", favorite.getAddedAt());
        return response;
    }

    public void removeFavorite(User user, Long favoriteId) throws Exception {
        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new Exception("Favorite not found"));

        if (!favorite.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized");
        }

        favoriteRepository.delete(favorite);
    }

    public List<Favorite> getUserFavorites(User user) {
        return favoriteRepository.findByUser(user);
    }

    public void updateFavoriteNotes(User user, Long favoriteId, String notes) throws Exception {
        if (notes != null && notes.length() > 500) {
            throw new Exception("Notes cannot exceed 500 characters");
        }

        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new Exception("Favorite not found"));

        if (!favorite.getUser().getId().equals(user.getId())) {
            throw new Exception("Unauthorized");
        }

        favorite.setNotes(notes);
        favoriteRepository.save(favorite);
    }
}
