package com.example._x_recipes.service;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.exception.DuplicateFavoriteException;
import com.example._x_recipes.exception.FavoriteNotFoundException;
import com.example._x_recipes.exception.UnauthorizedException;
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

    public Map<String, Object> addFavorite(User user, String recipeId, String recipeName) {
        if (favoriteRepository.existsByUserAndRecipeId(user, recipeId)) {
            throw new DuplicateFavoriteException(recipeId);
        }

        Favorite favorite = new Favorite(user, recipeId, recipeName);
        favoriteRepository.save(favorite);

        Map<String, Object> response = new HashMap<>();
        response.put("id", favorite.getId());
        response.put("recipeId", favorite.getRecipeId());
        response.put("recipeName", favorite.getRecipeName());
        response.put("addedAt", favorite.getAddedAt());
        response.put("favorite", favorite);
        return response;
    }

    public void removeFavorite(User user, Long favoriteId) {
        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new FavoriteNotFoundException(favoriteId));

        if (!favorite.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You do not have permission to delete this favorite");
        }

        favoriteRepository.delete(favorite);
    }

    public List<Favorite> getUserFavorites(User user) {
        return favoriteRepository.findByUser(user);
    }

    public void updateFavoriteNotes(User user, Long favoriteId, String notes) {
        if (notes != null && notes.length() > 500) {
            throw new IllegalArgumentException("Notes cannot exceed 500 characters");
        }

        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new FavoriteNotFoundException(favoriteId));

        if (!favorite.getUser().getId().equals(user.getId())) {
            throw new UnauthorizedException("You do not have permission to update this favorite");
        }

        favorite.setNotes(notes);
        favoriteRepository.save(favorite);
    }
}
