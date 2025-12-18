package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateBusRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.service.BusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/buses")
@RequiredArgsConstructor
public class BusController {

    private final BusService busService;

    @PostMapping
    public ResponseEntity<Bus> createBus(@Valid @RequestBody CreateBusRequest request) {
        return ResponseEntity.ok(busService.createBus(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bus> updateBus(@PathVariable UUID id, @Valid @RequestBody CreateBusRequest request) {
        return ResponseEntity.ok(busService.updateBus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBus(@PathVariable UUID id, @RequestParam(defaultValue = "false") boolean force) {
        busService.deleteBus(id, force);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<Bus>> getAllBuses(
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(busService.getAllBuses(pageable));
    }
}
