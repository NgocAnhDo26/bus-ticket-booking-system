package com.awad.ticketbooking.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateAdminRequest(
        @NotBlank(message = "Full name is required") String fullName,

        @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Invalid phone number format") String phone) {
}
