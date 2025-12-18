package com.awad.ticketbooking.modules.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class UpdateBookingRequest {
    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @NotBlank(message = "Passenger phone is required")
    private String passengerPhone;

    @Email(message = "Invalid email format")
    private String passengerEmail;

    // Optional: if list is null/empty, don't change seats.
    // If provided, it replaces the current tickets/seats.
    private List<TicketRequest> tickets;

    private Long pickupStationId;
    private Long dropoffStationId;
}
