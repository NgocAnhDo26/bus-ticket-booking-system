package com.awad.ticketbooking.modules.catalog.dto;

import com.awad.ticketbooking.common.enums.StopType;
import jakarta.validation.constraints.Min;

import lombok.Data;

import java.util.UUID;

@Data
public class AddRouteStopRequest {
    private UUID stationId;

    private String customName;
    private String customAddress;

    @Min(value = 0, message = "Thứ tự phải là số không âm")
    private int stopOrder;

    @Min(value = 0, message = "Thời gian di chuyển phải là số không âm")
    private int durationMinutesFromOrigin;

    private StopType stopType = StopType.BOTH;
}
