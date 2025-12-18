package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TopRouteResponse {
    private UUID routeId;
    private String origin;
    private String destination;
    private long ticketsSold;
}
