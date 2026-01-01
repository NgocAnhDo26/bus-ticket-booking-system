package com.awad.ticketbooking.modules.image.service;

import com.awad.ticketbooking.common.config.CloudinaryConfig;
import com.awad.ticketbooking.common.exception.ImageUploadException;
import com.awad.ticketbooking.modules.image.dto.BatchImageUploadResponse;
import com.awad.ticketbooking.modules.image.dto.ImageUploadResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImageService {

    private final Cloudinary cloudinary;

    @Value("${cloudinary.max-batch-size-mb:50}")
    private long maxBatchSizeMB;

    @Value("${cloudinary.max-batch-files:20}")
    private int maxBatchFiles;

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public ImageUploadResponse uploadImage(MultipartFile file, String folder) {
        validateFile(file);

        try {
            Map<String, Object> uploadParams = new HashMap<>();
            uploadParams.put("resource_type", "image");
            uploadParams.put("overwrite", true);
            uploadParams.put("invalidate", true);
            
            if (folder != null && !folder.trim().isEmpty()) {
                uploadParams.put("folder", folder);
            }

            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    uploadParams
            );

            return buildImageUploadResponse(uploadResult);
        } catch (IOException e) {
            log.error("Error reading file: {}", e.getMessage());
            throw new ImageUploadException("Failed to read file: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Error uploading image to Cloudinary: {}", e.getMessage());
            throw new ImageUploadException("Failed to upload image: " + e.getMessage(), e);
        }
    }

    public BatchImageUploadResponse uploadImages(MultipartFile[] files, String folder) {
        if (files == null || files.length == 0) {
            throw new ImageUploadException("No files provided");
        }

        if (files.length > maxBatchFiles) {
            throw new ImageUploadException(
                    String.format("Too many files. Maximum allowed: %d, provided: %d", maxBatchFiles, files.length)
            );
        }

        // Validate total batch size
        long totalSize = 0;
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            totalSize += file.getSize();
        }

        long maxBatchSizeBytes = maxBatchSizeMB * 1024 * 1024;
        if (totalSize > maxBatchSizeBytes) {
            throw new ImageUploadException(
                    String.format("Total batch size exceeds limit. Maximum: %d MB, provided: %.2f MB",
                            maxBatchSizeMB, totalSize / (1024.0 * 1024.0))
            );
        }

        List<ImageUploadResponse> successful = new ArrayList<>();
        List<BatchImageUploadResponse.ImageUploadError> failed = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            try {
                validateFile(file);
                ImageUploadResponse response = uploadImage(file, folder);
                successful.add(response);
            } catch (ImageUploadException e) {
                log.warn("Failed to upload file {}: {}", file.getOriginalFilename(), e.getMessage());
                failed.add(BatchImageUploadResponse.ImageUploadError.builder()
                        .fileName(file.getOriginalFilename())
                        .error(e.getMessage())
                        .build());
            } catch (Exception e) {
                log.error("Unexpected error uploading file {}: {}", file.getOriginalFilename(), e.getMessage());
                failed.add(BatchImageUploadResponse.ImageUploadError.builder()
                        .fileName(file.getOriginalFilename())
                        .error("Unexpected error: " + e.getMessage())
                        .build());
            }
        }

        return BatchImageUploadResponse.builder()
                .successful(successful)
                .failed(failed)
                .totalCount(files.length)
                .successCount(successful.size())
                .failureCount(failed.size())
                .build();
    }

    public void deleteImage(String publicId) {
        try {
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            String resultValue = (String) result.get("result");
            if (!"ok".equals(resultValue)) {
                throw new ImageUploadException("Failed to delete image. Result: " + resultValue);
            }
            log.info("Successfully deleted image with public ID: {}", publicId);
        } catch (IOException e) {
            log.error("Error deleting image from Cloudinary: {}", e.getMessage());
            throw new ImageUploadException("Failed to delete image: " + e.getMessage(), e);
        }
    }

    public Map<String, Boolean> deleteImages(List<String> publicIds) {
        Map<String, Boolean> results = new HashMap<>();
        for (String publicId : publicIds) {
            try {
                deleteImage(publicId);
                results.put(publicId, true);
            } catch (Exception e) {
                log.error("Failed to delete image {}: {}", publicId, e.getMessage());
                results.put(publicId, false);
            }
        }
        return results;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ImageUploadException("File is empty or null");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ImageUploadException(
                    String.format("Invalid file type. Allowed types: %s", String.join(", ", ALLOWED_CONTENT_TYPES))
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ImageUploadException(
                    String.format("File size exceeds limit. Maximum: %d MB, provided: %.2f MB",
                            MAX_FILE_SIZE / (1024 * 1024), file.getSize() / (1024.0 * 1024.0))
            );
        }
    }

    private ImageUploadResponse buildImageUploadResponse(Map<String, Object> uploadResult) {
        return ImageUploadResponse.builder()
                .url((String) uploadResult.get("url"))
                .publicId((String) uploadResult.get("public_id"))
                .secureUrl((String) uploadResult.get("secure_url"))
                .bytes(((Number) uploadResult.get("bytes")).longValue())
                .format((String) uploadResult.get("format"))
                .width(((Number) uploadResult.get("width")).intValue())
                .height(((Number) uploadResult.get("height")).intValue())
                .build();
    }
}
