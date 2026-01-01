package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.StopType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateTripStopsRequest {

    @Valid
    @NotNull
    private List<TripStopDto> stops;

    @Data
    public static class TripStopDto {
        // Optional - either stationId OR customAddress must be provided
        private UUID stationId;

        // Custom stop fields - used when stationId is null
        private String customName;
        private String customAddress;

        @NotNull
        private Integer stopOrder;

        @NotNull
        private Integer durationMinutesFromOrigin;

        @NotNull
        private StopType stopType;

        /**
         * Validates that either stationId or customAddress is provided.
         */
        public boolean isValid() {
            return stationId != null || (customAddress != null && !customAddress.isBlank());
        }
    }
}
