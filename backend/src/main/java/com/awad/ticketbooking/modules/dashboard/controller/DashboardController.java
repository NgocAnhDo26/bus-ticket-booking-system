package com.awad.ticketbooking.modules.dashboard.controller;

import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.dashboard.dto.DashboardResponse;
import com.awad.ticketbooking.modules.dashboard.dto.DashboardResponse.ActivityItem;
import com.awad.ticketbooking.modules.dashboard.dto.DashboardResponse.RoleWidget;
import com.awad.ticketbooking.modules.dashboard.dto.DashboardResponse.RoleWidget.RoleItem;
import com.awad.ticketbooking.modules.dashboard.dto.DashboardResponse.SummaryMetric;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Demo endpoints for dashboard widgets and metrics.")
public class DashboardController {

        @GetMapping("/summary")
        @Operation(summary = "Get dashboard summary", description = "Returns sample summary metrics and activity items for the main dashboard.")
        public ApiResponse<DashboardResponse> summary() {
                List<SummaryMetric> summaryMetrics = List.of(
                                new SummaryMetric("Total Bookings", "1,248", "+12% vs last week", "up"),
                                new SummaryMetric("Seat Occupancy", "84%", "+4% vs avg", "up"),
                                new SummaryMetric("Revenue", "₫1.2B", "-3% vs last week", "down"));

                List<ActivityItem> activity = List.of(
                                new ActivityItem("1", "Booking confirmed", "10 min ago",
                                                "Passenger secured 2 seats SG → HN", "success", "1"),
                                new ActivityItem("2", "Seat map updated", "35 min ago",
                                                "Admin adjusted VIP prices for FUTA", "info", null),
                                new ActivityItem("3", "Payment pending", "1 hr ago",
                                                "Awaiting MoMo confirmation for #BK-9841", "warning", "2"));

                RoleWidget roleWidget = new RoleWidget(
                                "Upcoming operations",
                                List.of(
                                                new RoleItem("Trips today", "32", "5 delayed"),
                                                new RoleItem("Open seats", "210", "Across 7 operators"),
                                                new RoleItem("Refund requests", "8", "SLA: 2h avg")));

                return ApiResponse.success(new DashboardResponse(summaryMetrics, activity, roleWidget));
        }

        @GetMapping("/admin/stats")
        @PreAuthorize("hasRole('ADMIN')")
        @Operation(summary = "Get admin dashboard stats", description = "Returns sample statistics and actions for the admin dashboard (ADMIN only).")
        public ApiResponse<Map<String, Object>> adminStats() {
                return ApiResponse.success(Map.of(
                                "activeUsers", 1284,
                                "systemHealth", 99.8,
                                "failedTransactions", 3,
                                "adminActions", List.of(
                                                "View system logs and audit trails",
                                                "Manage user accounts and permissions",
                                                "Configure payment processors",
                                                "Review transactions and disputes")));
        }
}
