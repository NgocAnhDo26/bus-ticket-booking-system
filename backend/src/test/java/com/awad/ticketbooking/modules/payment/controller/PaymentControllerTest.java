package com.awad.ticketbooking.modules.payment.controller;

import com.awad.ticketbooking.modules.payment.dto.CreatePaymentRequest;
import com.awad.ticketbooking.modules.payment.dto.PaymentResponse;
import com.awad.ticketbooking.modules.payment.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.awad.ticketbooking.common.enums.PaymentStatus;
import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    private ObjectMapper objectMapper;
    private PaymentResponse mockPaymentResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController).build();
        objectMapper = new ObjectMapper();

        mockPaymentResponse = PaymentResponse.builder()
                .id(UUID.randomUUID())
                .bookingId(UUID.randomUUID())
                .amount(new BigDecimal("200000"))
                .status(PaymentStatus.PENDING)
                .build();
    }

    @Test
    void createPayment_success() throws Exception {
        // Arrange
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setBookingId(mockPaymentResponse.getBookingId());
        request.setReturnUrl("https://example.com/return");
        request.setCancelUrl("https://example.com/cancel");
        when(paymentService.createPayment(any(CreatePaymentRequest.class))).thenReturn(mockPaymentResponse);

        // Act & Assert
        mockMvc.perform(post("/api/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(paymentService).createPayment(any(CreatePaymentRequest.class));
    }

    @Test
    void getPayment_success() throws Exception {
        // Arrange
        UUID paymentId = mockPaymentResponse.getId();
        when(paymentService.getPaymentById(paymentId)).thenReturn(mockPaymentResponse);

        // Act & Assert
        mockMvc.perform(get("/api/payments/{id}", paymentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(paymentId.toString()));

        verify(paymentService).getPaymentById(paymentId);
    }

    @Test
    void getPaymentByBooking_success() throws Exception {
        // Arrange
        UUID bookingId = mockPaymentResponse.getBookingId();
        when(paymentService.getPaymentByBookingId(bookingId)).thenReturn(mockPaymentResponse);

        // Act & Assert
        mockMvc.perform(get("/api/payments/booking/{bookingId}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(bookingId.toString()));

        verify(paymentService).getPaymentByBookingId(bookingId);
    }

    @Test
    void verifyPayment_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        PaymentResponse verifiedResponse = PaymentResponse.builder()
                .id(UUID.randomUUID())
                .bookingId(bookingId)
                .status(PaymentStatus.SUCCESS)
                .build();
        when(paymentService.verifyAndUpdatePayment(bookingId)).thenReturn(verifiedResponse);

        // Act & Assert
        mockMvc.perform(post("/api/payments/verify/{bookingId}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        verify(paymentService).verifyAndUpdatePayment(bookingId);
    }
}
