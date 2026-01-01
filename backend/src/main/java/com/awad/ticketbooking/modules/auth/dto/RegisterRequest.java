package com.awad.ticketbooking.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
                @NotBlank(message = "Full name is required") @jakarta.validation.constraints.Pattern(regexp = "^[\\p{L} ]+$", message = "Full name must contain only letters and spaces") @Size(min = 2, max = 50, message = "Full name must be between 2 and 50 characters") String fullName,

                @Email(message = "Invalid email format") @NotBlank(message = "Email is required") String email,

                @Size(min = 8, message = "Password must be at least 8 characters") @jakarta.validation.constraints.Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$", message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character (@#$%^&+=!)") String password) {
}
