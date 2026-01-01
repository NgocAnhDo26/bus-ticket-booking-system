package com.awad.ticketbooking.modules.image.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageUploadResponse {
    private String url;
    private String publicId;
    private String secureUrl;
    private Long bytes;
    private String format;
    private Integer width;
    private Integer height;
}
