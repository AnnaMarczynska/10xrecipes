package com.example._x_recipes.exception;

public class UserNotFoundException extends AuthException {
    public UserNotFoundException(String email) {
        super("User not found: " + email);
    }
}
