package com.example._x_recipes.exception;

public class DuplicateEmailException extends AuthException {
    public DuplicateEmailException(String email) {
        super("Email already registered: " + email);
    }

    public DuplicateEmailException(String message, Throwable cause) {
        super(message, cause);
    }
}
