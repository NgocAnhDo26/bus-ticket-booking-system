package com.awad.ticketbooking.modules.image.service;

import com.awad.ticketbooking.common.exception.ImageUploadException;
import com.awad.ticketbooking.modules.image.dto.BatchImageUploadResponse;
import com.awad.ticketbooking.modules.image.dto.ImageUploadResponse;
import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.cloudinary.utils.ObjectUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImageServiceTest {

    @InjectMocks
    private ImageService imageService;

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    private MockMultipartFile validImageFile;
    private MockMultipartFile invalidTypeFile;
    private MockMultipartFile tooLargeFile;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(imageService, "maxBatchSizeMB", 50L);
        ReflectionTestUtils.setField(imageService, "maxBatchFiles", 20);

        when(cloudinary.uploader()).thenReturn(uploader);

        // Valid image file (JPEG, 1MB)
        byte[] imageBytes = new byte[1024 * 1024]; // 1MB
        validImageFile = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                imageBytes
        );

        // Invalid type file
        invalidTypeFile = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "content".getBytes()
        );

        // Too large file (6MB)
        byte[] largeBytes = new byte[6 * 1024 * 1024];
        tooLargeFile = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                largeBytes
        );
    }

    @Test
    void uploadImage_success() throws Exception {
        // Arrange
        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.jpg");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.jpg");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "jpg");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        // Act
        ImageUploadResponse response = imageService.uploadImage(validImageFile, "test-folder");

        // Assert
        assertNotNull(response);
        assertEquals("http://cloudinary.com/image.jpg", response.getUrl());
        assertEquals("test-id", response.getPublicId());
        assertEquals("https://cloudinary.com/image.jpg", response.getSecureUrl());
        assertEquals(1024L, response.getBytes());
        assertEquals("jpg", response.getFormat());
        assertEquals(800, response.getWidth());
        assertEquals(600, response.getHeight());
        verify(uploader).upload(any(byte[].class), any(Map.class));
    }

    @Test
    void uploadImage_withNullFolder_success() throws Exception {
        // Arrange
        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.jpg");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.jpg");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "jpg");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        // Act
        ImageUploadResponse response = imageService.uploadImage(validImageFile, null);

        // Assert
        assertNotNull(response);
        verify(uploader).upload(any(byte[].class), any(Map.class));
    }

    @Test
    void uploadImage_withEmptyFolder_success() throws Exception {
        // Arrange
        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.jpg");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.jpg");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "jpg");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        // Act
        ImageUploadResponse response = imageService.uploadImage(validImageFile, "");

        // Assert
        assertNotNull(response);
        verify(uploader).upload(any(byte[].class), any(Map.class));
    }

    @Test
    void uploadImage_nullFile_throwsException() {
        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImage(null, "folder");
        });
    }

    @Test
    void uploadImage_emptyFile_throwsException() {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);

        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImage(emptyFile, "folder");
        });
    }

    @Test
    void uploadImage_invalidContentType_throwsException() {
        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImage(invalidTypeFile, "folder");
        });
    }

    @Test
    void uploadImage_tooLargeFile_throwsException() {
        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImage(tooLargeFile, "folder");
        });
    }

    @Test
    void uploadImage_ioException_throwsException() throws Exception {
        // Arrange
        when(uploader.upload(any(byte[].class), any(Map.class)))
                .thenThrow(new IOException("Network error"));

        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImage(validImageFile, "folder");
        });
    }

    @Test
    void uploadImage_cloudinaryException_throwsException() throws Exception {
        // Arrange
        when(uploader.upload(any(byte[].class), any(Map.class)))
                .thenThrow(new RuntimeException("Cloudinary error"));

        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImage(validImageFile, "folder");
        });
    }

    @Test
    void uploadImages_success() throws Exception {
        // Arrange
        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.jpg");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.jpg");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "jpg");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        MockMultipartFile file1 = new MockMultipartFile("file1", "test1.jpg", "image/jpeg", new byte[1024]);
        MockMultipartFile file2 = new MockMultipartFile("file2", "test2.jpg", "image/jpeg", new byte[1024]);

        // Act
        BatchImageUploadResponse response = imageService.uploadImages(
                new MultipartFile[]{file1, file2},
                "test-folder"
        );

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getTotalCount());
        assertEquals(2, response.getSuccessCount());
        assertEquals(0, response.getFailureCount());
        assertEquals(2, response.getSuccessful().size());
        assertTrue(response.getFailed().isEmpty());
    }

    @Test
    void uploadImages_nullFiles_throwsException() {
        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImages(null, "folder");
        });
    }

    @Test
    void uploadImages_emptyArray_throwsException() {
        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImages(new MultipartFile[0], "folder");
        });
    }

    @Test
    void uploadImages_tooManyFiles_throwsException() {
        // Arrange
        MultipartFile[] files = new MultipartFile[21]; // Exceeds maxBatchFiles (20)
        for (int i = 0; i < 21; i++) {
            files[i] = validImageFile;
        }

        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.uploadImages(files, "folder");
        });
    }

    @Test
    void uploadImages_withSomeFailures_returnsPartialSuccess() throws Exception {
        // Arrange
        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.jpg");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.jpg");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "jpg");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class)))
                .thenReturn(uploadResult)
                .thenThrow(new RuntimeException("Upload failed"));

        MockMultipartFile file1 = new MockMultipartFile("file1", "test1.jpg", "image/jpeg", new byte[1024]);
        MockMultipartFile file2 = new MockMultipartFile("file2", "test2.jpg", "image/jpeg", new byte[1024]);

        // Act
        BatchImageUploadResponse response = imageService.uploadImages(
                new MultipartFile[]{file1, file2},
                "test-folder"
        );

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getTotalCount());
        assertEquals(1, response.getSuccessCount());
        assertEquals(1, response.getFailureCount());
        assertEquals(1, response.getSuccessful().size());
        assertEquals(1, response.getFailed().size());
    }

    @Test
    void uploadImages_withNullFilesInArray_skipsNullFiles() throws Exception {
        // Arrange
        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.jpg");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.jpg");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "jpg");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        MockMultipartFile file1 = new MockMultipartFile("file1", "test1.jpg", "image/jpeg", new byte[1024]);

        // Act
        BatchImageUploadResponse response = imageService.uploadImages(
                new MultipartFile[]{file1, null},
                "test-folder"
        );

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getTotalCount());
        assertEquals(1, response.getSuccessCount());
        assertEquals(0, response.getFailureCount());
    }

    @Test
    void deleteImage_success() throws Exception {
        // Arrange
        Map<String, Object> deleteResult = new HashMap<>();
        deleteResult.put("result", "ok");

        when(uploader.destroy(eq("test-public-id"), any(Map.class))).thenReturn(deleteResult);

        // Act
        imageService.deleteImage("test-public-id");

        // Assert
        verify(uploader).destroy(eq("test-public-id"), any(Map.class));
    }

    @Test
    void deleteImage_failure_throwsException() throws Exception {
        // Arrange
        Map<String, Object> deleteResult = new HashMap<>();
        deleteResult.put("result", "not found");

        when(uploader.destroy(eq("test-public-id"), any(Map.class))).thenReturn(deleteResult);

        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.deleteImage("test-public-id");
        });
    }

    @Test
    void deleteImage_ioException_throwsException() throws Exception {
        // Arrange
        when(uploader.destroy(eq("test-public-id"), any(Map.class)))
                .thenThrow(new IOException("Network error"));

        // Act & Assert
        assertThrows(ImageUploadException.class, () -> {
            imageService.deleteImage("test-public-id");
        });
    }

    @Test
    void deleteImages_success() throws Exception {
        // Arrange
        Map<String, Object> deleteResult = new HashMap<>();
        deleteResult.put("result", "ok");

        when(uploader.destroy(anyString(), any(Map.class))).thenReturn(deleteResult);

        // Act
        Map<String, Boolean> results = imageService.deleteImages(List.of("id1", "id2", "id3"));

        // Assert
        assertNotNull(results);
        assertEquals(3, results.size());
        assertTrue(results.get("id1"));
        assertTrue(results.get("id2"));
        assertTrue(results.get("id3"));
    }

    @Test
    void deleteImages_withSomeFailures_returnsPartialResults() throws Exception {
        // Arrange
        Map<String, Object> successResult = new HashMap<>();
        successResult.put("result", "ok");

        Map<String, Object> failureResult = new HashMap<>();
        failureResult.put("result", "not found");

        when(uploader.destroy(eq("id1"), any(Map.class))).thenReturn(successResult);
        when(uploader.destroy(eq("id2"), any(Map.class))).thenReturn(failureResult);

        // Act
        Map<String, Boolean> results = imageService.deleteImages(List.of("id1", "id2"));

        // Assert
        assertNotNull(results);
        assertEquals(2, results.size());
        assertTrue(results.get("id1"));
        assertFalse(results.get("id2"));
    }

    @Test
    void uploadImage_withPngFile_success() throws Exception {
        // Arrange
        MockMultipartFile pngFile = new MockMultipartFile(
                "file",
                "test.png",
                "image/png",
                new byte[1024]
        );

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.png");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.png");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "png");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        // Act
        ImageUploadResponse response = imageService.uploadImage(pngFile, "test-folder");

        // Assert
        assertNotNull(response);
        assertEquals("png", response.getFormat());
    }

    @Test
    void uploadImage_withWebpFile_success() throws Exception {
        // Arrange
        MockMultipartFile webpFile = new MockMultipartFile(
                "file",
                "test.webp",
                "image/webp",
                new byte[1024]
        );

        Map<String, Object> uploadResult = new HashMap<>();
        uploadResult.put("url", "http://cloudinary.com/image.webp");
        uploadResult.put("public_id", "test-id");
        uploadResult.put("secure_url", "https://cloudinary.com/image.webp");
        uploadResult.put("bytes", 1024L);
        uploadResult.put("format", "webp");
        uploadResult.put("width", 800);
        uploadResult.put("height", 600);

        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(uploadResult);

        // Act
        ImageUploadResponse response = imageService.uploadImage(webpFile, "test-folder");

        // Assert
        assertNotNull(response);
        assertEquals("webp", response.getFormat());
    }
}
