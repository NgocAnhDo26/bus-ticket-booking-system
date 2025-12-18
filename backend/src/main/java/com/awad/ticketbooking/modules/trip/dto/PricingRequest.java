package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.SeatType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PricingRequest {
    @NotNull
    private SeatType seatType;

    @NotNull
    @Positive
    private BigDecimal price;
}
