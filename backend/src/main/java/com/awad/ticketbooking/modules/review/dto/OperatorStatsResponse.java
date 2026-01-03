package com.awad.ticketbooking.modules.review.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperatorStatsResponse {
    private Double averageRating;
    private Long totalReviews;
}
