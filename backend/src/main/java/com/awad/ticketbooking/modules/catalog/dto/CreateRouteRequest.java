package com.awad.ticketbooking.modules.catalog.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

import java.util.List;

@Data
public class CreateRouteRequest {
    private String name; // Optional custom name

    // Optional list of stops for unified creation behavior
    private List<AddRouteStopRequest> stops;
    @NotNull(message = "Origin station ID is required")
    private UUID originStationId;

    @NotNull(message = "Destination station ID is required")
    private UUID destinationStationId;

    @Positive(message = "Duration must be positive")
    private Integer durationMinutes;

    @Positive(message = "Distance must be positive")
    private BigDecimal distanceKm;
}
