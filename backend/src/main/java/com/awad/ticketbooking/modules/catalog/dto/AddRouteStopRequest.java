package com.awad.ticketbooking.modules.catalog.dto;

import com.awad.ticketbooking.common.enums.StopType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddRouteStopRequest {
    @NotNull(message = "Station ID is required")
    private UUID stationId;

    @Min(value = 0, message = "Stop order must be non-negative")
    private int stopOrder;

    @Min(value = 0, message = "Duration from origin must be non-negative")
    private int durationMinutesFromOrigin;

    private StopType stopType = StopType.BOTH;
}
