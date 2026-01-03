package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.common.enums.StopType;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.dto.AddRouteStopRequest;
import com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest;
import com.awad.ticketbooking.modules.catalog.dto.RouteResponse;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.RouteStop;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import com.awad.ticketbooking.modules.catalog.repository.RouteStopRepository;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RouteServiceTest {

    @InjectMocks
    private RouteService routeService;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private RouteStopRepository routeStopRepository;

    @Mock
    private StationRepository stationRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TripRepository tripRepository;

    private Route testRoute;
    private Station originStation;
    private Station destinationStation;
    private CreateRouteRequest createRequest;

    @BeforeEach
    void setUp() {
        originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi Station");
        originStation.setCity("Hanoi");
        originStation.setAddress("123 Main St");

        destinationStation = new Station();
        destinationStation.setId(UUID.randomUUID());
        destinationStation.setName("Saigon Station");
        destinationStation.setCity("Saigon");
        destinationStation.setAddress("456 Main St");

        testRoute = new Route();
        testRoute.setId(UUID.randomUUID());
        testRoute.setName("Hanoi - Saigon Express");
        testRoute.setOriginStation(originStation);
        testRoute.setDestinationStation(destinationStation);
        testRoute.setDurationMinutes(360);
        testRoute.setDistanceKm(BigDecimal.valueOf(1800));
        testRoute.setIsActive(true);
        testRoute.setStops(new ArrayList<>());

        createRequest = new CreateRouteRequest();
        createRequest.setName("Hanoi - Saigon Express");
        createRequest.setOriginStationId(originStation.getId());
        createRequest.setDestinationStationId(destinationStation.getId());
        createRequest.setDurationMinutes(360);
        createRequest.setDistanceKm(BigDecimal.valueOf(1800));
    }

    @Test
    void createRoute_success() {
        // Arrange
        when(stationRepository.findById(originStation.getId())).thenReturn(Optional.of(originStation));
        when(stationRepository.findById(destinationStation.getId())).thenReturn(Optional.of(destinationStation));
        when(routeRepository.save(any(Route.class))).thenReturn(testRoute);

        // Act
        RouteResponse result = routeService.createRoute(createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Hanoi - Saigon Express", result.getName());
        assertEquals("Hanoi", result.getOriginStation().getCity());
        assertEquals("Saigon", result.getDestinationStation().getCity());
        verify(routeRepository).save(any(Route.class));
    }

    @Test
    void createRoute_originNotFound_throwsException() {
        // Arrange
        when(stationRepository.findById(originStation.getId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.createRoute(createRequest));
        assertEquals("Origin station not found", exception.getMessage());
    }

    @Test
    void createRoute_destinationNotFound_throwsException() {
        // Arrange
        when(stationRepository.findById(originStation.getId())).thenReturn(Optional.of(originStation));
        when(stationRepository.findById(destinationStation.getId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.createRoute(createRequest));
        assertEquals("Destination station not found", exception.getMessage());
    }

    @Test
    void updateRoute_success() {
        // Arrange
        CreateRouteRequest updateRequest = new CreateRouteRequest();
        updateRequest.setName("Updated Route");
        updateRequest.setOriginStationId(originStation.getId());
        updateRequest.setDestinationStationId(destinationStation.getId());
        updateRequest.setDurationMinutes(400);
        updateRequest.setDistanceKm(BigDecimal.valueOf(2000));

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(stationRepository.findById(originStation.getId())).thenReturn(Optional.of(originStation));
        when(stationRepository.findById(destinationStation.getId())).thenReturn(Optional.of(destinationStation));
        when(routeRepository.save(any(Route.class))).thenReturn(testRoute);

        // Act
        RouteResponse result = routeService.updateRoute(testRoute.getId(), updateRequest);

        // Assert
        assertNotNull(result);
        verify(routeRepository).save(any(Route.class));
    }

    @Test
    void updateRoute_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(routeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.updateRoute(nonExistentId, createRequest));
        assertEquals("Route not found", exception.getMessage());
    }

    @Test
    void deleteRoute_success() {
        // Arrange
        when(routeRepository.existsById(testRoute.getId())).thenReturn(true);
        doNothing().when(routeRepository).deleteById(testRoute.getId());

        // Act
        routeService.deleteRoute(testRoute.getId(), false);

        // Assert
        verify(routeRepository).deleteById(testRoute.getId());
    }

    @Test
    void deleteRoute_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(routeRepository.existsById(nonExistentId)).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.deleteRoute(nonExistentId, false));
        assertEquals("Route not found", exception.getMessage());
    }

    @Test
    void deleteRoute_force_cascadesDeletes() {
        // Arrange
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());

        when(routeRepository.existsById(testRoute.getId())).thenReturn(true);
        when(tripRepository.findByRouteId(testRoute.getId())).thenReturn(Collections.singletonList(trip));

        // Act
        routeService.deleteRoute(testRoute.getId(), true);

        // Assert
        verify(bookingRepository).deleteByTripId(trip.getId());
        verify(tripRepository).deleteByRouteId(testRoute.getId());
        verify(routeRepository).deleteById(testRoute.getId());
    }

    @Test
    void getRouteById_success() {
        // Arrange
        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));

        // Act
        RouteResponse result = routeService.getRouteById(testRoute.getId());

        // Assert
        assertNotNull(result);
        assertEquals("Hanoi - Saigon Express", result.getName());
    }

    @Test
    void getRouteById_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(routeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.getRouteById(nonExistentId));
        assertEquals("Route not found", exception.getMessage());
    }

    @Test
    void getAllRoutes_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Route> page = new PageImpl<>(Collections.singletonList(testRoute));
        when(routeRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<RouteResponse> result = routeService.getAllRoutes(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void addRouteStop_success() {
        // Arrange
        Station stopStation = new Station();
        stopStation.setId(UUID.randomUUID());
        stopStation.setName("Hue Station");
        stopStation.setCity("Hue");

        AddRouteStopRequest stopRequest = new AddRouteStopRequest();
        stopRequest.setStationId(stopStation.getId());
        stopRequest.setStopOrder(1);
        stopRequest.setDurationMinutesFromOrigin(120);
        stopRequest.setStopType(StopType.BOTH);

        RouteStop savedStop = new RouteStop();
        savedStop.setId(UUID.randomUUID());
        savedStop.setRoute(testRoute);
        savedStop.setStation(stopStation);
        savedStop.setStopOrder(1);
        savedStop.setDurationMinutesFromOrigin(120);
        savedStop.setStopType(StopType.BOTH);

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(stationRepository.findById(stopStation.getId())).thenReturn(Optional.of(stopStation));
        when(routeStopRepository.save(any(RouteStop.class))).thenReturn(savedStop);

        // Act
        RouteResponse result = routeService.addRouteStop(testRoute.getId(), stopRequest);

        // Assert
        assertNotNull(result);
        verify(routeStopRepository).save(any(RouteStop.class));
    }

    @Test
    void addRouteStop_invalidTime_throwsException() {
        // Arrange
        Station stopStation = new Station();
        stopStation.setId(UUID.randomUUID());
        stopStation.setName("Test Station");
        
        AddRouteStopRequest stopRequest = new AddRouteStopRequest();
        stopRequest.setStationId(stopStation.getId());
        stopRequest.setStopOrder(1);
        stopRequest.setDurationMinutesFromOrigin(0); // Invalid: must be > 0
        stopRequest.setStopType(StopType.BOTH);

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(stationRepository.findById(stopStation.getId())).thenReturn(Optional.of(stopStation));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.addRouteStop(testRoute.getId(), stopRequest));
        assertNotNull(exception);
        assertTrue(exception.getMessage() != null && 
                   (exception.getMessage().contains("phải lớn hơn 0") || 
                    exception.getMessage().contains("lớn hơn 0")));
    }

    @Test
    void addRouteStop_timeExceedsRouteDuration_throwsException() {
        // Arrange
        Station stopStation = new Station();
        stopStation.setId(UUID.randomUUID());
        stopStation.setName("Test Station");
        
        AddRouteStopRequest stopRequest = new AddRouteStopRequest();
        stopRequest.setStationId(stopStation.getId());
        stopRequest.setStopOrder(1);
        stopRequest.setDurationMinutesFromOrigin(400); // Greater than route duration (360)
        stopRequest.setStopType(StopType.BOTH);

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(stationRepository.findById(stopStation.getId())).thenReturn(Optional.of(stopStation));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.addRouteStop(testRoute.getId(), stopRequest));
        assertNotNull(exception);
        assertTrue(exception.getMessage() != null && 
                   (exception.getMessage().contains("nhỏ hơn tổng thời gian tuyến") || 
                    exception.getMessage().contains("nhỏ hơn")));
    }

    @Test
    void addRouteStop_withCustomName_success() {
        // Arrange
        AddRouteStopRequest stopRequest = new AddRouteStopRequest();
        stopRequest.setCustomName("Rest Stop A");
        stopRequest.setCustomAddress("Highway 1, KM 50");
        stopRequest.setStopOrder(1);
        stopRequest.setDurationMinutesFromOrigin(60);
        stopRequest.setStopType(StopType.BOTH);

        RouteStop savedStop = new RouteStop();
        savedStop.setId(UUID.randomUUID());
        savedStop.setRoute(testRoute);
        savedStop.setCustomName("Rest Stop A");

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(routeStopRepository.save(any(RouteStop.class))).thenReturn(savedStop);

        // Act
        RouteResponse result = routeService.addRouteStop(testRoute.getId(), stopRequest);

        // Assert
        assertNotNull(result);
        verify(routeStopRepository).save(any(RouteStop.class));
    }

    @Test
    void deleteRouteStop_success() {
        // Arrange
        RouteStop stop = new RouteStop();
        stop.setId(UUID.randomUUID());
        stop.setRoute(testRoute);

        when(routeStopRepository.findById(stop.getId())).thenReturn(Optional.of(stop));

        // Act
        routeService.deleteRouteStop(testRoute.getId(), stop.getId());

        // Assert
        verify(routeStopRepository).delete(stop);
    }

    @Test
    void deleteRouteStop_notBelongToRoute_throwsException() {
        // Arrange
        Route otherRoute = new Route();
        otherRoute.setId(UUID.randomUUID());

        RouteStop stop = new RouteStop();
        stop.setId(UUID.randomUUID());
        stop.setRoute(otherRoute);

        when(routeStopRepository.findById(stop.getId())).thenReturn(Optional.of(stop));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> routeService.deleteRouteStop(testRoute.getId(), stop.getId()));
        assertEquals("Stop does not belong to this route", exception.getMessage());
    }

    @Test
    void searchRoutes_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Route> page = new PageImpl<>(Collections.singletonList(testRoute));
        when(routeRepository.search("Hanoi", pageable)).thenReturn(page);

        // Act
        Page<RouteResponse> result = routeService.searchRoutes("Hanoi", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
