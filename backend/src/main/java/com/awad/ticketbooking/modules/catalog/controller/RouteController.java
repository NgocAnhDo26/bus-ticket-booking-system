package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @GetMapping("/top")
    public ResponseEntity<List<com.awad.ticketbooking.modules.catalog.dto.RouteResponse>> getTopRoutes() {
        return ResponseEntity.ok(routeService.getTopRoutes());
    }

    @GetMapping
    public ResponseEntity<org.springframework.data.domain.Page<com.awad.ticketbooking.modules.catalog.dto.RouteResponse>> getAllRoutes(
            org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(routeService.getAllRoutes(pageable));
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<Route> createRoute(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
        return ResponseEntity.ok(routeService.createRoute(request));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<Route> updateRoute(
            @org.springframework.web.bind.annotation.PathVariable UUID id,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
        return ResponseEntity.ok(routeService.updateRoute(id, request));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoute(@org.springframework.web.bind.annotation.PathVariable UUID id,
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "false") boolean force) {
        routeService.deleteRoute(id, force);
        return ResponseEntity.noContent().build();
    }
}
