package com.awad.ticketbooking.modules.dashboard.dto;

import com.awad.ticketbooking.common.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class DashboardDTOs {

    @Data
    @Builder
    public static class MetricsResponse {
        private BigDecimal todayRevenue;
        private long todayTicketsSold;
        private long todayNewUsers;
        private long todayActiveOperators;
    }

    @Data
    @Builder
    public static class RevenueChartResponse {
        private String date;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    public static class TopRouteResponse {
        private UUID routeId;
        private String origin;
        private String destination;
        private long ticketsSold;
    }

    @Data
    @Builder
    public static class TransactionResponse {
        private UUID id;
        private String passengerName;
        private String route;
        private BigDecimal totalPrice;
        private BookingStatus status;
        private Instant bookingTime;
    }
}
