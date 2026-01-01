package com.awad.ticketbooking.modules.image.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchImageUploadResponse {
    private List<ImageUploadResponse> successful;
    private List<ImageUploadError> failed;
    private int totalCount;
    private int successCount;
    private int failureCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageUploadError {
        private String fileName;
        private String error;
    }
}
