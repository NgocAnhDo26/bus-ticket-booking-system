package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.service.RouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
    public ResponseEntity<List<com.awad.ticketbooking.modules.catalog.dto.RouteResponse>> getAllRoutes() {
        return ResponseEntity.ok(routeService.getAllRoutes());
    }

    @org.springframework.web.bind.annotation.PostMapping
    public ResponseEntity<Route> createRoute(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
        return ResponseEntity.ok(routeService.createRoute(request));
    }
}
