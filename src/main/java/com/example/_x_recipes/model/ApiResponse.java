package com.example._x_recipes.model;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private T data;
    private ErrorDetail error;
    private int status;

    public ApiResponse() {}

    public ApiResponse(T data, ErrorDetail error, int status) {
        this.data = data;
        this.error = error;
        this.status = status;
    }

    public static <T> ApiResponse<T> success(T data, int status) {
        return new ApiResponse<>(data, null, status);
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, null, 200);
    }

    public static <T> ApiResponse<T> error(ErrorDetail errorDetail, int status) {
        return new ApiResponse<>(null, errorDetail, status);
    }

    public static <T> ApiResponse<T> error(String code, String message, String details, int status) {
        return new ApiResponse<>(null, new ErrorDetail(code, message, details), status);
    }

    // Getters and setters
    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public ErrorDetail getError() {
        return error;
    }

    public void setError(ErrorDetail error) {
        this.error = error;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }
}
