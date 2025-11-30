package com.awad.ticketbooking.modules.trip.service;

import com.awad.ticketbooking.common.enums.SeatType;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripPricingRepository tripPricingRepository;

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

            // 4. Price Filter
            if (request.getMinPrice() != null || request.getMaxPrice() != null) {
                Join<Trip, TripPricing> pricingJoin = root.join("tripPricings"); // Need to map this in Entity or use
             
            }

            // 5. Amenities Filter
            if (request.getAmenities() != null && !request.getAmenities().isEmpty()) {
               
                for (String amenity : request.getAmenities()) {
                  
                    predicates.add(cb.like(root.get("bus").get("amenities"), "%" + amenity + "%"));
                }
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

    private TripResponse mapToResponse(Trip trip) {
        TripResponse response = new TripResponse();
        response.setId(trip.getId());
        response.setOrigin(trip.getRoute().getOriginStation().getCity());
        response.setDestination(trip.getRoute().getDestinationStation().getCity());
        response.setDepartureTime(trip.getDepartureTime());
        response.setArrivalTime(trip.getArrivalTime());
        response.setOperatorName(trip.getBus().getOperator().getName());
        response.setBusPlateNumber(trip.getBus().getPlateNumber());
        response.setBusAmenities(trip.getBus().getAmenities());
        response.setDurationMinutes(trip.getRoute().getDurationMinutes());


        return response;
    }

    @Transactional(readOnly = true)
    public TripResponse getTripById(java.util.UUID id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Trip not found")); // Should use custom exception
        return mapToResponse(trip);
    }
}
