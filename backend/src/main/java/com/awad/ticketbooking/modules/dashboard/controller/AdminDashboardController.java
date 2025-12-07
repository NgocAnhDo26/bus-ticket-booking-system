package com.awad.ticketbooking.modules.dashboard.controller;

import com.awad.ticketbooking.modules.dashboard.dto.*;
import com.awad.ticketbooking.modules.dashboard.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/metrics")
    public ResponseEntity<MetricsResponse> getMetrics() {
        return ResponseEntity.ok(adminDashboardService.getMetrics());
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueChartResponse>> getRevenueChart(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to) {
        if (from == null) {
            from = Instant.now().minusSeconds(7 * 24 * 60 * 60); // Default 7 days
        }
        if (to == null) {
            to = Instant.now();
        }
        return ResponseEntity.ok(adminDashboardService.getRevenueChart(from, to));
    }

    @GetMapping("/top-routes")
    public ResponseEntity<List<TopRouteResponse>> getTopRoutes(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(adminDashboardService.getTopRoutes(limit));
    }

    @GetMapping("/recent-transactions")
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminDashboardService.getRecentTransactions(limit));
    }

    @GetMapping("/top-operators")
    public ResponseEntity<List<TopOperatorResponse>> getTopOperators(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(adminDashboardService.getTopOperators(limit));
    }
}
