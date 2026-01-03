package com.awad.ticketbooking.common.exception;

import com.awad.ticketbooking.common.model.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authorization.AuthorizationDeniedException;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @InjectMocks
    private GlobalExceptionHandler globalExceptionHandler;

    @BeforeEach
    void setUp() {
        globalExceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void handleException_returnsInternalServerError() {
        // Arrange
        Exception exception = new Exception("Something went wrong");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleException(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().status());
        assertEquals("Something went wrong", response.getBody().message());
    }

    @Test
    void handleIllegalArgument_returnsBadRequest() {
        // Arrange
        IllegalArgumentException exception = new IllegalArgumentException("Invalid input");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleIllegalArgument(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertEquals("Invalid input", response.getBody().message());
    }

    @Test
    void handleAuthorizationDenied_returnsForbidden() {
        // Arrange
        AuthorizationDeniedException exception = new AuthorizationDeniedException("Access denied");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleAuthorizationDenied(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().status());
        assertTrue(response.getBody().message().contains("Access Denied"));
    }

    @Test
    void handleAccessDenied_returnsForbidden() {
        // Arrange
        AccessDeniedException exception = new AccessDeniedException("Access denied");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleAccessDenied(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(403, response.getBody().status());
        assertTrue(response.getBody().message().contains("Access Denied"));
    }

    @Test
    void handleBadCredentials_returnsUnauthorized() {
        // Arrange
        BadCredentialsException exception = new BadCredentialsException("Bad credentials");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleBadCredentials(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().status());
    }

    @Test
    void handleImageUploadException_returnsBadRequest() {
        // Arrange
        ImageUploadException exception = new ImageUploadException("Image upload failed");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleImageUploadException(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
        assertEquals("Image upload failed", response.getBody().message());
    }

    @Test
    void handleResourceNotFound_returnsNotFound() {
        // Arrange
        ResourceNotFoundException exception = new ResourceNotFoundException("Resource not found");

        // Act
        ResponseEntity<ApiResponse<Void>> response = globalExceptionHandler.handleResourceNotFound(exception);

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(404, response.getBody().status());
        assertEquals("Resource not found", response.getBody().message());
    }
}
