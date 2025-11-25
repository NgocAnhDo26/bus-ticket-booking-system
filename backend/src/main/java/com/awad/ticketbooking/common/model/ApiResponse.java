package com.awad.ticketbooking.common.model;

public record ApiResponse<T>(int status, String message, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "OK", data);
    }

    public static ApiResponse<Void> message(int status, String message) {
        return new ApiResponse<>(status, message, null);
    }
}

