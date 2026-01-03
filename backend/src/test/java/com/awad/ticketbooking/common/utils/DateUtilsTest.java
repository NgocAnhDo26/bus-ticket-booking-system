package com.awad.ticketbooking.common.utils;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

import static org.junit.jupiter.api.Assertions.*;

class DateUtilsTest {

    @Test
    void nowUtc_shouldReturnCurrentInstant() {
        // Act
        Instant result = DateUtils.nowUtc();

        // Assert
        assertNotNull(result);
        // Should be very close to now (within 1 second)
        Instant now = Instant.now();
        long diff = Math.abs(now.toEpochMilli() - result.toEpochMilli());
        assertTrue(diff < 1000, "Should return current time within 1 second");
    }

    @Test
    void formatIso_shouldFormatInstantCorrectly() {
        // Arrange
        Instant instant = Instant.parse("2024-01-15T10:30:00Z");
        
        // Act
        String result = DateUtils.formatIso(instant);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("2024-01-15"));
        assertTrue(result.contains("10:30:00"));
        // Should be in UTC format
        assertTrue(result.endsWith("Z") || result.contains("+00:00"));
    }

    @Test
    void formatIso_withDifferentInstants_shouldFormatCorrectly() {
        // Arrange
        Instant instant1 = Instant.parse("2023-12-25T00:00:00Z");
        Instant instant2 = Instant.parse("2025-06-30T23:59:59Z");

        // Act
        String result1 = DateUtils.formatIso(instant1);
        String result2 = DateUtils.formatIso(instant2);

        // Assert
        assertNotNull(result1);
        assertNotNull(result2);
        assertTrue(result1.contains("2023-12-25"));
        assertTrue(result2.contains("2025-06-30"));
    }

    @Test
    void formatIso_withEpochSecond_shouldFormatCorrectly() {
        // Arrange
        Instant instant = Instant.ofEpochSecond(1705312200); // 2024-01-15T10:30:00Z

        // Act
        String result = DateUtils.formatIso(instant);

        // Assert
        assertNotNull(result);
        assertTrue(result.contains("2024"));
    }
}
