package com.awad.ticketbooking.modules.catalog.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class RouteResponse {
    private UUID id;
    private StationInfo originStation;
    private StationInfo destinationStation;
    private int durationMinutes;
    private BigDecimal distanceKm;
    private Boolean isActive;
    private java.util.List<StopInfo> stops;

    @Data
    @Builder
    public static class StationInfo {
        private UUID id;
        private String name;
        private String city;
        private String address;
    }

    @Data
    @Builder
    public static class StopInfo {
        private UUID id;
        private StationInfo station;
        private int stopOrder;
        private int durationMinutesFromOrigin;
        private String stopType;
    }
}
