package com.awad.ticketbooking.modules.review.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ReviewResponse {
    private UUID id;
    private Integer rating;
    private String comment;
    private Instant createdAt;
    private UserInfo user;
    private RouteInfo route;
    private Instant tripDate;

    @Data
    @Builder
    public static class UserInfo {
        private String name;
        private String avatarUrl;
    }

    @Data
    @Builder
    public static class RouteInfo {
        private String originCity;
        private String destinationCity;
    }
}
