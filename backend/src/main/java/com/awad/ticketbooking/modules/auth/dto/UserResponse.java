package com.awad.ticketbooking.modules.auth.dto;

import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String fullName,
        String email,
        String phone,
        UserRole role,
        String avatarUrl,
        AuthProvider authProvider) {
}

