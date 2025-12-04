package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.SeatType;
import com.awad.ticketbooking.common.enums.TripStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TripResponse {
    private UUID id;
    private RouteInfo route;
    private BusInfo bus;
    private Instant departureTime;
    private Instant arrivalTime;
    private TripStatus status;
    private List<TripPricingInfo> tripPricings;

    @Data
    @Builder
    public static class RouteInfo {
        private UUID id;
        private StationInfo originStation;
        private StationInfo destinationStation;
        private int durationMinutes;
    }

    @Data
    @Builder
    public static class StationInfo {
        private UUID id;
        private String name;
        private String city;
    }

    @Data
    @Builder
    public static class BusInfo {
        private UUID id;
        private String plateNumber;
        private OperatorInfo operator;
        private Integer capacity;
        private List<String> amenities;
    }

    @Data
    @Builder
    public static class OperatorInfo {
        private UUID id;
        private String name;
    }

    @Data
    @Builder
    public static class TripPricingInfo {
        private UUID id;
        private SeatType seatType;
        private BigDecimal price;
    }
}
