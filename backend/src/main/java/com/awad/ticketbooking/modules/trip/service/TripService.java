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

        return mapToResponse(savedTrip);
    }

    @Transactional
    public TripResponse updateTrip(java.util.UUID id, CreateTripRequest request) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        // Check if trip has any bookings
        if (bookingRepository.existsByTripId(id)) {
            throw new RuntimeException("Cannot update trip that has existing bookings");
        }

        Bus bus = busRepository.findById(request.getBusId())
                .orElseThrow(() -> new RuntimeException("Bus not found"));

        Route route = routeRepository.findById(request.getRouteId())
                .orElseThrow(() -> new RuntimeException("Route not found"));

        // Check for conflicts (excluding current trip)
        boolean hasConflict = tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThanAndIdNot(
                bus.getId(), request.getArrivalTime(), request.getDepartureTime(), id);

        if (hasConflict) {
            throw new RuntimeException("Bus is already assigned to another trip during this time");
        }

        trip.setBus(bus);
        trip.setRoute(route);
        trip.setDepartureTime(request.getDepartureTime());
        trip.setArrivalTime(request.getArrivalTime());

        // Update pricings
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
}
