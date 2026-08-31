package com.example._x_recipes.service;

import com.example._x_recipes.entity.User;
import com.example._x_recipes.repository.UserRepository;
import com.example._x_recipes.security.JwtTokenProvider;
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

    public Map<String, Object> register(String email, String password) throws Exception {
        if (email == null || email.trim().isEmpty()) {
            throw new Exception("Email is required");
        }
        if (password == null || password.length() < 6) {
            throw new Exception("Password must be at least 6 characters");
        }
        if (password.length() > 128) {
            throw new Exception("Password must be less than 128 characters");
        }
        if (!isValidEmail(email)) {
            throw new Exception("Invalid email format");
        }
        if (userRepository.existsByEmail(email)) {
            throw new Exception("Email already registered");
        }

        User user = new User(email, passwordEncoder.encode(password));
        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(email);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", email);
        response.put("message", "User registered successfully");
        return response;
    }

    public Map<String, Object> login(String email, String password) throws Exception {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid password");
        }

        String token = jwtTokenProvider.generateToken(email);
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("email", email);
        response.put("message", "Login successful");
        return response;
    }

    public User getUserByEmail(String email) throws Exception {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("User not found"));
    }

    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }
}
