package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

        private final RouteRepository routeRepository;
        private final com.awad.ticketbooking.modules.catalog.repository.StationRepository stationRepository;

        private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;
        private final com.awad.ticketbooking.modules.trip.repository.TripRepository tripRepository;

        @Transactional(readOnly = true)
        @Cacheable(value = "topRoutes")
        public List<com.awad.ticketbooking.modules.catalog.dto.RouteResponse> getTopRoutes() {
                // Fetch top 5 routes based on booking count
                List<Object[]> results = bookingRepository
                                .findTopRoutes(org.springframework.data.domain.PageRequest.of(0, 5));
                return results.stream()
                                .map(result -> {
                                        Route route = (Route) result[0];
                                        return mapToRouteResponse(route);
                                })
                                .collect(java.util.stream.Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<com.awad.ticketbooking.modules.catalog.dto.RouteResponse> getAllRoutes() {
                return routeRepository.findAll().stream()
                                .map(this::mapToRouteResponse)
                                .collect(java.util.stream.Collectors.toList());
        }

        private com.awad.ticketbooking.modules.catalog.dto.RouteResponse mapToRouteResponse(Route route) {
                return com.awad.ticketbooking.modules.catalog.dto.RouteResponse.builder()
                                .id(route.getId())
                                .originStation(com.awad.ticketbooking.modules.catalog.dto.RouteResponse.StationInfo
                                                .builder()
                                                .id(route.getOriginStation().getId())
                                                .name(route.getOriginStation().getName())
                                                .city(route.getOriginStation().getCity())
                                                .address(route.getOriginStation().getAddress())
                                                .build())
                                .destinationStation(com.awad.ticketbooking.modules.catalog.dto.RouteResponse.StationInfo
                                                .builder()
                                                .id(route.getDestinationStation().getId())
                                                .name(route.getDestinationStation().getName())
                                                .city(route.getDestinationStation().getCity())
                                                .address(route.getDestinationStation().getAddress())
                                                .build())
                                .durationMinutes(route.getDurationMinutes())
                                .distanceKm(route.getDistanceKm())
                                .isActive(route.getIsActive())
                                .build();
        }

        @Transactional
        public Route createRoute(com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
                com.awad.ticketbooking.modules.catalog.entity.Station origin = stationRepository
                                .findById(request.getOriginStationId())
                                .orElseThrow(() -> new RuntimeException("Origin station not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station destination = stationRepository
                                .findById(request.getDestinationStationId())
                                .orElseThrow(() -> new RuntimeException("Destination station not found"));

                Route route = new Route();
                route.setOriginStation(origin);
                route.setDestinationStation(destination);
                route.setDurationMinutes(request.getDurationMinutes());
                route.setDistanceKm(request.getDistanceKm());

                return routeRepository.save(route);
        }

        @Transactional
        public Route updateRoute(java.util.UUID id,
                        com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
                Route route = routeRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Route not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station origin = stationRepository
                                .findById(request.getOriginStationId())
                                .orElseThrow(() -> new RuntimeException("Origin station not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station destination = stationRepository
                                .findById(request.getDestinationStationId())
                                .orElseThrow(() -> new RuntimeException("Destination station not found"));

                route.setOriginStation(origin);
                route.setDestinationStation(destination);
                route.setDistanceKm(request.getDistanceKm());

                return routeRepository.save(route);
        }

        @Transactional
        public void deleteRoute(java.util.UUID id, boolean force) {
                if (!routeRepository.existsById(id)) {
                        throw new RuntimeException("Route not found");
                }
                if (force) {
                        List<com.awad.ticketbooking.modules.trip.entity.Trip> trips = tripRepository.findByRouteId(id);
                        for (com.awad.ticketbooking.modules.trip.entity.Trip trip : trips) {
                                bookingRepository.deleteByTripId(trip.getId());
                        }
                        tripRepository.deleteByRouteId(id);
                }
                routeRepository.deleteById(id);
        }
}
