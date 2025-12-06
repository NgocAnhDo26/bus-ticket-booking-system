package com.awad.ticketbooking.modules.catalog.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

public class BusLayoutPayload {

    @Data
    public static class BusLayoutRequest {
        private String name;
        private String busType;
        private Integer totalFloors;
        private String description;
    }

    @Data
    public static class SeatUpdatePayload {
        private List<LayoutSeatDto> seats;
    }

    @Data
    public static class LayoutSeatDto {
        private String seatCode;
        private String type; // VIP, NORMAL
        private Integer floor;
        private Integer row;
        private Integer col;
    }

    @Data
    public static class BusLayoutResponse {
        private UUID id;
        private String name;
        private String busType;
        private Integer totalSeats;
        private Integer totalFloors;
        private String description;
        private List<LayoutSeatDto> seats;
    }
}
