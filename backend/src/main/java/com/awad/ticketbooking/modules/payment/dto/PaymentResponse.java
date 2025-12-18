package com.awad.ticketbooking.modules.payment.dto;

import com.awad.ticketbooking.common.enums.PaymentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class PaymentResponse {

    private UUID id;
    private UUID bookingId;
    private Long orderCode;
    private BigDecimal amount;
    private PaymentStatus status;
    private String checkoutUrl;
    private String qrCode;
    private Instant createdAt;
    private Instant updatedAt;
}
