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
@lombok.extern.slf4j.Slf4j
public class RouteService {

        private final RouteRepository routeRepository;
        private final RouteStopRepository routeStopRepository;
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
        public org.springframework.data.domain.Page<com.awad.ticketbooking.modules.catalog.dto.RouteResponse> getAllRoutes(
                        org.springframework.data.domain.Pageable pageable) {
                return routeRepository.findAll(pageable)
                                .map(this::mapToRouteResponse);
        }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<com.awad.ticketbooking.modules.catalog.dto.RouteResponse> searchRoutes(
                        String query, org.springframework.data.domain.Pageable pageable) {
                // Use LIKE search (fulltext is handled at DB level via the query)
                return routeRepository.search(query, pageable)
                                .map(this::mapToRouteResponse);
        }

        /**
         * Search routes using fulltext search.
         * Only use this after V26 migration has been applied.
         */
        @Transactional(readOnly = true)
        public org.springframework.data.domain.Page<com.awad.ticketbooking.modules.catalog.dto.RouteResponse> searchRoutesFulltext(
                        String query, org.springframework.data.domain.Pageable pageable) {
                return routeRepository.searchFulltext(query, pageable)
                                .map(this::mapToRouteResponse);
        }

        @Transactional
        public com.awad.ticketbooking.modules.catalog.dto.RouteResponse createRoute(
                        com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
                log.info("Creating route from {} to {}", request.getOriginStationId(),
                                request.getDestinationStationId());
                com.awad.ticketbooking.modules.catalog.entity.Station origin = stationRepository
                                .findById(request.getOriginStationId())
                                .orElseThrow(() -> new RuntimeException("Origin station not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station destination = stationRepository
                                .findById(request.getDestinationStationId())
                                .orElseThrow(() -> new RuntimeException("Destination station not found"));

                Route route = new Route();
                route.setName(request.getName());
                route.setOriginStation(origin);
                route.setDestinationStation(destination);
                route.setDurationMinutes(request.getDurationMinutes());
                route.setDistanceKm(request.getDistanceKm());

                Route savedRoute = routeRepository.save(route);

                // Handle unified stops creation
                if (request.getStops() != null && !request.getStops().isEmpty()) {
                        log.info("Processing {} initial stops for route {}", request.getStops().size(),
                                        savedRoute.getId());
                        for (AddRouteStopRequest stopRequest : request.getStops()) {
                                addRouteStop(savedRoute.getId(), stopRequest);
                        }
                        // Reload route to get stops included in the response
                        savedRoute = routeRepository.findById(savedRoute.getId()).orElse(savedRoute);
                }

                return mapToRouteResponse(savedRoute);
        }

        @Transactional
        public com.awad.ticketbooking.modules.catalog.dto.RouteResponse updateRoute(java.util.UUID id,
                        com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
                log.info("Updating route {}: {}", id, request);
                Route route = routeRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Route not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station origin = stationRepository
                                .findById(request.getOriginStationId())
                                .orElseThrow(() -> new RuntimeException("Origin station not found"));

                com.awad.ticketbooking.modules.catalog.entity.Station destination = stationRepository
                                .findById(request.getDestinationStationId())
                                .orElseThrow(() -> new RuntimeException("Destination station not found"));

                route.setName(request.getName());
                route.setOriginStation(origin);
                route.setDestinationStation(destination);
                route.setDistanceKm(request.getDistanceKm());
                route.setDurationMinutes(request.getDurationMinutes());

                Route savedRoute = routeRepository.save(route);
                return mapToRouteResponse(savedRoute);
        }

        @Transactional
        public void deleteRoute(java.util.UUID id, boolean force) {
                log.info("Deleting route {}, force={}", id, force);
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

        private com.awad.ticketbooking.modules.catalog.dto.RouteResponse mapToRouteResponse(Route route) {
                return com.awad.ticketbooking.modules.catalog.dto.RouteResponse.builder()
                                .id(route.getId())
                                .name(route.getName())
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
                                                .sorted(java.util.Comparator.comparingInt(RouteStop::getStopOrder))
                                                .map(stop -> com.awad.ticketbooking.modules.catalog.dto.RouteResponse.StopInfo
                                                                .builder()
                                                                .id(stop.getId())
                                                                .station(stop.getStation() != null
                                                                                ? com.awad.ticketbooking.modules.catalog.dto.RouteResponse.StationInfo
                                                                                                .builder()
                                                                                                .id(stop.getStation()
                                                                                                                .getId())
                                                                                                .name(stop.getStation()
                                                                                                                .getName())
                                                                                                .city(stop.getStation()
                                                                                                                .getCity())
                                                                                                .build()
                                                                                : null)
                                                                .stopOrder(stop.getStopOrder())
                                                                .durationMinutesFromOrigin(
                                                                                stop.getDurationMinutesFromOrigin())
                                                                .stopType(stop.getStopType().name())
                                                                .customName(stop.getCustomName())
                                                                .customAddress(stop.getCustomAddress())
                                                                .build())
                                                .collect(java.util.stream.Collectors.toList())
                                                : java.util.Collections.emptyList())
                                .build();
        }

        @Transactional(readOnly = true)
        public com.awad.ticketbooking.modules.catalog.dto.RouteResponse getRouteById(java.util.UUID id) {
                log.info("Fetching route by ID: {}", id);
                Route route = routeRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Route not found"));
                log.info("Found route: {}. Stops count: {}", route.getId(), route.getStops().size());
                return mapToRouteResponse(route);
        }

        @Transactional
        public com.awad.ticketbooking.modules.catalog.dto.RouteResponse addRouteStop(java.util.UUID routeId,
                        AddRouteStopRequest request) {
                log.info("Adding stop to route {}: {}", routeId, request);
                Route route = routeRepository.findById(routeId)
                                .orElseThrow(() -> new RuntimeException("Route not found"));

                RouteStop stop = new RouteStop();
                stop.setRoute(route);

                if (request.getStationId() != null) {
                        com.awad.ticketbooking.modules.catalog.entity.Station station = stationRepository
                                        .findById(request.getStationId())
                                        .orElseThrow(() -> new RuntimeException("Station not found"));
                        stop.setStation(station);
                } else if (request.getCustomName() != null && !request.getCustomName().isEmpty()) {
                        stop.setCustomName(request.getCustomName());
                        stop.setCustomAddress(request.getCustomAddress());
                } else {
                        throw new RuntimeException("Either Station ID or Custom Name is required");
                }

                // Validation: Time must be positive
                if (request.getDurationMinutesFromOrigin() <= 0) {
                        throw new RuntimeException("Thời gian đến trạm phải lớn hơn 0 phút");
                }

                // Validation: Time must be less than total route duration
                if (request.getDurationMinutesFromOrigin() >= route.getDurationMinutes()) {
                        throw new RuntimeException("Thời gian đến trạm phải nhỏ hơn tổng thời gian tuyến ("
                                        + route.getDurationMinutes() + " phút)");
                }

                // Validation: Chronological consistency (Order vs Time)
                boolean isTimeInvalid = route.getStops().stream().anyMatch(existingStop -> {
                        // If new stop is AFTER existing stop, its time must be GREATER
                        if (request.getStopOrder() > existingStop.getStopOrder()
                                        && request.getDurationMinutesFromOrigin() <= existingStop
                                                        .getDurationMinutesFromOrigin()) {
                                return true;
                        }
                        // If new stop is BEFORE existing stop, its time must be LESS
                        if (request.getStopOrder() < existingStop.getStopOrder()
                                        && request.getDurationMinutesFromOrigin() >= existingStop
                                                        .getDurationMinutesFromOrigin()) {
                                return true;
                        }
                        // If order is same, maybe warn? But strictly speaking duplicate order is
                        // allowed but confusing.
                        // Let's assume strict strictly increasing time for strictly increasing order.
                        return false;
                });

                if (isTimeInvalid) {
                        throw new RuntimeException(
                                        "Thời gian không hợp lý: Thứ tự trạm và thời gian di chuyển phải tăng dần (Trạm sau phải có thời gian lớn hơn trạm trước)");
                }

                stop.setStopOrder(request.getStopOrder());
                stop.setDurationMinutesFromOrigin(request.getDurationMinutesFromOrigin());
                stop.setStopType(request.getStopType());

                // Save stop explicitly to ensure ID generation
                RouteStop savedStop = routeStopRepository.save(stop);
                log.info("Saved new stop: ID={}, Order={}", savedStop.getId(), savedStop.getStopOrder());

                // Maintain bidirectional relationship in memory so response is correct
                route.getStops().add(stop);

                return mapToRouteResponse(route);
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
