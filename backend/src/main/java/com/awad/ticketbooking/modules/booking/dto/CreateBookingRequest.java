package com.awad.ticketbooking.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateBookingRequest {
    @NotNull(message = "Trip ID is required")
    private UUID tripId;

    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotBlank(message = "Seat number is required")
    private String seatNumber;

    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @NotBlank(message = "Passenger phone is required")
    private String passengerPhone;

    @NotNull(message = "Total price is required")
    @Positive(message = "Total price must be positive")
    private BigDecimal totalPrice;
}
