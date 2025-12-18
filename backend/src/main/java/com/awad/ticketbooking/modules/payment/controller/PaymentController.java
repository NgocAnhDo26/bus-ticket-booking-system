package com.awad.ticketbooking.modules.payment.controller;

import com.awad.ticketbooking.modules.payment.dto.CreatePaymentRequest;
import com.awad.ticketbooking.modules.payment.dto.PaymentResponse;
import com.awad.ticketbooking.modules.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * Create a payment link for a pending booking
     */
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request) {
        return ResponseEntity.ok(paymentService.createPayment(request));
    }

    /**
     * Get payment details by payment ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable UUID id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    /**
     * Get payment details by booking ID
     */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getPaymentByBooking(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(paymentService.getPaymentByBookingId(bookingId));
    }

    /**
     * Verify and update payment status from PayOS (for localhost when webhook
     * doesn't work)
     */
    @PostMapping("/verify/{bookingId}")
    public ResponseEntity<PaymentResponse> verifyPayment(@PathVariable UUID bookingId) {
        return ResponseEntity.ok(paymentService.verifyAndUpdatePayment(bookingId));
    }
}
