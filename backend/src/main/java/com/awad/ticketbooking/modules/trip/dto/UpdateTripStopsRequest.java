package com.awad.ticketbooking.modules.trip.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class UpdateTripStopsRequest {

    @Valid
    @NotNull
    private List<TripStopDto> stops;
}
