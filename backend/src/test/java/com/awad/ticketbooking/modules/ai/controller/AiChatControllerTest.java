package com.awad.ticketbooking.modules.ai.controller;

import com.awad.ticketbooking.modules.ai.dto.ChatRequest;
import com.awad.ticketbooking.modules.ai.dto.ChatResponse;
import com.awad.ticketbooking.modules.ai.service.AiChatService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AiChatControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AiChatService aiChatService;

    @InjectMocks
    private AiChatController aiChatController;

    private ObjectMapper objectMapper;
    private ChatResponse mockChatResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(aiChatController).build();
        objectMapper = new ObjectMapper();

        mockChatResponse = new ChatResponse("Hello! How can I help you?");
    }

    @Test
    void chat_success() throws Exception {
        // Arrange
        ChatRequest request = new ChatRequest();
        request.setMessage("Hello");
        request.setUserId(java.util.UUID.randomUUID());
        when(aiChatService.getChatResponse(any(ChatRequest.class))).thenReturn(mockChatResponse);

        // Act & Assert
        mockMvc.perform(post("/api/v1/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reply").value("Hello! How can I help you?"));

        verify(aiChatService).getChatResponse(any(ChatRequest.class));
    }
}
