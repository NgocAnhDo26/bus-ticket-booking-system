package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.StopType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
public class TripStopDto {
    // Optional - either stationId OR customAddress must be provided
    private UUID stationId;

    // Custom stop fields - used when stationId is null
    private String customName;
    private String customAddress;

    @NotNull
    private Integer stopOrder;

    @NotNull
    private Integer durationMinutesFromOrigin;

    @NotNull
    private StopType stopType;

    // New fields for per-stop configuration
    private Instant estimatedArrivalTime;
    private BigDecimal normalPrice;
    private BigDecimal vipPrice;

    /**
     * Validates that either stationId or customAddress is provided.
     */
    public boolean isValid() {
        return stationId != null || (customAddress != null && !customAddress.isBlank());
    }
}
