package com.awad.ticketbooking.modules.auth.mapper;

import com.awad.ticketbooking.modules.auth.dto.UserResponse;
import com.awad.ticketbooking.modules.auth.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getAvatarUrl(),
                user.getAuthProvider());
    }

    public static com.awad.ticketbooking.modules.auth.dto.AdminUserResponse toAdminResponse(User user) {
        return new com.awad.ticketbooking.modules.auth.dto.AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getAvatarUrl(),
                user.getAuthProvider(),
                user.isEnabled(),
                user.getCreatedAt());
    }
}
