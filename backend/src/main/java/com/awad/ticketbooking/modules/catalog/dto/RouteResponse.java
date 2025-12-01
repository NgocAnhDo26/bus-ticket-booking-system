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

    @Data
    @Builder
    public static class StationInfo {
        private UUID id;
        private String name;
        private String city;
        private String address;
    }
}
