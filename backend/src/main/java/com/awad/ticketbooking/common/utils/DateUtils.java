package com.awad.ticketbooking.common.utils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class DateUtils {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneId.of("UTC"));

    private DateUtils() {}

    public static Instant nowUtc() {
        return Instant.now();
    }

    public static String formatIso(Instant instant) {
        return ISO_FORMATTER.format(instant);
    }
}

