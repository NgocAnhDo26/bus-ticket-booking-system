package com.awad.ticketbooking.modules.booking.dto;

import com.awad.ticketbooking.common.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class BookingResponse {
    private UUID id;
    private String code;
    private BookingStatus status;
    private BigDecimal totalPrice;
    private String passengerName;
    private String passengerPhone;
    private Instant createdAt;
    private Instant updatedAt;
    private TripInfo trip;
    private List<TicketInfo> tickets;

    @Data
    @Builder
    public static class TripInfo {
        private UUID id;
        private Instant departureTime;
        private Instant arrivalTime;
        private RouteInfo route;
        private BusInfo bus;
    }

    @Data
    @Builder
    public static class RouteInfo {
        private UUID id;
        private StationInfo originStation;
        private StationInfo destinationStation;
        private Integer durationMinutes;
    }

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
    public static class BusInfo {
        private UUID id;
        private String plateNumber;
        private String operatorName;
        private List<String> amenities;
    }

    @Data
    @Builder
    public static class TicketInfo {
        private UUID id;
        private String seatCode;
        private String passengerName;
        private String passengerPhone;
        private BigDecimal price;
    }
}
