package com.awad.ticketbooking.modules.auth.repository;

import com.awad.ticketbooking.modules.auth.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    long countByCreatedAtBetween(java.time.Instant start, java.time.Instant end);
}
