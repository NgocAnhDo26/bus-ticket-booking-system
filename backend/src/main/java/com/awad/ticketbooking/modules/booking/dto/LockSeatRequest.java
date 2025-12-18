package com.awad.ticketbooking.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class LockSeatRequest {
    @NotNull(message = "Trip ID is required")
    private UUID tripId;

    @NotBlank(message = "Seat code is required")
    private String seatCode;

    // For guest users who don't have a SecurityContext
    private String guestId;
}
