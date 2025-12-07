package com.awad.ticketbooking.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class CreateBusRequest {
    @NotNull
    private UUID operatorId;

    @NotNull
    private UUID busLayoutId;

    @NotBlank
    private String plateNumber;

    private List<String> amenities;
}
