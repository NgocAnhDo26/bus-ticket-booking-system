package com.awad.ticketbooking.common.utils;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class QrCodeUtilsTest {

    @Test
    void generateQrCodeImage_success() {
        // Act
        byte[] result = QrCodeUtils.generateQrCodeImage("BK-ABC123", 200, 200);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void generateQrCodeImage_withLongText_success() {
        // Arrange
        String longText = "https://example.com/booking/verify?code=BK-ABC123&token=abcdefghijklmnop";

        // Act
        byte[] result = QrCodeUtils.generateQrCodeImage(longText, 300, 300);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void generateQrCodeImage_smallSize_success() {
        // Act
        byte[] result = QrCodeUtils.generateQrCodeImage("TEST", 50, 50);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void generateQrCodeImage_largeSize_success() {
        // Act
        byte[] result = QrCodeUtils.generateQrCodeImage("TEST", 500, 500);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void generateQrCodeImage_withSpecialCharacters_success() {
        // Arrange
        String specialText = "Mã vé: BK-ABC123 - Điểm đón: Hà Nội";

        // Act
        byte[] result = QrCodeUtils.generateQrCodeImage(specialText, 200, 200);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
    }
}
