package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MetricsResponse {
    private BigDecimal todayRevenue;
    private long todayTicketsSold;
    private long todayNewUsers;
    private long todayActiveOperators;
}
