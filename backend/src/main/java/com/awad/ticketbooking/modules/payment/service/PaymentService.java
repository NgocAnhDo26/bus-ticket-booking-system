package com.awad.ticketbooking.modules.payment.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.enums.PaymentStatus;
import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.payment.dto.CreatePaymentRequest;
import com.awad.ticketbooking.modules.payment.dto.PaymentResponse;
import com.awad.ticketbooking.modules.payment.entity.PaymentTransaction;
import com.awad.ticketbooking.modules.payment.entity.PaymentWebhookEvent;
import com.awad.ticketbooking.modules.payment.repository.PaymentTransactionRepository;
import com.awad.ticketbooking.modules.payment.repository.PaymentWebhookEventRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PayOS payOS;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentWebhookEventRepository webhookEventRepository;
    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;
    private final com.awad.ticketbooking.modules.booking.repository.TicketRepository ticketRepository;
    private final com.awad.ticketbooking.modules.booking.service.SeatLockService seatLockService;

    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        // Find the booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Validate booking status - only PENDING bookings can be paid
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be paid. Current status: " + booking.getStatus());
        }

        // Check if payment already exists for this booking
        if (paymentTransactionRepository.findByBookingId(booking.getId()).isPresent()) {
            throw new RuntimeException("Payment already exists for this booking");
        }

        try {
            // Generate unique order code (timestamp + random to ensure uniqueness)
            Long orderCode = System.currentTimeMillis();
            while (paymentTransactionRepository.existsByOrderCode(orderCode)) {
                orderCode = System.currentTimeMillis() + (long) (Math.random() * 1000);
            }

            // Create payment link request using PayOS SDK v2
            CreatePaymentLinkRequest paymentData = CreatePaymentLinkRequest.builder()
                    .orderCode(orderCode)
                    .amount(booking.getTotalPrice().longValue())
                    .description("Thanh toan ve xe - " + booking.getCode())
                    .returnUrl(request.getReturnUrl())
                    .cancelUrl(request.getCancelUrl())
                    .build();

            // Call PayOS API to create payment link
            CreatePaymentLinkResponse response = payOS.paymentRequests().create(paymentData);

            // Save payment transaction
            PaymentTransaction transaction = new PaymentTransaction();
            transaction.setBooking(booking);
            transaction.setOrderCode(orderCode);
            transaction.setAmount(booking.getTotalPrice());
            transaction.setStatus(PaymentStatus.PENDING);
            transaction.setPaymentLinkId(response.getPaymentLinkId());
            transaction.setCheckoutUrl(response.getCheckoutUrl());
            transaction.setQrCode(response.getQrCode());

            PaymentTransaction savedTransaction = paymentTransactionRepository.save(transaction);

            log.info("Created payment link for booking {} with order code {}", booking.getCode(), orderCode);

            return toPaymentResponse(savedTransaction);

        } catch (Exception e) {
            log.error("Failed to create payment link for booking {}: {}", booking.getCode(), e.getMessage());
            throw new RuntimeException("Failed to create payment link: " + e.getMessage());
        }
    }

    @Transactional
    public void handleWebhook(String webhookBody) {
        try {
            log.info("Received webhook: {}", webhookBody);

            // Parse webhook body using Jackson
            JsonNode webhook = objectMapper.readTree(webhookBody);
            JsonNode data = webhook.get("data");

            if (data == null) {
                log.warn("Webhook data is null, ignoring");
                return;
            }

            Long orderCode = data.get("orderCode").asLong();
            String code = data.has("code") ? data.get("code").asText() : null;
            String reference = data.has("reference") ? data.get("reference").asText() : null;

            // Check for test webhook (orderCode = 123)
            if (orderCode == 123) {
                log.info("Received test webhook, ignoring");
                return;
            }

            // Verify webhook signature using PayOS SDK
            try {
                payOS.webhooks().verify(webhookBody);
            } catch (Exception e) {
                log.error("Webhook signature verification failed: {}", e.getMessage());
                throw new RuntimeException("Invalid webhook signature");
            }

            // Check idempotency - if already processed with SUCCESS, skip
            if (webhookEventRepository.existsByOrderCodeAndStatus(orderCode, "PROCESSED")) {
                log.info("Webhook for order {} already processed, skipping", orderCode);
                logWebhookEvent(orderCode, code, webhookBody, "DUPLICATE");
                return;
            }

            // Find the payment transaction
            PaymentTransaction transaction = paymentTransactionRepository.findByOrderCode(orderCode)
                    .orElseThrow(() -> new RuntimeException("Payment transaction not found for order: " + orderCode));

            // Find the booking
            Booking booking = transaction.getBooking();

            // Process based on payment status
            if ("00".equals(code)) {
                // Payment successful
                transaction.setStatus(PaymentStatus.SUCCESS);
                transaction.setTransactionId(reference);
                booking.setStatus(BookingStatus.CONFIRMED);
                log.info("Payment successful for booking {}", booking.getCode());

                // Save first to commit booking status
                paymentTransactionRepository.save(transaction);
                bookingRepository.save(booking);

                // Send confirmation email
                try {
                    String recipientEmail = booking.getPassengerEmail() != null
                            ? booking.getPassengerEmail()
                            : (booking.getUser() != null ? booking.getUser().getEmail() : null);

                    if (recipientEmail != null) {
                        Booking bookingForEmail = bookingRepository.findByIdWithFullDetails(booking.getId())
                                .orElse(booking);
                        emailService.sendBookingConfirmationEmail(bookingForEmail, recipientEmail);
                        log.info("Sent confirmation email to {} for booking {}", recipientEmail, booking.getCode());
                    }
                } catch (Exception emailError) {
                    log.error("Failed to send confirmation email for booking {}: {}", booking.getCode(),
                            emailError.getMessage());
                }
            } else {
                // Payment failed
                transaction.setStatus(PaymentStatus.FAILED);
                handlePaymentFailure(booking);

                log.warn("Payment failed for booking {} with code {}", booking.getCode(), code);

                // Save updates
                paymentTransactionRepository.save(transaction);
            }

            // Log webhook event
            logWebhookEvent(orderCode, code, webhookBody, "PROCESSED");

        } catch (Exception e) {
            log.error("Failed to process webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Webhook processing failed: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByBookingId(UUID bookingId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found for booking: " + bookingId));
        return toPaymentResponse(transaction);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(UUID paymentId) {
        PaymentTransaction transaction = paymentTransactionRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));
        return toPaymentResponse(transaction);
    }

    private void logWebhookEvent(Long orderCode, String eventType, String payload, String status) {
        PaymentWebhookEvent event = new PaymentWebhookEvent();
        event.setOrderCode(orderCode);
        event.setEventType(eventType);
        event.setPayload(payload);
        event.setStatus(status);
        webhookEventRepository.save(event);
    }

    /**
     * Verify payment status with PayOS and update booking status
     * This is used when webhook doesn't reach (localhost development)
     */
    @Transactional
    public PaymentResponse verifyAndUpdatePayment(UUID bookingId) {
        PaymentTransaction transaction = paymentTransactionRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new RuntimeException("Payment not found for booking: " + bookingId));

        // If already processed, just return
        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            return toPaymentResponse(transaction);
        }

        try {
            // Get payment info from PayOS
            var paymentInfo = payOS.paymentRequests().get(transaction.getOrderCode());
            String status = paymentInfo.getStatus().toString();

            log.info("PayOS payment status for order {}: {}", transaction.getOrderCode(), status);

            Booking booking = transaction.getBooking();

            if ("PAID".equals(status)) {
                // Payment successful
                transaction.setStatus(PaymentStatus.SUCCESS);
                booking.setStatus(BookingStatus.CONFIRMED);

                paymentTransactionRepository.save(transaction);
                bookingRepository.save(booking);

                log.info("Payment verified and confirmed for booking {}", booking.getCode());

                // Send confirmation email
                try {
                    String recipientEmail = booking.getPassengerEmail() != null
                            ? booking.getPassengerEmail()
                            : (booking.getUser() != null ? booking.getUser().getEmail() : null);

                    if (recipientEmail != null) {
                        // Fetch booking with all relations for async email (avoid
                        // LazyInitializationException)
                        Booking bookingForEmail = bookingRepository.findByIdWithFullDetails(booking.getId())
                                .orElse(booking);
                        emailService.sendBookingConfirmationEmail(bookingForEmail, recipientEmail);
                        log.info("Sent confirmation email to {} for booking {}", recipientEmail, booking.getCode());
                    }
                } catch (Exception emailError) {
                    log.error("Failed to send confirmation email for booking {}: {}", booking.getCode(),
                            emailError.getMessage());
                }
            } else if ("CANCELLED".equals(status) || "EXPIRED".equals(status)) {
                transaction.setStatus(PaymentStatus.FAILED);
                handlePaymentFailure(booking); // Clean up seats

                paymentTransactionRepository.save(transaction);

                log.warn("Payment {} for booking {}", status, booking.getCode());
            }
            // PENDING status - do nothing, keep current state

            return toPaymentResponse(transaction);

        } catch (Exception e) {
            log.error("Failed to verify payment for booking {}: {}", bookingId, e.getMessage());
            throw new RuntimeException("Failed to verify payment: " + e.getMessage());
        }
    }

    private void handlePaymentFailure(Booking booking) {
        booking.setStatus(BookingStatus.CANCELLED);

        // release seats
        List<com.awad.ticketbooking.modules.booking.entity.Ticket> tickets = booking.getTickets();
        if (tickets != null && !tickets.isEmpty()) {
            List<String> seatCodes = tickets.stream()
                    .map(com.awad.ticketbooking.modules.booking.entity.Ticket::getSeatCode)
                    .collect(java.util.stream.Collectors.toList());

            ticketRepository.deleteAll(tickets);
            booking.getTickets().clear();

            if (booking.getTrip() != null) {
                seatLockService.unlockSeatsForBooking(booking.getTrip().getId(), seatCodes);
            }
        }
        bookingRepository.save(booking);
    }

    private PaymentResponse toPaymentResponse(PaymentTransaction transaction) {
        return PaymentResponse.builder()
                .id(transaction.getId())
                .bookingId(transaction.getBooking().getId())
                .orderCode(transaction.getOrderCode())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .checkoutUrl(transaction.getCheckoutUrl())
                .qrCode(transaction.getQrCode())
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}
