package com.awad.ticketbooking.modules.payment.controller;

import com.awad.ticketbooking.modules.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/payos")
@RequiredArgsConstructor
@Slf4j
public class PaymentWebhookController {

    private final PaymentService paymentService;

    /**
     * Handle PayOS webhook notifications
     * This endpoint receives payment status updates from PayOS
     * Signature verification is done in PaymentService
     */
    @PostMapping
    public ResponseEntity<String> handleWebhook(@RequestBody String rawBody) {
        log.info("Received PayOS webhook");
        try {
            paymentService.handleWebhook(rawBody);
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Webhook handling failed: {}", e.getMessage());
            // Return 200 to prevent PayOS from retrying (we log the error internally)
            return ResponseEntity.ok("RECEIVED");
        }
    }
}
