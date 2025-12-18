package com.awad.ticketbooking.modules.dashboard.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@Schema(description = "Aggregated booking counts for a time bucket within a given range.")
public class BookingTrendResponse {

    @Schema(
            description = "Time bucket label returned by the database (e.g. 2025-01-01 or 2025-01-01 00:00:00).",
            example = "2025-01-01"
    )
    private String bucket;

    @Schema(description = "Total bookings created in this bucket (all statuses).", example = "42")
    private long totalBookings;

    @Schema(description = "Confirmed bookings created in this bucket.", example = "31")
    private long confirmedBookings;
}


