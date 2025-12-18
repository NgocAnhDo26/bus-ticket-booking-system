package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateStationRequest;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.service.StationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stations")
@RequiredArgsConstructor
public class StationController {

    private final StationService stationService;

    @PostMapping
    public ResponseEntity<Station> createStation(@Valid @RequestBody CreateStationRequest request) {
        return ResponseEntity.ok(stationService.createStation(request));
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<Station>> getAllStations(
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(stationService.getAllStations(pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Station> updateStation(@PathVariable java.util.UUID id,
                                                 @Valid @RequestBody CreateStationRequest request) {
        return ResponseEntity.ok(stationService.updateStation(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStation(@PathVariable java.util.UUID id,
                                              @RequestParam(defaultValue = "false") boolean force) {
        stationService.deleteStation(id, force);
        return ResponseEntity.noContent().build();
    }
}
