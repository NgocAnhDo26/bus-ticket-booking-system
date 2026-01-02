package com.awad.ticketbooking.modules.auth.dto;

import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import java.time.Instant;
import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String fullName,
        String email,
        String phone,
        UserRole role,
        String avatarUrl,
        AuthProvider authProvider,
        boolean enabled,
        Instant createdAt) {
}
