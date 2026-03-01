package com.qrattendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private boolean success;
    private String message;
    private UserData user;

    // Constructor for error responses (no user data)
    public AuthResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.user = null;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserData {
        private Long id;
        private String name;
        private String email;
    }
}
