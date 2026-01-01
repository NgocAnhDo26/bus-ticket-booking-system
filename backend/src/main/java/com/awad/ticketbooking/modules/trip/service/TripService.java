package com.awad.ticketbooking.modules.trip.service;

import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.repository.BusRepository;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import com.awad.ticketbooking.modules.trip.dto.CreateTripRequest;
import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.entity.TripPricing;
import com.awad.ticketbooking.modules.trip.repository.TripPricingRepository;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
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

    private final TripRepository tripRepository;
    private final TripPricingRepository tripPricingRepository;
    private final BusRepository busRepository;
    private final RouteRepository routeRepository;
    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;
    private final com.awad.ticketbooking.modules.booking.repository.TicketRepository ticketRepository;
    private final com.awad.ticketbooking.modules.catalog.repository.StationRepository stationRepository;

    @Transactional
    public TripResponse createTrip(CreateTripRequest request) {
        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RuntimeException("Bus not found"));

        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found"));

        // Check for conflicts
        boolean hasConflict = tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThan(
                bus.getId(), request.getArrivalTime(), request.getDepartureTime());

        if (hasConflict) {
            throw new RuntimeException("Bus is already assigned to another trip during this time");
        }

        Trip trip = new Trip();
        trip.setBus(bus);
        trip.setRoute(route);
        trip.setDepartureTime(request.getDepartureTime());
        trip.setArrivalTime(request.getArrivalTime());

        Trip savedTrip = tripRepository.save(trip);

        if (request.getPricings() != null) {
            List<TripPricing> pricings = request.getPricings().stream().map(p -> {
                TripPricing pricing = new TripPricing();
                pricing.setTrip(savedTrip);
                pricing.setSeatType(p.getSeatType());
                pricing.setPrice(p.getPrice());
                return pricing;
            }).collect(Collectors.toList());
            tripPricingRepository.saveAll(pricings);
            savedTrip.setTripPricings(pricings);
        }

        // Clone RouteStops to TripStops
        if (route.getStops() != null && !route.getStops().isEmpty()) {
            List<com.awad.ticketbooking.modules.trip.entity.TripStop> tripStops = route.getStops().stream().map(rs -> {
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
            com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest request) {
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        if (request.getStops() == null) {
            return mapToResponse(trip);
        }

        // Validate each stop - must have either stationId or customAddress
        for (com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest.TripStopDto stopDto : request.getStops()) {
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
                                                .build())
                                        .collect(Collectors.toList())
                                : trip.getRoute().getStops().stream()
                                        .map(stop -> TripResponse.RouteStopInfo.builder()
                                                .id(stop.getId())
                                                .station(TripResponse.StationInfo.builder()
                                                        .id(stop.getStation().getId())
                                                        .name(stop.getStation().getName())
                                                        .city(stop.getStation().getCity())
                                                        .build())
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
}
