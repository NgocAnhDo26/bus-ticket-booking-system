package com.awad.ticketbooking.modules.payment.controller;

import com.awad.ticketbooking.modules.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class PaymentWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentWebhookController paymentWebhookController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentWebhookController).build();
    }

    @Test
    void handleWebhook_success() throws Exception {
        // Arrange
        String webhookBody = "{\"code\": 0, \"data\": {}}";
        doNothing().when(paymentService).handleWebhook(anyString());

        // Act & Assert
        mockMvc.perform(post("/api/webhooks/payos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookBody))
                .andExpect(status().isOk())
                .andExpect(content().string("OK"));

        verify(paymentService).handleWebhook(anyString());
    }

    @Test
    void handleWebhook_withException() throws Exception {
        // Arrange
        String webhookBody = "{\"code\": 0, \"data\": {}}";
        doThrow(new RuntimeException("Webhook error")).when(paymentService).handleWebhook(anyString());

        // Act & Assert
        mockMvc.perform(post("/api/webhooks/payos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(webhookBody))
                .andExpect(status().isOk())
                .andExpect(content().string("RECEIVED"));

        verify(paymentService).handleWebhook(anyString());
    }
}
