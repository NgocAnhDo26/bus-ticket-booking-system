package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class UserRecentTripResponse {
    private String origin;
    private String destination;
    private Instant departureTime;
    private double distance;
    private String status;
}
