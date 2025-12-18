package com.awad.ticketbooking.modules.dashboard.dto;

import java.util.List;

public record DashboardResponse(
        List<SummaryMetric> summary,
        List<ActivityItem> activity,
        RoleWidget roleWidgets) {

    public record SummaryMetric(String label, String value, String trend, String trendDirection) {
    }

    public record ActivityItem(String id, String title, String timestamp, String description, String status,
            String tripId) {
    }

    public record RoleWidget(String title, List<RoleItem> items) {
        public record RoleItem(String label, String value, String helper) {
        }
    }
}
