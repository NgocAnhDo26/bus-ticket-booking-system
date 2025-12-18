package com.awad.ticketbooking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
    @NotBlank(message = "Credential is required")
    String credential
) {}