package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopOperatorResponse {
    private UUID operatorId;
    private String operatorName;
    private long ticketsSold;
    private BigDecimal totalRevenue;
}
