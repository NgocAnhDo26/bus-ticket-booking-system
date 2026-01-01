package com.awad.ticketbooking.modules.image.controller;

import com.awad.ticketbooking.modules.image.dto.BatchImageUploadResponse;
import com.awad.ticketbooking.modules.image.dto.ImageDeleteRequest;
import com.awad.ticketbooking.modules.image.dto.ImageUploadResponse;
import com.awad.ticketbooking.modules.image.service.ImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
@Tag(name = "Images", description = "Endpoints for uploading and managing images via Cloudinary")
public class ImageController {

    private final ImageService imageService;

    @PostMapping("/upload")
    @Operation(summary = "Upload single image", description = "Uploads a single image to Cloudinary")
    public ResponseEntity<ImageUploadResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", required = false) String folder) {
        return ResponseEntity.ok(imageService.uploadImage(file, folder));
    }

    @PostMapping("/upload/batch")
    @Operation(summary = "Upload multiple images", description = "Uploads multiple images to Cloudinary in batch")
    public ResponseEntity<BatchImageUploadResponse> uploadImages(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folder", required = false) String folder) {
        return ResponseEntity.ok(imageService.uploadImages(files, folder));
    }

    @DeleteMapping
    @Operation(summary = "Delete single image", description = "Deletes an image from Cloudinary by public ID")
    public ResponseEntity<Void> deleteImage(@Valid @RequestBody ImageDeleteRequest request) {
        imageService.deleteImage(request.getPublicId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/batch")
    @Operation(summary = "Delete multiple images", description = "Deletes multiple images from Cloudinary by public IDs")
    public ResponseEntity<Map<String, Boolean>> deleteImages(@RequestBody List<String> publicIds) {
        return ResponseEntity.ok(imageService.deleteImages(publicIds));
    }
}
