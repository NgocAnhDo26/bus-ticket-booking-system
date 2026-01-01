package com.awad.ticketbooking.modules.trip.controller;

import com.awad.ticketbooking.modules.trip.dto.CreateTripRequest;
import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
@Tag(name = "Trips", description = "Endpoints for searching and managing bus trips.")
public class TripController {

    private final TripService tripService;

    @GetMapping("/search")
    @Operation(summary = "Search trips", description = "Searches for available trips based on origin, destination and date filters.")
    public ResponseEntity<Page<TripResponse>> searchTrips(@ModelAttribute SearchTripRequest request) {
        return ResponseEntity.ok(tripService.searchTrips(request));
    }

    @GetMapping
    @Operation(summary = "List trips", description = "Returns a paginated list of trips.")
    public ResponseEntity<Page<TripResponse>> getAllTrips(org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(tripService.getAllTrips(pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get trip by ID", description = "Returns details of a specific trip.")
    public ResponseEntity<TripResponse> getTripById(@PathVariable UUID id) {
        return ResponseEntity.ok(tripService.getTripById(id));
    }

    @PostMapping
    @Operation(summary = "Create trip", description = "Creates a new trip with pricing and schedule information.")
    public ResponseEntity<TripResponse> createTrip(@RequestBody @Valid CreateTripRequest request) {
        return ResponseEntity.ok(tripService.createTrip(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update trip", description = "Updates an existing trip.")
    public ResponseEntity<TripResponse> updateTrip(@PathVariable UUID id,
            @RequestBody @Valid CreateTripRequest request) {
        return ResponseEntity.ok(tripService.updateTrip(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete trip", description = "Deletes (or force deletes) a trip. When force is true, will also handle dependent entities.")
    public ResponseEntity<Void> deleteTrip(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean force) {
        tripService.deleteTrip(id, force);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/stops")
    @Operation(summary = "Update trip stops", description = "Updates the specific stops for a trip.")
    public ResponseEntity<TripResponse> updateTripStops(@PathVariable UUID id,
            @RequestBody @Valid com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest request) {
        return ResponseEntity.ok(tripService.updateTripStops(id, request));
    }

    @GetMapping("/{id}/passengers")
    @Operation(summary = "Get trip passengers", description = "Returns a list of passengers for a specific trip.")
    public ResponseEntity<java.util.List<com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse>> getTripPassengers(
            @PathVariable UUID id) {
        return ResponseEntity.ok(tripService.getTripPassengers(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update trip status", description = "Updates the status of a trip.")
    public ResponseEntity<TripResponse> updateTripStatus(@PathVariable UUID id,
            @RequestParam com.awad.ticketbooking.common.enums.TripStatus status) {
        return ResponseEntity.ok(tripService.updateTripStatus(id, status));
    }
}
