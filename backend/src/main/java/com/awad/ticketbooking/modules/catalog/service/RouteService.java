package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.AddRouteStopRequest;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.RouteStop;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import com.awad.ticketbooking.modules.catalog.repository.RouteStopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

        private final RouteRepository routeRepository;
        private final RouteStopRepository routeStopRepository;
        private final com.awad.ticketbooking.modules.catalog.repository.StationRepository stationRepository;

        private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;
        private final com.awad.ticketbooking.modules.trip.repository.TripRepository tripRepository;
        private final jakarta.persistence.EntityManager entityManager;

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
        public org.springframework.data.domain.Page<com.awad.ticketbooking.modules.catalog.dto.RouteResponse> getAllRoutes(
                        org.springframework.data.domain.Pageable pageable) {
                return routeRepository.findAll(pageable)
                                .map(this::mapToRouteResponse);
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
                                .stops(route.getStops() != null ? route.getStops().stream()
                                                .map(stop -> com.awad.ticketbooking.modules.catalog.dto.RouteResponse.StopInfo
                                                                .builder()
                                                                .id(stop.getId())
                                                                .station(com.awad.ticketbooking.modules.catalog.dto.RouteResponse.StationInfo
                                                                                .builder()
                                                                                .id(stop.getStation().getId())
                                                                                .name(stop.getStation().getName())
                                                                                .city(stop.getStation().getCity())
                                                                                .build())
                                                                .stopOrder(stop.getStopOrder())
                                                                .durationMinutesFromOrigin(
                                                                                stop.getDurationMinutesFromOrigin())
                                                                .stopType(stop.getStopType().name())
                                                                .build())
                                                .collect(java.util.stream.Collectors.toList())
                                                : java.util.Collections.emptyList())
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

        @Transactional
        public com.awad.ticketbooking.modules.catalog.dto.RouteResponse addRouteStop(java.util.UUID routeId,
                        AddRouteStopRequest request) {
                Route route = routeRepository.findById(routeId)
                                .orElseThrow(() -> new RuntimeException("Route not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station station = stationRepository
                                .findById(request.getStationId())
                                .orElseThrow(() -> new RuntimeException("Station not found"));

                RouteStop stop = new RouteStop();
                stop.setRoute(route);
                stop.setStation(station);
                stop.setStopOrder(request.getStopOrder());
                stop.setDurationMinutesFromOrigin(request.getDurationMinutesFromOrigin());
                stop.setStopType(request.getStopType());

                routeStopRepository.save(stop);

                // Refresh route to get new stops
                entityManager.refresh(route); // Need EntityManager or just return updated DTO.
                // Since List is cached in object, save might not update it immediately without
                // refresh if logical mapping.
                // Re-fetching is safer.
                Route updatedRoute = routeRepository.findById(routeId).orElseThrow();
                return mapToRouteResponse(updatedRoute);
        }

        @Transactional
        public void deleteRouteStop(java.util.UUID routeId, java.util.UUID stopId) {
                RouteStop stop = routeStopRepository.findById(stopId)
                                .orElseThrow(() -> new RuntimeException("Stop not found"));

                if (!stop.getRoute().getId().equals(routeId)) {
                        throw new RuntimeException("Stop does not belong to this route");
                }

                routeStopRepository.delete(stop);
        }
}
