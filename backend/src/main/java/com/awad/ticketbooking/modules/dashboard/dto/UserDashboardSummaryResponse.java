package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class UserDashboardSummaryResponse {
    private long totalTrips;
    private long upcomingTrips;
    private BigDecimal totalSpent;
}
