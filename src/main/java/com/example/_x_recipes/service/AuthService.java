package com.example._x_recipes.service;

import com.example._x_recipes.entity.User;
import com.example._x_recipes.exception.DuplicateEmailException;
import com.example._x_recipes.exception.InvalidCredentialsException;
import com.example._x_recipes.exception.UserNotFoundException;
import com.example._x_recipes.model.ApiResponse;
import com.example._x_recipes.repository.UserRepository;
import com.example._x_recipes.security.JwtTokenProvider;
import jakarta.validation.constraints.Email;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public ApiResponse<Map<String, Object>> register(String email, String password) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        if (password.length() > 128) {
            throw new IllegalArgumentException("Password must be less than 128 characters");
        }
        if (!isValidEmail(email)) {
            throw new IllegalArgumentException("Invalid email format");
        }
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException(email);
        }

        User user = new User(email, passwordEncoder.encode(password));
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(email);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", email);
        response.put("message", "User registered successfully");
        return ApiResponse.success(response);
    }

    public ApiResponse<Map<String, Object>> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        String token = jwtTokenProvider.generateToken(email);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", email);
        response.put("message", "Login successful");
        return ApiResponse.success(response);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException(email));
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.length() > 255) {
            return false;
        }
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }
}
