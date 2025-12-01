package com.awad.ticketbooking.modules.catalog.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateBusRequest {
    @NotNull
    private UUID operatorId;

    @NotBlank
    private String plateNumber;

    @NotNull
    @Min(1)
    private Integer capacity;

    private List<String> amenities;
}
