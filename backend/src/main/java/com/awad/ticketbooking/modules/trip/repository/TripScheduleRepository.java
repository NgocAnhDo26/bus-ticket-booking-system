package com.awad.ticketbooking.modules.trip.repository;

import com.awad.ticketbooking.common.enums.RecurrenceType;
import com.awad.ticketbooking.modules.trip.entity.TripSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TripScheduleRepository extends JpaRepository<TripSchedule, UUID> {

    /**
     * Find all active schedules that should generate trips for a given date.
     * A schedule is applicable if:
     * - isActive = true
     * - recurrenceType is not NONE
     * - startDate <= targetDate
     * - endDate is null OR endDate >= targetDate
     */
    @Query("SELECT ts FROM TripSchedule ts WHERE ts.isActive = true " +
            "AND ts.recurrenceType != :noneType " +
            "AND ts.startDate <= :targetDate " +
            "AND (ts.endDate IS NULL OR ts.endDate >= :targetDate)")
    List<TripSchedule> findActiveSchedulesForDate(
            @Param("noneType") RecurrenceType noneType,
            @Param("targetDate") LocalDate targetDate);

    /**
     * Find all active recurring schedules
     */
    List<TripSchedule> findByIsActiveTrueAndRecurrenceTypeNot(RecurrenceType recurrenceType);
}
