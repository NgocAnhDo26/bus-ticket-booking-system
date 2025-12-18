package com.awad.ticketbooking.modules.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class CreateOperatorRequest {
    @NotBlank
    private String name;

    private Map<String, Object> contactInfo;
}
