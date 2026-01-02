package com.awad.ticketbooking.modules.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RefundCalculation {
    private BigDecimal refundAmount;
    private Double refundPercentage;
    private String policyDescription;
    private boolean isRefundable;
}
