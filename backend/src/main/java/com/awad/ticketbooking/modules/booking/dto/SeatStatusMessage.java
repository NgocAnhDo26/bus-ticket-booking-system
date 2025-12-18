package com.awad.ticketbooking.modules.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SeatStatusMessage {
    private String seatCode;
    private String status; // "LOCKED", "AVAILABLE", "BOOKED"
    private UUID lockedByUserId;
}

