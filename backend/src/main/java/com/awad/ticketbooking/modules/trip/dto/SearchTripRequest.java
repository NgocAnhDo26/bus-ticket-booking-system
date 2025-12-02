package com.awad.ticketbooking.modules.trip.dto;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class SearchTripRequest {
    private String origin;
    private String destination;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate date;

    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime minTime;

    @DateTimeFormat(iso = DateTimeFormat.ISO.TIME)
    private LocalTime maxTime;

    private BigDecimal minPrice;
    private BigDecimal maxPrice;

    private List<String> amenities;
    private List<java.util.UUID> operatorIds;

    private String sortBy; // e.g., "price,asc" or "departureTime,desc"
    private int page = 0;
    private int size = 10;
}
