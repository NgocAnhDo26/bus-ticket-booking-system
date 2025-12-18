package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class TopOperatorResponse {
    private UUID operatorId;
    private String operatorName;
    private long ticketsSold;
    private BigDecimal totalRevenue;
}
