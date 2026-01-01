package com.awad.ticketbooking.modules.trip.dto;

import com.awad.ticketbooking.common.enums.RecurrenceType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class RecurrenceDto {
    private RecurrenceType recurrenceType;
    private List<String> weeklyDays;
    private LocalDate startDate;
    private LocalDate endDate;
}
