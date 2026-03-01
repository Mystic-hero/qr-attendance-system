package com.qrattendance.service;

import com.qrattendance.dto.*;
import com.qrattendance.model.User;
import com.qrattendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Fetch user by ID for profile display
     */
    public UserResponse getUserById(Long id) {
        if (id == null)
            return null;
        User user = userRepository.findById(id).orElse(null);
        if (user == null)
            return null;

        return new UserResponse(user.getId(), user.getName(), user.getEmail());
    }

    /**
     * Update user name and email
     */
    public AuthResponse updateUserProfile(Long id, UserUpdateRequest request) {
        try {
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return new AuthResponse(false, "User not found");
            }

            // Check if email is already taken by another user
            if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                return new AuthResponse(false, "Email already in use");
            }

            user.setName(request.getName());
            user.setEmail(request.getEmail());
            userRepository.save(user);

            AuthResponse.UserData userData = new AuthResponse.UserData(user.getId(), user.getName(), user.getEmail());
            return new AuthResponse(true, "Profile updated successfully", userData);

        } catch (Exception e) {
            return new AuthResponse(false, "Profile update failed: " + e.getMessage());
        }
    }

    /**
     * Update user password with validation
     */
    public AuthResponse updatePassword(Long id, PasswordUpdateRequest request) {
        try {
            // Validate new password match
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                return new AuthResponse(false, "New password and confirmation do not match");
            }

            // Find user
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                return new AuthResponse(false, "User not found");
            }

            // Verify current password
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                return new AuthResponse(false, "Incorrect current password");
            }

            // Update password
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            return new AuthResponse(true, "Password updated successfully");

        } catch (Exception e) {
            return new AuthResponse(false, "Password update failed: " + e.getMessage());
        }
    }

    /**
     * Register a new user
     * Validates email uniqueness and encrypts password
     */
    public AuthResponse registerUser(RegisterRequest request) {
        try {
            // Check if email already exists
            if (userRepository.existsByEmail(request.getEmail())) {
                return new AuthResponse(false, "Email already registered");
            }

            // Create new user
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            // Save to database
            User savedUser = userRepository.save(user);

            // Return success response with user data
            AuthResponse.UserData userData = new AuthResponse.UserData(
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail());

            return new AuthResponse(true, "User registered successfully", userData);

        } catch (Exception e) {
            return new AuthResponse(false, "Registration failed: " + e.getMessage());
        }
    }

    /**
     * Login user
     * Validates credentials and returns user data
     */
    public AuthResponse loginUser(LoginRequest request) {
        try {
            // Find user by email
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);

            // Check if user exists
            if (user == null) {
                return new AuthResponse(false, "Invalid email or password");
            }

            // Verify password
            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return new AuthResponse(false, "Invalid email or password");
            }

            // Return success response with user data
            AuthResponse.UserData userData = new AuthResponse.UserData(
                    user.getId(),
                    user.getName(),
                    user.getEmail());

            return new AuthResponse(true, "Login successful", userData);

        } catch (Exception e) {
            return new AuthResponse(false, "Login failed: " + e.getMessage());
        }
    }
}
