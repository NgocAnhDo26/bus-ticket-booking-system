package com.awad.ticketbooking.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

        private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(Exception.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleException(Exception e) {
                logger.error("Unhandled exception caught: ", e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(500, e.getMessage()));
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleIllegalArgument(
                        IllegalArgumentException e) {
                logger.warn("Bad request: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(400, e.getMessage()));
        }

        @ExceptionHandler(org.springframework.security.authorization.AuthorizationDeniedException.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleAuthorizationDenied(
                        org.springframework.security.authorization.AuthorizationDeniedException e) {
                logger.warn("Access denied: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(403,
                                                "Access Denied: You do not have permission to access this resource."));
        }

        @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleAccessDenied(
                        org.springframework.security.access.AccessDeniedException e) {
                logger.warn("Access denied: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(403,
                                                "Access Denied: You do not have permission to access this resource."));
        }

        @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleBadCredentials(
                        org.springframework.security.authentication.BadCredentialsException e) {
                logger.warn("Authentication failed: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(401,
                                                "Email hoặc mật khẩu không chính xác."));
        }

        @ExceptionHandler(ImageUploadException.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleImageUploadException(
                        ImageUploadException e) {
                logger.error("Image upload error: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(400, e.getMessage()));
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<com.awad.ticketbooking.common.model.ApiResponse<Void>> handleResourceNotFound(
                        ResourceNotFoundException e) {
                logger.warn("Resource not found: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(com.awad.ticketbooking.common.model.ApiResponse.message(404, e.getMessage()));
        }
}
