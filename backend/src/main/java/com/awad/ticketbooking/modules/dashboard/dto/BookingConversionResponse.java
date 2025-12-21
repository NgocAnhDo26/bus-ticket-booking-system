package com.awad.ticketbooking.modules.dashboard.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Booking conversion metrics for a given time range.")
public class BookingConversionResponse {

    @Schema(description = "Total number of bookings created in the range.", example = "120")
    private long total;

    @Schema(description = "Number of confirmed bookings created in the range.", example = "95")
    private long confirmed;

    @Schema(
            description = "Conversion rate = confirmed / total. When total is 0, conversionRate is 0.",
            example = "0.7917"
    )
    private double conversionRate;
}


