package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricsResponse {
    private BigDecimal todayRevenue;
    private long todayTicketsSold;
    private long todayNewUsers;
    private long todayActiveOperators;
}
