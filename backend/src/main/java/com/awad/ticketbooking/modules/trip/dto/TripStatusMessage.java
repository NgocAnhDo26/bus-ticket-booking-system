package com.awad.ticketbooking.modules.trip.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TripStatusMessage {
    private UUID tripId;
    private String status; // SCHEDULED, DELAYED, CANCELLED, BOARDING, DEPARTED, COMPLETED
    private String message;
    private Instant updatedAt;
    private Instant newDepartureTime; // Optional: if status is DELAYED
}
