package com.qrattendance.repository;

import com.qrattendance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email address
     * Used for login validation
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if email already exists
     * Used for registration validation
     */
    boolean existsByEmail(String email);
}
