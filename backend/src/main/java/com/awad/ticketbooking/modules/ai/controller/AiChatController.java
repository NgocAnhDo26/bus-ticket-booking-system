package com.awad.ticketbooking.modules.ai.controller;

import com.awad.ticketbooking.modules.ai.dto.ChatRequest;
import com.awad.ticketbooking.modules.ai.dto.ChatResponse;
import com.awad.ticketbooking.modules.ai.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Chat", description = "AI Chatbot API")
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    @Operation(summary = "Chat with AI Assistant", description = "Send a message to the AI assistant and get a response.")
    public ResponseEntity<ChatResponse> chat(@RequestBody ChatRequest request) {
        ChatResponse response = aiChatService.getChatResponse(request);
        return ResponseEntity.ok(response);
    }
}
