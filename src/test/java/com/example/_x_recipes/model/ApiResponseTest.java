package com.example._x_recipes.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    void testSuccessWithData() {
        String testData = "test";
        ApiResponse<String> response = ApiResponse.success(testData);

        assertEquals(testData, response.getData());
        assertNull(response.getError());
        assertEquals(200, response.getStatus());
    }

    @Test
    void testSuccessWithCustomStatus() {
        String testData = "test";
        ApiResponse<String> response = ApiResponse.success(testData, 201);

        assertEquals(testData, response.getData());
        assertNull(response.getError());
        assertEquals(201, response.getStatus());
    }

    @Test
    void testErrorWithErrorDetail() {
        ErrorDetail errorDetail = new ErrorDetail("ERROR_CODE", "Error message", "Details");
        ApiResponse<Void> response = ApiResponse.error(errorDetail, 400);

        assertNull(response.getData());
        assertNotNull(response.getError());
        assertEquals("ERROR_CODE", response.getError().getCode());
        assertEquals("Error message", response.getError().getMessage());
        assertEquals("Details", response.getError().getDetails());
        assertEquals(400, response.getStatus());
    }

    @Test
    void testErrorWithParameters() {
        ApiResponse<Void> response = ApiResponse.error("TEST_ERROR", "Test message", "Test details", 500);

        assertNull(response.getData());
        assertNotNull(response.getError());
        assertEquals("TEST_ERROR", response.getError().getCode());
        assertEquals("Test message", response.getError().getMessage());
        assertEquals("Test details", response.getError().getDetails());
        assertEquals(500, response.getStatus());
    }

    @Test
    void testConstructor() {
        String data = "test";
        ErrorDetail error = null;
        int status = 200;

        ApiResponse<String> response = new ApiResponse<>(data, error, status);

        assertEquals(data, response.getData());
        assertEquals(error, response.getError());
        assertEquals(status, response.getStatus());
    }
}
