package com.example._x_recipes.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ErrorDetailTest {

    @Test
    void testConstructorWithAllFields() {
        String code = "ERROR_CODE";
        String message = "Error message";
        String details = "Error details";

        ErrorDetail error = new ErrorDetail(code, message, details);

        assertEquals(code, error.getCode());
        assertEquals(message, error.getMessage());
        assertEquals(details, error.getDetails());
    }

    @Test
    void testConstructorWithoutDetails() {
        String code = "ERROR_CODE";
        String message = "Error message";

        ErrorDetail error = new ErrorDetail(code, message);

        assertEquals(code, error.getCode());
        assertEquals(message, error.getMessage());
        assertNull(error.getDetails());
    }

    @Test
    void testSettersAndGetters() {
        ErrorDetail error = new ErrorDetail();

        error.setCode("NEW_CODE");
        error.setMessage("New message");
        error.setDetails("New details");

        assertEquals("NEW_CODE", error.getCode());
        assertEquals("New message", error.getMessage());
        assertEquals("New details", error.getDetails());
    }

    @Test
    void testDefaultConstructor() {
        ErrorDetail error = new ErrorDetail();

        assertNull(error.getCode());
        assertNull(error.getMessage());
        assertNull(error.getDetails());
    }
}
