package com.awad.ticketbooking.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BookingLookupRequest {
    @NotBlank(message = "Booking code is required")
    private String code;

    @NotBlank(message = "Email is required")
    private String email;
}
