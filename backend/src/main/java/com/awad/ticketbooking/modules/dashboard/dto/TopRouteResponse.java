package com.awad.ticketbooking.modules.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopRouteResponse {
    private UUID routeId;
    private String origin;
    private String destination;
    private long ticketsSold;
}
