package com.awad.ticketbooking.modules.image.controller;

import com.awad.ticketbooking.modules.image.dto.BatchImageUploadResponse;
import com.awad.ticketbooking.modules.image.dto.ImageDeleteRequest;
import com.awad.ticketbooking.modules.image.dto.ImageUploadResponse;
import com.awad.ticketbooking.modules.image.service.ImageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ImageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ImageService imageService;

    @InjectMocks
    private ImageController imageController;

    private ObjectMapper objectMapper;
    private ImageUploadResponse mockResponse;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(imageController).build();
        objectMapper = new ObjectMapper();

        mockResponse = ImageUploadResponse.builder()
                .url("http://cloudinary.com/image.jpg")
                .publicId("test-id")
                .secureUrl("https://cloudinary.com/image.jpg")
                .bytes(1024L)
                .format("jpg")
                .width(800)
                .height(600)
                .build();
    }

    @Test
    void uploadImage_success() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "test content".getBytes()
        );
        when(imageService.uploadImage(any(), anyString())).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(multipart("/api/images/upload")
                        .file(file)
                        .param("folder", "test-folder"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.url").value("http://cloudinary.com/image.jpg"))
                .andExpect(jsonPath("$.publicId").value("test-id"));

        verify(imageService).uploadImage(any(), eq("test-folder"));
    }

    @Test
    void uploadImage_withoutFolder_success() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.jpg", "image/jpeg", "test content".getBytes()
        );
        when(imageService.uploadImage(any(), any())).thenReturn(mockResponse);

        // Act & Assert
        mockMvc.perform(multipart("/api/images/upload")
                        .file(file))
                .andExpect(status().isOk());

        verify(imageService).uploadImage(any(), isNull());
    }

    @Test
    void uploadImages_success() throws Exception {
        // Arrange
        MockMultipartFile file1 = new MockMultipartFile(
                "files", "test1.jpg", "image/jpeg", "content1".getBytes()
        );
        MockMultipartFile file2 = new MockMultipartFile(
                "files", "test2.jpg", "image/jpeg", "content2".getBytes()
        );

        BatchImageUploadResponse batchResponse = BatchImageUploadResponse.builder()
                .successful(List.of(mockResponse))
                .failed(List.of())
                .totalCount(2)
                .successCount(2)
                .failureCount(0)
                .build();

        when(imageService.uploadImages(any(), anyString())).thenReturn(batchResponse);

        // Act & Assert
        mockMvc.perform(multipart("/api/images/upload/batch")
                        .file(file1)
                        .file(file2)
                        .param("folder", "test-folder"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(2))
                .andExpect(jsonPath("$.successCount").value(2));

        verify(imageService).uploadImages(any(), eq("test-folder"));
    }

    @Test
    void deleteImage_success() throws Exception {
        // Arrange
        ImageDeleteRequest request = new ImageDeleteRequest();
        request.setPublicId("test-public-id");
        doNothing().when(imageService).deleteImage(anyString());

        // Act & Assert
        mockMvc.perform(delete("/api/images")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());

        verify(imageService).deleteImage("test-public-id");
    }

    @Test
    void deleteImages_success() throws Exception {
        // Arrange
        List<String> publicIds = List.of("id1", "id2", "id3");
        Map<String, Boolean> deleteResults = new HashMap<>();
        deleteResults.put("id1", true);
        deleteResults.put("id2", true);
        deleteResults.put("id3", false);

        when(imageService.deleteImages(anyList())).thenReturn(deleteResults);

        // Act & Assert
        mockMvc.perform(delete("/api/images/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(publicIds)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id1").value(true))
                .andExpect(jsonPath("$.id2").value(true))
                .andExpect(jsonPath("$.id3").value(false));

        verify(imageService).deleteImages(publicIds);
    }
}
