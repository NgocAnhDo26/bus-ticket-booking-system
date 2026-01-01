package com.awad.ticketbooking.modules.trip.service;

import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.repository.BusRepository;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import com.awad.ticketbooking.modules.trip.dto.CreateTripRequest;
import com.awad.ticketbooking.modules.trip.dto.RecurrenceDto;
import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.dto.TripStopDto;
import com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.entity.TripPricing;
import com.awad.ticketbooking.modules.trip.entity.TripSchedule;
import com.awad.ticketbooking.modules.trip.repository.TripPricingRepository;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import com.awad.ticketbooking.modules.trip.repository.TripScheduleRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    // Maximum allowed days for recurrence to prevent server overload
    private static final int MAX_RECURRENCE_DAYS = 90;

    private final TripRepository tripRepository;
    private final TripPricingRepository tripPricingRepository;
    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final StationRepository stationRepository;
    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;
    private final com.awad.ticketbooking.modules.booking.repository.TicketRepository ticketRepository;
    private final TripScheduleRepository tripScheduleRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public TripResponse createTrip(CreateTripRequest request) {
        // Validate Bus & Route
        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + request.getRouteId()));
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + request.getBusId()));

        // Check conflicts
        boolean hasConflict = tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThan(
                bus.getId(), request.getArrivalTime(), request.getDepartureTime());

        if (hasConflict) {
            throw new RuntimeException(
                    "Bus " + bus.getPlateNumber() + " is already assigned to another trip during this time");
        }

        // Create Trip
        Trip trip = new Trip();
        trip.setRoute(route);
        trip.setBus(bus);
        trip.setDepartureTime(request.getDepartureTime());
        trip.setArrivalTime(request.getArrivalTime());
        trip.setStatus(com.awad.ticketbooking.common.enums.TripStatus.SCHEDULED);

        // Save Recurrence Schedule if Recurring
        if ("RECURRING".equals(request.getTripType()) && request.getRecurrence() != null) {
            RecurrenceDto rec = request.getRecurrence();
            // Validate Date Range
            validateRecurrenceDateRange(rec.getStartDate(), rec.getEndDate());

            TripSchedule schedule = new TripSchedule();
            schedule.setRoute(route);
            schedule.setBus(bus);
            // Default time from first trip
            schedule.setDepartureTime(request.getDepartureTime().atZone(ZoneId.systemDefault()).toLocalTime());
            schedule.setFrequency("DAILY"); // Placeholder or mapped
            schedule.setRecurrenceType(rec.getRecurrenceType());
            schedule.setWeeklyDays(rec.getWeeklyDays() != null ? String.join(",", rec.getWeeklyDays()) : null);
            schedule.setStartDate(rec.getStartDate());
            schedule.setEndDate(rec.getEndDate());

            // Save stops config as JSON
            if (request.getStops() != null && !request.getStops().isEmpty()) {
                try {
                    schedule.setPricingConfig(objectMapper.writeValueAsString(request.getStops()));
                } catch (JsonProcessingException e) {
                    throw new RuntimeException("Failed to serialize stops config", e);
                }
            }

            tripScheduleRepository.save(schedule);
            trip.setTripSchedule(schedule);
        }

        Trip savedTrip = tripRepository.save(trip);

        // Save Pricings
        if (request.getPricings() != null) {
            List<TripPricing> pricings = request.getPricings().stream().map(p -> {
                TripPricing pricing = new TripPricing();
                pricing.setTrip(savedTrip);
                pricing.setSeatType(p.getSeatType());
                pricing.setPrice(p.getPrice());
                return pricing;
            }).collect(Collectors.toList());
            tripPricingRepository.saveAll(pricings);
            savedTrip.setTripPricings(pricings); // Update managed entity
        }

        // Save Stops (Clone or Custom)
        if (request.getStops() != null && !request.getStops().isEmpty()) {
            List<com.awad.ticketbooking.modules.trip.entity.TripStop> tripStops = request.getStops().stream()
                    .map(dto -> {
                        com.awad.ticketbooking.modules.trip.entity.TripStop ts = new com.awad.ticketbooking.modules.trip.entity.TripStop();
                        ts.setTrip(savedTrip);

                        if (dto.getStationId() != null) {
                            ts.setStation(stationRepository.getReferenceById(dto.getStationId()));
                        } else {
                            ts.setCustomName(dto.getCustomName());
                            ts.setCustomAddress(dto.getCustomAddress());
                        }

                        ts.setStopOrder(dto.getStopOrder());
                        ts.setDurationMinutesFromOrigin(dto.getDurationMinutesFromOrigin());
                        ts.setStopType(dto.getStopType());
                        ts.setEstimatedArrivalTime(dto.getEstimatedArrivalTime());
                        ts.setNormalPrice(dto.getNormalPrice());
                        ts.setVipPrice(dto.getVipPrice());

                        return ts;
                    }).collect(Collectors.toList());
            savedTrip.getTripStops().addAll(tripStops);
            tripRepository.save(savedTrip); // Update trip with stops
        } else {
            // Clone from Route Default
            if (route.getStops() != null && !route.getStops().isEmpty()) {
                List<com.awad.ticketbooking.modules.trip.entity.TripStop> tripStops = route.getStops().stream()
                        .map(rs -> {
                            com.awad.ticketbooking.modules.trip.entity.TripStop ts = new com.awad.ticketbooking.modules.trip.entity.TripStop();
                            ts.setTrip(savedTrip);
                            ts.setStation(rs.getStation());
                            ts.setStopOrder(rs.getStopOrder());
                            ts.setDurationMinutesFromOrigin(rs.getDurationMinutesFromOrigin());
                            ts.setStopType(rs.getStopType());
                            return ts;
                        }).collect(Collectors.toList());
                savedTrip.getTripStops().addAll(tripStops);
                tripRepository.save(savedTrip);
            }
        }

        return mapToResponse(savedTrip);
    }

    @Transactional
    public TripResponse updateTrip(java.util.UUID id, CreateTripRequest request) {
        try {
            Trip trip = tripRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Trip not found with id: " + id));

            // Check if trip has any bookings
            if (bookingRepository.existsByTripId(id)) {
                throw new RuntimeException("Cannot update trip that has existing bookings. Trip ID: " + id);
            }

            Bus bus = busRepository.findById(request.getBusId())
                    .orElseThrow(() -> new RuntimeException("Bus not found with id: " + request.getBusId()));

            Route route = routeRepository.findById(request.getRouteId())
                    .orElseThrow(() -> new RuntimeException("Route not found with id: " + request.getRouteId()));

            // Check for conflicts (excluding current trip)
            boolean hasConflict = tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThanAndIdNot(
                    bus.getId(), request.getArrivalTime(), request.getDepartureTime(), id);

            if (hasConflict) {
                throw new RuntimeException(
                        "Bus " + bus.getPlateNumber() + " is already assigned to another trip during this time");
            }

            trip.setBus(bus);
            trip.setRoute(route);
            trip.setDepartureTime(request.getDepartureTime());
            trip.setArrivalTime(request.getArrivalTime());

            // Update pricings - explicitly delete old ones first and flush to DB
            // to avoid unique constraint violation on (trip_id, seat_type)
            tripPricingRepository.deleteAllByTripId(id);
            tripPricingRepository.flush();
            trip.getTripPricings().clear();

            if (request.getPricings() != null) {
                List<TripPricing> pricings = request.getPricings().stream().map(p -> {
                    TripPricing pricing = new TripPricing();
                    pricing.setTrip(trip);
                    pricing.setSeatType(p.getSeatType());
                    pricing.setPrice(p.getPrice());
                    return pricing;
                }).collect(Collectors.toList());
                trip.getTripPricings().addAll(pricings);
            }

            return mapToResponse(tripRepository.save(trip));
        } catch (RuntimeException e) {
            throw e; // Re-throw RuntimeException as-is
        } catch (Exception e) {
            throw new RuntimeException("Failed to update trip: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void deleteTrip(java.util.UUID id, boolean force) {
        if (!tripRepository.existsById(id)) {
            throw new RuntimeException("Trip not found");
        }
        if (force) {
            bookingRepository.deleteByTripId(id);
        }
        tripRepository.deleteById(id);
    }

    @Transactional
    public TripResponse updateTripStops(java.util.UUID tripId,
            UpdateTripStopsRequest request) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (request.getStops() == null) {
            return mapToResponse(trip);
        }

        // Validate each stop - must have either stationId or customAddress
        for (TripStopDto stopDto : request.getStops()) {
            if (!stopDto.isValid()) {
                throw new RuntimeException("Each stop must have either a stationId or a customAddress");
            }
            // Validate station if provided
            if (stopDto.getStationId() != null && !stationRepository.existsById(stopDto.getStationId())) {
                throw new RuntimeException("Station not found with id: " + stopDto.getStationId());
            }
        }

        // Clear existing stops
        trip.getTripStops().clear();

        // Add new stops
        List<com.awad.ticketbooking.modules.trip.entity.TripStop> newStops = request.getStops().stream().map(dto -> {
            com.awad.ticketbooking.modules.trip.entity.TripStop ts = new com.awad.ticketbooking.modules.trip.entity.TripStop();
            ts.setTrip(trip);

            if (dto.getStationId() != null) {
                // Station-linked stop
                ts.setStation(stationRepository.getReferenceById(dto.getStationId()));
            } else {
                // Custom address stop
                ts.setCustomName(dto.getCustomName());
                ts.setCustomAddress(dto.getCustomAddress());
            }

            ts.setStopOrder(dto.getStopOrder());
            ts.setDurationMinutesFromOrigin(dto.getDurationMinutesFromOrigin());
            ts.setStopType(dto.getStopType());

            // Set new fields for per-stop configuration
            ts.setEstimatedArrivalTime(dto.getEstimatedArrivalTime());
            ts.setNormalPrice(dto.getNormalPrice());
            ts.setVipPrice(dto.getVipPrice());

            return ts;
        }).collect(Collectors.toList());

        trip.getTripStops().addAll(newStops);

        return mapToResponse(tripRepository.save(trip));
    }

    @Transactional(readOnly = true)
    public Page<TripResponse> searchTrips(SearchTripRequest request) {
        Specification<Trip> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Basic Search: Origin & Destination
            if (request.getOrigin() != null && !request.getOrigin().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("route").get("originStation").get("city")),
                        "%" + request.getOrigin().toLowerCase() + "%"));
            }
            if (request.getDestination() != null && !request.getDestination().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("route").get("destinationStation").get("city")),
                        "%" + request.getDestination().toLowerCase() + "%"));
            }

            // 2. Date Filter
            if (request.getDate() != null) {
                Instant startOfDay = request.getDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
                Instant endOfDay = request.getDate().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
                predicates.add(cb.between(root.get("departureTime"), startOfDay, endOfDay));
            }

            // 3. Time Filter (Min/Max Time) - This is complex with Instant, assuming simple

            if (request.getDate() != null) {
                if (request.getMinTime() != null) {
                    Instant minInst = request.getDate().atTime(request.getMinTime()).atZone(ZoneId.systemDefault())
                            .toInstant();
                    predicates.add(cb.greaterThanOrEqualTo(root.get("departureTime"), minInst));
                }
                if (request.getMaxTime() != null) {
                    Instant maxInst = request.getDate().atTime(request.getMaxTime()).atZone(ZoneId.systemDefault())
                            .toInstant();
                    predicates.add(cb.lessThanOrEqualTo(root.get("departureTime"), maxInst));
                }
            }

            // 4. Price Filter - Simplified for now (requires join)
            if (request.getMinPrice() != null || request.getMaxPrice() != null) {
                Join<Trip, TripPricing> pricingJoin = root.join("tripPricings");
                if (request.getMinPrice() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(pricingJoin.get("price"), request.getMinPrice()));
                }
                if (request.getMaxPrice() != null) {
                    predicates.add(cb.lessThanOrEqualTo(pricingJoin.get("price"), request.getMaxPrice()));
                }
            }

            // 5. Amenities Filter
            if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {

                for (String amenity : request.getAmenities()) {

                    predicates.add(cb.like(root.get("bus").get("amenities"), "%" + amenity + "%"));
                }
            }

            // 6. Operator Filter
            if (request.getOperatorIds() != null && !request.getOperatorIds().isEmpty()) {
                predicates.add(root.get("bus").get("operator").get("id").in(request.getOperatorIds()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Sorting
        Sort sort = Sort.unsorted();
        if (request.getSortBy() != null) {
            String[] parts = request.getSortBy().split(",");
            if (parts.length == 2) {
                sort = Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
            } else {
                sort = Sort.by(parts[0]);
            }
        }

        Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), sort);
        Page<Trip> trips = tripRepository.findAll(spec, pageable);

        return trips.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<TripResponse> getAllTrips(Pageable pageable) {
        return tripRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    private TripResponse mapToResponse(Trip trip) {
        return TripResponse.builder()
                .id(trip.getId())
                .route(TripResponse.RouteInfo.builder()
                        .id(trip.getRoute().getId())
                        .originStation(TripResponse.StationInfo.builder()
                                .id(trip.getRoute().getOriginStation().getId())
                                .name(trip.getRoute().getOriginStation().getName())
                                .city(trip.getRoute().getOriginStation().getCity())
                                .build())
                        .destinationStation(TripResponse.StationInfo.builder()
                                .id(trip.getRoute().getDestinationStation().getId())
                                .name(trip.getRoute().getDestinationStation().getName())
                                .city(trip.getRoute().getDestinationStation().getCity())
                                .build())
                        .durationMinutes(trip.getRoute().getDurationMinutes())
                        .stops(trip.getTripStops() != null && !trip.getTripStops().isEmpty()
                                ? trip.getTripStops().stream()
                                        .map(stop -> TripResponse.RouteStopInfo.builder()
                                                .id(stop.getId())
                                                .station(stop.getStation() != null
                                                        ? TripResponse.StationInfo.builder()
                                                                .id(stop.getStation().getId())
                                                                .name(stop.getStation().getName())
                                                                .city(stop.getStation().getCity())
                                                                .build()
                                                        : null)
                                                .customName(stop.getCustomName())
                                                .customAddress(stop.getCustomAddress())
                                                .stopOrder(stop.getStopOrder())
                                                .durationMinutesFromOrigin(stop.getDurationMinutesFromOrigin())
                                                .stopType(stop.getStopType().name())
                                                .estimatedArrivalTime(stop.getEstimatedArrivalTime())
                                                .normalPrice(stop.getNormalPrice())
                                                .vipPrice(stop.getVipPrice())
                                                .build())
                                        .collect(Collectors.toList())
                                : trip.getRoute().getStops().stream()
                                        .map(stop -> TripResponse.RouteStopInfo.builder()
                                                .id(stop.getId())
                                                .station(stop.getStation() != null
                                                        ? TripResponse.StationInfo.builder()
                                                                .id(stop.getStation().getId())
                                                                .name(stop.getStation().getName())
                                                                .city(stop.getStation().getCity())
                                                                .build()
                                                        : null)
                                                .customName(stop.getCustomName())
                                                .customAddress(stop.getCustomAddress())
                                                .stopOrder(stop.getStopOrder())
                                                .durationMinutesFromOrigin(stop.getDurationMinutesFromOrigin())
                                                .stopType(stop.getStopType().name())
                                                .build())
                                        .collect(Collectors.toList()))
                        .build())
                .bus(TripResponse.BusInfo.builder()
                        .id(trip.getBus().getId())
                        .plateNumber(trip.getBus().getPlateNumber())
                        .operator(TripResponse.OperatorInfo.builder()
                                .id(trip.getBus().getOperator().getId())
                                .name(trip.getBus().getOperator().getName())
                                .build())
                        .totalSeats(trip.getBus().getBusLayout().getTotalSeats())
                        .busLayoutId(trip.getBus().getBusLayout().getId())
                        .amenities(trip.getBus().getAmenities())
                        .build())
                .departureTime(trip.getDepartureTime())
                .arrivalTime(trip.getArrivalTime())
                .status(trip.getStatus())
                .tripPricings(trip.getTripPricings().stream()
                        .map(pricing -> TripResponse.TripPricingInfo.builder()
                                .id(pricing.getId())
                                .seatType(pricing.getSeatType())
                                .price(pricing.getPrice())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public TripResponse getTripById(java.util.UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found")); // Should use custom exception
        return mapToResponse(trip);
    }

    @Transactional(readOnly = true)
    public List<com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse> getTripPassengers(
            java.util.UUID tripId) {
        List<com.awad.ticketbooking.modules.booking.entity.Ticket> tickets = ticketRepository
                .findAllByBookingTripId(tripId);

        return tickets.stream().map(ticket -> com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse.builder()
                .ticketId(ticket.getId())
                .bookingCode(ticket.getBooking().getCode())
                .passengerName(ticket.getPassengerName())
                .passengerPhone(ticket.getPassengerPhone())
                .seatCode(ticket.getSeatCode())
                .isBoarded(ticket.isBoarded())
                .bookingStatus(ticket.getBooking().getStatus())
                .pickupStation(ticket.getBooking().getPickupStation() != null
                        ? ticket.getBooking().getPickupStation().getName()
                        : "")
                .dropoffStation(ticket.getBooking().getDropoffStation() != null
                        ? ticket.getBooking().getDropoffStation().getName()
                        : "")
                .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public TripResponse updateTripStatus(java.util.UUID tripId, com.awad.ticketbooking.common.enums.TripStatus status) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        trip.setStatus(status);
        return mapToResponse(tripRepository.save(trip));
    }

    /**
     * Checks if a trip's recurrence can be updated.
     * Returns future booking count - if > 0, recurrence changes should be blocked.
     */
    @Transactional(readOnly = true)
    public long countFutureBookingsForTrip(java.util.UUID tripId) {
        return bookingRepository.countFutureBookingsByTripId(tripId, java.time.Instant.now());
    }

    /**
     * DTO for recurrence update eligibility response
     */
    public record RecurrenceUpdateCheck(boolean canUpdate, long futureBookingsCount) {
    }

    /**
     * Check if recurrence can be updated for a trip
     */
    @Transactional(readOnly = true)
    public RecurrenceUpdateCheck checkCanUpdateRecurrence(java.util.UUID tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new RuntimeException("Trip not found with id: " + tripId);
        }
        long count = bookingRepository.countFutureBookingsByTripId(tripId, java.time.Instant.now());
        return new RecurrenceUpdateCheck(count == 0, count);
    }

    /**
     * Validates recurrence date range to prevent server overload.
     * Throws exception if date range exceeds MAX_RECURRENCE_DAYS.
     * 
     * @param startDate Start date of recurrence
     * @param endDate   End date of recurrence
     * @return Number of days in the range
     */
    public int validateRecurrenceDateRange(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return 0;
        }

        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate);

        if (daysBetween > MAX_RECURRENCE_DAYS) {
            throw new IllegalArgumentException(
                    "Khoảng thời gian lặp lại tối đa là " + MAX_RECURRENCE_DAYS + " ngày. " +
                            "Bạn đã chọn " + daysBetween + " ngày.");
        }

        if (startDate.isBefore(java.time.LocalDate.now())) {
            throw new IllegalArgumentException("Ngày bắt đầu không được trong quá khứ");
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }

        return (int) daysBetween;
    }
}
