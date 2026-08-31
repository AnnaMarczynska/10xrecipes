package com.example._x_recipes.controller;

import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @Operation(summary = "User signup", description = "Create new account with email and password")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Signup successful, token returned")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input (email format, password length)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Email already registered")
    public ResponseEntity<ApiResponse<?>> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.register(request.getEmail(), request.getPassword()));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticate with email and password")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, token returned")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request format")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request.getEmail(), request.getPassword()));
    }

    @GetMapping("/logout")
    @Operation(summary = "User logout", description = "Logout user (frontend deletes token from storage)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Retrieve authenticated user's profile information")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile retrieved")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<ApiResponse<?>> getProfile() {
        var authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("No authentication found");
        }
        String email = (String) authentication.getPrincipal();
        var user = authService.getUserByEmail(email);
        Map<String, Object> response = new HashMap<>();
        response.put("email", user.getEmail());
        response.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    public static class SignupRequest {
        @NotNull(message = "email is required")
        @NotEmpty(message = "email cannot be empty")
        private String email;

        @NotNull(message = "password is required")
        @NotEmpty(message = "password cannot be empty")
        @Size(min = 6, max = 128, message = "password must be 6-128 characters")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        @NotNull(message = "email is required")
        @NotEmpty(message = "email cannot be empty")
        private String email;

        @NotNull(message = "password is required")
        @NotEmpty(message = "password cannot be empty")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
