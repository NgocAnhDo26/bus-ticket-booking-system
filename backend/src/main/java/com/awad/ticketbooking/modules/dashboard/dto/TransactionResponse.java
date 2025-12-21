package com.awad.ticketbooking.modules.dashboard.dto;

import com.awad.ticketbooking.common.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private UUID id;
    private String passengerName;
    private String route;
    private BigDecimal totalPrice;
    private BookingStatus status;
    private Instant bookingTime;
}
