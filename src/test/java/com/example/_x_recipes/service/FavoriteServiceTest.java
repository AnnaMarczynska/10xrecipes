package com.example._x_recipes.service;

import com.example._x_recipes.entity.Favorite;
import com.example._x_recipes.entity.User;
import com.example._x_recipes.exception.DuplicateFavoriteException;
import com.example._x_recipes.exception.FavoriteNotFoundException;
import com.example._x_recipes.exception.UnauthorizedException;
import com.example._x_recipes.repository.FavoriteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FavoriteService - CRUD & Data Isolation Tests")
class FavoriteServiceTest {

    private FavoriteService favoriteService;

    @Mock
    private FavoriteRepository favoriteRepository;

    private User user1;
    private User user2;
    private Favorite favorite1;

    @BeforeEach
    void setUp() {
        favoriteService = new FavoriteService(favoriteRepository);

        user1 = new User();
        user1.setId(1L);
        user1.setEmail("user1@example.com");

        user2 = new User();
        user2.setId(2L);
        user2.setEmail("user2@example.com");

        favorite1 = new Favorite(user1, "recipe123", "Chicken Pasta");
        favorite1.setId(1L);
        favorite1.setAddedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should add favorite and persist to database")
    void testAddFavorite() {
        when(favoriteRepository.existsByUserAndRecipeId(user1, "recipe123")).thenReturn(false);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(favorite1);

        Map<String, Object> result = favoriteService.addFavorite(user1, "recipe123", "Chicken Pasta");

        assertEquals("recipe123", result.get("recipeId"));
        assertEquals("Chicken Pasta", result.get("recipeName"));
        assertNotNull(result.get("addedAt"));
        verify(favoriteRepository).save(any(Favorite.class));
    }

    @Test
    @DisplayName("Should reject duplicate favorite")
    void testAddDuplicateFavorite() {
        when(favoriteRepository.existsByUserAndRecipeId(user1, "recipe123")).thenReturn(true);

        assertThrows(DuplicateFavoriteException.class, () -> {
            favoriteService.addFavorite(user1, "recipe123", "Chicken Pasta");
        });

        verify(favoriteRepository, never()).save(any(Favorite.class));
    }

    @Test
    @DisplayName("Should retrieve only current user's favorites")
    void testGetUserFavorites() {
        Favorite favorite2 = new Favorite(user1, "recipe456", "Beef Stew");
        favorite2.setId(2L);

        List<Favorite> userFavorites = Arrays.asList(favorite1, favorite2);
        when(favoriteRepository.findByUser(user1)).thenReturn(userFavorites);

        List<Favorite> result = favoriteService.getUserFavorites(user1);

        assertEquals(2, result.size());
        verify(favoriteRepository).findByUser(user1);
    }

    @Test
    @DisplayName("Should return empty list when user has no favorites")
    void testGetUserFavoritesEmpty() {
        when(favoriteRepository.findByUser(user1)).thenReturn(new ArrayList<>());

        List<Favorite> result = favoriteService.getUserFavorites(user1);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should delete favorite successfully")
    void testRemoveFavorite() {
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        favoriteService.removeFavorite(user1, 1L);

        verify(favoriteRepository).delete(favorite1);
    }

    @Test
    @DisplayName("Should throw FavoriteNotFoundException when favorite doesn't exist")
    void testRemoveFavoriteNotFound() {
        when(favoriteRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(FavoriteNotFoundException.class, () -> {
            favoriteService.removeFavorite(user1, 999L);
        });

        verify(favoriteRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should prevent cross-user deletion (data isolation)")
    void testRemoveFavoriteUnauthorized() {
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        assertThrows(UnauthorizedException.class, () -> {
            favoriteService.removeFavorite(user2, 1L); // user2 trying to delete user1's favorite
        });

        verify(favoriteRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should update favorite notes successfully")
    void testUpdateFavoriteNotes() {
        String newNotes = "This is a great recipe!";
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        favoriteService.updateFavoriteNotes(user1, 1L, newNotes);

        verify(favoriteRepository).save(favorite1);
        assertEquals(newNotes, favorite1.getNotes());
    }

    @Test
    @DisplayName("Should reject notes exceeding 500 characters")
    void testUpdateFavoriteNotesExceedsLimit() {
        String longNotes = "a".repeat(501);
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        assertThrows(IllegalArgumentException.class, () -> {
            favoriteService.updateFavoriteNotes(user1, 1L, longNotes);
        });

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow notes exactly at 500 character limit")
    void testUpdateFavoriteNotesAtLimit() {
        String notes500 = "a".repeat(500);
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        favoriteService.updateFavoriteNotes(user1, 1L, notes500);

        verify(favoriteRepository).save(favorite1);
        assertEquals(notes500, favorite1.getNotes());
    }

    @Test
    @DisplayName("Should clear notes with null value")
    void testUpdateFavoriteNotesNull() {
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        favoriteService.updateFavoriteNotes(user1, 1L, null);

        verify(favoriteRepository).save(favorite1);
        assertNull(favorite1.getNotes());
    }

    @Test
    @DisplayName("Should prevent cross-user note update (data isolation)")
    void testUpdateFavoriteNotesUnauthorized() {
        when(favoriteRepository.findById(1L)).thenReturn(Optional.of(favorite1));

        assertThrows(UnauthorizedException.class, () -> {
            favoriteService.updateFavoriteNotes(user2, 1L, "hacked");
        });

        verify(favoriteRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw FavoriteNotFoundException when updating non-existent favorite")
    void testUpdateFavoriteNotesNotFound() {
        when(favoriteRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(FavoriteNotFoundException.class, () -> {
            favoriteService.updateFavoriteNotes(user1, 999L, "notes");
        });
    }

    @Test
    @DisplayName("Should preserve recipe metadata during favorite operations")
    void testFavoritePreservesMetadata() {
        String recipeId = "recipe789";
        String recipeName = "Salmon Dinner";
        when(favoriteRepository.existsByUserAndRecipeId(user1, recipeId)).thenReturn(false);

        Favorite newFavorite = new Favorite(user1, recipeId, recipeName);
        newFavorite.setId(3L);
        when(favoriteRepository.save(any(Favorite.class))).thenReturn(newFavorite);

        Map<String, Object> result = favoriteService.addFavorite(user1, recipeId, recipeName);

        assertEquals(recipeId, result.get("recipeId"));
        assertEquals(recipeName, result.get("recipeName"));
    }
}
