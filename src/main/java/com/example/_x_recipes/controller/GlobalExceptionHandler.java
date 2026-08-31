package com.example._x_recipes.controller;

import com.example._x_recipes.client.TheMealDBClient;
import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.model.ErrorDetail;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.logging.Logger;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = Logger.getLogger(GlobalExceptionHandler.class.getName());

    @ExceptionHandler(TheMealDBClient.TheMealDBException.class)
    public ResponseEntity<ApiResponse<Void>> handleTheMealDBException(TheMealDBClient.TheMealDBException e) {
        ErrorDetail errorDetail = new ErrorDetail(
            "THEMEALDB_ERROR",
            "Recipe service unavailable",
            e.getMessage()
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ApiResponse.error(errorDetail, 504));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgumentException(IllegalArgumentException e) {
        ErrorDetail errorDetail = new ErrorDetail(
            "INVALID_REQUEST",
            "Invalid request",
            e.getMessage()
        );
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(errorDetail, 400));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        logger.severe("Unhandled exception: " + e.getClass().getName() + " - " + e.getMessage());
        e.printStackTrace();
        ErrorDetail errorDetail = new ErrorDetail(
            "INTERNAL_ERROR",
            "Internal server error",
            "An unexpected error occurred"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(errorDetail, 500));
    }
}
