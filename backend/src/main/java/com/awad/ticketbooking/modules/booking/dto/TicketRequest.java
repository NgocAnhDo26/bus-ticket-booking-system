package com.awad.ticketbooking.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TicketRequest {
    @NotBlank(message = "Seat code is required")
    private String seatCode;

    @NotBlank(message = "Passenger name is required")
    private String passengerName;

    @NotBlank(message = "Passenger phone is required")
    private String passengerPhone;

    @NotNull(message = "Ticket price is required")
    private BigDecimal price;
}

