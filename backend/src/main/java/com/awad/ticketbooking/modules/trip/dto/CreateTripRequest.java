package com.awad.ticketbooking.modules.trip.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateTripRequest {

    @NotNull
    private UUID routeId;

    @NotNull
    private UUID busId;

    @NotNull
    private Instant departureTime;

    @NotNull
    private Instant arrivalTime;

    @NotNull
    private java.util.List<PricingRequest> pricings;
}
