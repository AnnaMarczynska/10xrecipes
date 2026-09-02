package com.example._x_recipes.exception;

public class FavoriteNotFoundException extends AuthException {
    public FavoriteNotFoundException(Long id) {
        super("Favorite not found: " + id);
    }

    public FavoriteNotFoundException(String message) {
        super(message);
    }
}
