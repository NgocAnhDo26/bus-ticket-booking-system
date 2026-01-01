package com.awad.ticketbooking.modules.ai.dto;

public class ChatRequest {
    private String message;
    private java.util.UUID userId;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public java.util.UUID getUserId() {
        return userId;
    }

    public void setUserId(java.util.UUID userId) {
        this.userId = userId;
    }
}
