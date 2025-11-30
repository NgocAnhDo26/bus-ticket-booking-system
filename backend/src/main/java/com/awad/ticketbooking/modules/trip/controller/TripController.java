package com.awad.ticketbooking.modules.trip.controller;

import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping("/search")
    public ResponseEntity<Page<TripResponse>> searchTrips(@ModelAttribute SearchTripRequest request) {
        return ResponseEntity.ok(tripService.searchTrips(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(@PathVariable UUID id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }
}
