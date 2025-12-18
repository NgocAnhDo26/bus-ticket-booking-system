package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.BusLayoutPayload;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.service.BusLayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bus-layouts")
@RequiredArgsConstructor
public class BusLayoutController {

    private final BusLayoutService busLayoutService;

    @PostMapping
    public ResponseEntity<BusLayout> createLayout(@RequestBody BusLayoutPayload.BusLayoutRequest request) {
        return ResponseEntity.ok(busLayoutService.createLayout(request));
    }

    @PutMapping("/{id}/seats")
    public ResponseEntity<Void> updateLayoutSeats(@PathVariable UUID id,
            @RequestBody BusLayoutPayload.SeatUpdatePayload payload) {
        busLayoutService.updateLayoutSeats(id, payload);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusLayout> updateLayoutMetadata(@PathVariable UUID id,
            @RequestBody BusLayoutPayload.BusLayoutRequest request) {
        return ResponseEntity.ok(busLayoutService.updateLayoutMetadata(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLayout(@PathVariable UUID id) {
        busLayoutService.deleteLayout(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusLayoutPayload.BusLayoutResponse> getLayout(@PathVariable UUID id) {
        return ResponseEntity.ok(busLayoutService.getLayout(id));
    }

    @GetMapping
    public ResponseEntity<List<BusLayoutPayload.BusLayoutResponse>> getAllLayouts() {
        return ResponseEntity.ok(busLayoutService.getAllLayouts());
    }
}
