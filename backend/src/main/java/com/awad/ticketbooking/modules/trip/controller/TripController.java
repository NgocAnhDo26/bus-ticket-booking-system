package com.awad.ticketbooking.modules.trip.controller;

import com.awad.ticketbooking.modules.trip.dto.CreateTripRequest;
import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping("/search")
    public ResponseEntity<Page<TripResponse>> searchTrips(@ModelAttribute SearchTripRequest request) {
        return ResponseEntity.ok(tripService.searchTrips(request));
    }

    @GetMapping
    public ResponseEntity<Page<TripResponse>> getAllTrips(org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(tripService.getAllTrips(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponse> getTripById(@PathVariable UUID id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PostMapping
    public ResponseEntity<TripResponse> createTrip(@RequestBody CreateTripRequest request) {
        return ResponseEntity.ok(tripService.createTrip(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripResponse> updateTrip(@PathVariable UUID id, @RequestBody CreateTripRequest request) {
        return ResponseEntity.ok(tripService.updateTrip(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean force) {
        tripService.deleteTrip(id, force);
        return ResponseEntity.noContent().build();
    }
}
