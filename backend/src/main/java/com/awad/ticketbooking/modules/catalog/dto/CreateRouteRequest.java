package com.awad.ticketbooking.modules.catalog.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateRouteRequest {
    @NotNull(message = "Origin station ID is required")
    private UUID originStationId;

    @NotNull(message = "Destination station ID is required")
    private UUID destinationStationId;

    @Positive(message = "Duration must be positive")
    private Integer durationMinutes;

    @Positive(message = "Distance must be positive")
    private BigDecimal distanceKm;
}
