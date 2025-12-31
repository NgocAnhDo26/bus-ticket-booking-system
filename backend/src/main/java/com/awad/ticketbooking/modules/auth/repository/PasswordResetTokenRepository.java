package com.awad.ticketbooking.modules.auth.repository;

import com.awad.ticketbooking.modules.auth.entity.PasswordResetToken;
import com.awad.ticketbooking.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);

    Optional<PasswordResetToken> findByUser(User user);

    void deleteByUser(User user);
}
