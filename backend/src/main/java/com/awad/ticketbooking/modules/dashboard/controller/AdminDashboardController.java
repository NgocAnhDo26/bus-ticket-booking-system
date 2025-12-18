package com.awad.ticketbooking.modules.dashboard.controller;

import com.awad.ticketbooking.modules.dashboard.dto.*;
import com.awad.ticketbooking.modules.dashboard.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
        name = "Admin dashboard",
        description = "Admin analytics endpoints for revenue and booking performance metrics."
)
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/metrics")
    @Operation(
            summary = "Get admin dashboard KPI metrics",
            description = "Returns high-level KPIs for today (revenue, tickets sold, active operators, new users)."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Metrics retrieved successfully",
                    content = @Content(schema = @Schema(implementation = MetricsResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<MetricsResponse> getMetrics() {
        return ResponseEntity.ok(adminDashboardService.getMetrics());
    }

    @GetMapping("/revenue")
    @Operation(
            summary = "Get revenue chart series",
            description = "Returns a time series of revenue grouped by day over the provided [from,to] range. Defaults to the last 7 days when omitted."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Revenue chart series retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = RevenueChartResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid date range or parameters",
                    content = @Content(schema = @Schema(implementation = String.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<List<RevenueChartResponse>> getRevenueChart(
            @Parameter(
                    description = "Start of the time range (inclusive). ISO-8601 date-time, e.g. 2025-01-01T00:00:00Z.",
                    example = "2025-01-01T00:00:00Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant from,
            @Parameter(
                    description = "End of the time range (inclusive). ISO-8601 date-time, e.g. 2025-01-07T23:59:59Z.",
                    example = "2025-01-07T23:59:59Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
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
    @Operation(
            summary = "Get top routes",
            description = "Returns the top routes by tickets sold (CONFIRMED bookings), ordered descending."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Top routes retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TopRouteResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid parameters",
                    content = @Content(schema = @Schema(implementation = String.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<List<TopRouteResponse>> getTopRoutes(
            @Parameter(
                    description = "Start of the time range (inclusive). When omitted, returns all-time top routes.",
                    example = "2025-01-01T00:00:00Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant from,
            @Parameter(
                    description = "End of the time range (inclusive). When omitted, returns all-time top routes.",
                    example = "2025-01-31T23:59:59Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant to,
            @Parameter(description = "Max number of routes to return.", example = "5", schema = @Schema(type = "integer", minimum = "1", maximum = "100"))
            @RequestParam(defaultValue = "5") int limit) {
        if (from != null || to != null) {
            if (from == null) {
                from = Instant.now().minusSeconds(30L * 24 * 60 * 60);
            }
            if (to == null) {
                to = Instant.now();
            }
        }
        return ResponseEntity.ok(adminDashboardService.getTopRoutes(from, to, limit));
    }

    @GetMapping("/recent-transactions")
    @Operation(
            summary = "Get recent transactions",
            description = "Returns the most recent bookings (latest createdAt first)."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Recent transactions retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TransactionResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid parameters",
                    content = @Content(schema = @Schema(implementation = String.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<List<TransactionResponse>> getRecentTransactions(
            @Parameter(description = "Max number of transactions to return.", example = "10", schema = @Schema(type = "integer", minimum = "1", maximum = "200"))
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminDashboardService.getRecentTransactions(limit));
    }

    @GetMapping("/top-operators")
    @Operation(
            summary = "Get top operators",
            description = "Returns the top operators by tickets sold (CONFIRMED bookings), including total revenue."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Top operators retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = TopOperatorResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid parameters",
                    content = @Content(schema = @Schema(implementation = String.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<List<TopOperatorResponse>> getTopOperators(
            @Parameter(
                    description = "Start of the time range (inclusive). When omitted, returns all-time top operators.",
                    example = "2025-01-01T00:00:00Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant from,
            @Parameter(
                    description = "End of the time range (inclusive). When omitted, returns all-time top operators.",
                    example = "2025-01-31T23:59:59Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant to,
            @Parameter(description = "Max number of operators to return.", example = "5", schema = @Schema(type = "integer", minimum = "1", maximum = "100"))
            @RequestParam(defaultValue = "5") int limit) {
        if (from != null || to != null) {
            if (from == null) {
                from = Instant.now().minusSeconds(30L * 24 * 60 * 60);
            }
            if (to == null) {
                to = Instant.now();
            }
        }
        return ResponseEntity.ok(adminDashboardService.getTopOperators(from, to, limit));
    }

    @GetMapping("/booking-trends")
    @Operation(
            summary = "Get booking trends",
            description = "Returns booking volume trends (total bookings and confirmed bookings) grouped by day or week over the provided [from,to] range. Defaults to the last 30 days when omitted."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Booking trends retrieved successfully",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = BookingTrendResponse.class)))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid date range or parameters",
                    content = @Content(schema = @Schema(implementation = String.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<List<BookingTrendResponse>> getBookingTrends(
            @Parameter(
                    description = "Start of the time range (inclusive). ISO-8601 date-time.",
                    example = "2025-01-01T00:00:00Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant from,
            @Parameter(
                    description = "End of the time range (inclusive). ISO-8601 date-time.",
                    example = "2025-01-31T23:59:59Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant to,
            @Parameter(
                    description = "Time bucket grouping.",
                    schema = @Schema(type = "string", allowableValues = {"day", "week"}),
                    example = "day"
            )
            @RequestParam(defaultValue = "day") String groupBy) {
        if (from == null) {
            from = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        }
        if (to == null) {
            to = Instant.now();
        }
        return ResponseEntity.ok(adminDashboardService.getBookingTrends(from, to, groupBy));
    }

    @GetMapping("/booking-conversion")
    @Operation(
            summary = "Get booking conversion rate",
            description = "Returns conversion metrics for bookings created in the given [from,to] range. Conversion rate is defined as CONFIRMED / total bookings created in range. Defaults to the last 30 days when omitted."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Booking conversion retrieved successfully",
                    content = @Content(schema = @Schema(implementation = BookingConversionResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Invalid date range or parameters",
                    content = @Content(schema = @Schema(implementation = String.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "Unexpected error",
                    content = @Content(schema = @Schema(implementation = String.class))
            )
    })
    public ResponseEntity<BookingConversionResponse> getBookingConversion(
            @Parameter(
                    description = "Start of the time range (inclusive). ISO-8601 date-time.",
                    example = "2025-01-01T00:00:00Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant from,
            @Parameter(
                    description = "End of the time range (inclusive). ISO-8601 date-time.",
                    example = "2025-01-31T23:59:59Z",
                    schema = @Schema(type = "string", format = "date-time")
            )
            @RequestParam(required = false) Instant to) {
        if (from == null) {
            from = Instant.now().minusSeconds(30L * 24 * 60 * 60);
        }
        if (to == null) {
            to = Instant.now();
        }
        return ResponseEntity.ok(adminDashboardService.getBookingConversion(from, to));
    }
}
