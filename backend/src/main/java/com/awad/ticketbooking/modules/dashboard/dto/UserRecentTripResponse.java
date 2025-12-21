package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRecentTripResponse {
    private String origin;
    private String destination;
    private Instant departureTime;
    private double distance;
    private String status;
}
