package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateBusRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.service.BusService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/buses")
@RequiredArgsConstructor
public class BusController {

    private final BusService busService;

    @PostMapping
    public ResponseEntity<Bus> createBus(@Valid @RequestBody CreateBusRequest request) {
        return ResponseEntity.ok(busService.createBus(request));
    }

    @GetMapping
    public ResponseEntity<List<Bus>> getAllBuses() {
        return ResponseEntity.ok(busService.getAllBuses());
    }
}
