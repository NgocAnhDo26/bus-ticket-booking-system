package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.SeatType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
public class TripResponse {
    private UUID id;
    private String origin;
    private String destination;
    private Instant departureTime;
    private Instant arrivalTime;
    private String operatorName;
    private String busPlateNumber;
    private String busAmenities; // JSON string
    private Map<SeatType, BigDecimal> prices;
    private int durationMinutes;
}
