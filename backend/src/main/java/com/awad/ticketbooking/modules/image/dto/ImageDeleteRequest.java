package com.awad.ticketbooking.modules.image.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImageDeleteRequest {
    @NotBlank(message = "Public ID is required")
    private String publicId;
}
