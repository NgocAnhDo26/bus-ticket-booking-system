package com.awad.ticketbooking.modules.auth.dto;

public record AuthResponse(String accessToken, UserResponse user) {
}

