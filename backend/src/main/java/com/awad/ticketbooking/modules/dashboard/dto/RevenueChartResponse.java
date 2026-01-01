package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RevenueChartResponse {
    private String date;
    private BigDecimal revenue;
}
