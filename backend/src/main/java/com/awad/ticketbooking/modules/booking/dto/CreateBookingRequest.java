package com.awad.ticketbooking.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Email;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.List;

@Data
public class CreateBookingRequest {
    @NotNull(message = "Trip ID is required")
    private UUID tripId;

    // Optional - can be null for guest bookings
    private UUID userId;

    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @NotBlank(message = "Passenger phone is required")
    private String passengerPhone;

    private String passengerIdNumber;

    // Email for guest users (optional if logged in)
    @Email(message = "Invalid email format")
    private String passengerEmail;

    private UUID pickupStationId;
    private UUID dropoffStationId;

    @NotNull(message = "Total price is required")
    @PositiveOrZero(message = "Total price must be zero or positive")
    private BigDecimal totalPrice;

    @NotEmpty(message = "At least one ticket is required")
    private List<TicketRequest> tickets;
}
