package com.awad.ticketbooking.modules.auth.repository;

import com.awad.ticketbooking.modules.auth.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    Optional<User> findByActivationToken(String activationToken);

    Page<User> findByRole(com.awad.ticketbooking.modules.auth.entity.UserRole role,
            Pageable pageable);

    long countByCreatedAtBetween(java.time.Instant start, java.time.Instant end);
}
