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
    
    // In a real app, user ID comes from SecurityContext, but for simplicity/testing we might accept it 
    // or better, extract from Authentication.
    // For now, let's assume we extract it from SecurityContext in Controller, so it's not needed here 
    // unless we are calling it from a service that doesn't have auth context.
    // However, the plan implies we might need to pass it if we are not fully authenticated or just to be explicit.
    // Let's stick to SecurityContext principle.
}

