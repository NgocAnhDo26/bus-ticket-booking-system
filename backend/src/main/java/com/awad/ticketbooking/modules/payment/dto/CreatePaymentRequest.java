package com.awad.ticketbooking.modules.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreatePaymentRequest {

    @NotNull(message = "Booking ID is required")
    private UUID bookingId;

    @NotBlank(message = "Return URL is required")
    private String returnUrl;

    @NotBlank(message = "Cancel URL is required")
    private String cancelUrl;
}
