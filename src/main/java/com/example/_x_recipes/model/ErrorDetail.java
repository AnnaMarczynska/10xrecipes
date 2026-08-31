package com.example._x_recipes.model;

public class ErrorDetail {
    private String code;
    private String message;
    private String details;

    public ErrorDetail() {}

    public ErrorDetail(String code, String message, String details) {
        this.code = code;
        this.message = message;
        this.details = details;
    }

    public ErrorDetail(String code, String message) {
        this(code, message, null);
    }

    // Getters and setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
