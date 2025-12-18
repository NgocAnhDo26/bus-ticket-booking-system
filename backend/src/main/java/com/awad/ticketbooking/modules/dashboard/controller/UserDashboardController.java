package com.awad.ticketbooking.modules.dashboard.controller;

import com.awad.ticketbooking.modules.dashboard.dto.UserDashboardSummaryResponse;
import com.awad.ticketbooking.modules.dashboard.dto.UserRecentTripResponse;
import com.awad.ticketbooking.modules.dashboard.service.UserDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard/user")
@RequiredArgsConstructor
@Tag(name = "User dashboard", description = "Endpoints powering the user’s personal dashboard.")
public class UserDashboardController {

    private final UserDashboardService userDashboardService;

    @GetMapping("/summary")
    @Operation(summary = "Get user dashboard summary", description = "Returns high-level metrics and stats for the authenticated user.")
    public ResponseEntity<UserDashboardSummaryResponse> getSummary(Authentication authentication) {
        return ResponseEntity.ok(userDashboardService.getUserDashboardSummary(authentication.getName()));
    }

    @GetMapping("/recent-trips")
    @Operation(summary = "Get recent trips", description = "Returns a list of the most recent trips taken by the authenticated user.")
    public ResponseEntity<List<UserRecentTripResponse>> getRecentTrips(Authentication authentication,
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(userDashboardService.getUserRecentTrips(authentication.getName(), limit));
    }
}
