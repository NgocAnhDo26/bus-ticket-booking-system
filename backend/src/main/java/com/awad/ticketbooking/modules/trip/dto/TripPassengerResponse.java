package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class TripPassengerResponse {
    private UUID ticketId;
    private String bookingCode;
    private String passengerName;
    private String passengerPhone;
    private String seatCode;
    private boolean isBoarded;
    private BookingStatus bookingStatus;
    private String pickupStation;
    private String dropoffStation;
}
