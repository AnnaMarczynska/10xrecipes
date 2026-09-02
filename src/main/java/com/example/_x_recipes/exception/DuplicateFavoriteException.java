package com.example._x_recipes.exception;

public class DuplicateFavoriteException extends AuthException {
    public DuplicateFavoriteException(String recipeId) {
        super("Recipe already in favorites: " + recipeId);
    }

    public DuplicateFavoriteException(String message, Throwable cause) {
        super(message, cause);
    }
}
