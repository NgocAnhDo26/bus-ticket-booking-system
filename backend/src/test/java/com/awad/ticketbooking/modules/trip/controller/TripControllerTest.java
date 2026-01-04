package com.awad.ticketbooking.modules.trip.controller;

import com.awad.ticketbooking.common.enums.TripStatus;
import com.awad.ticketbooking.modules.trip.dto.CreateTripRequest;
import com.awad.ticketbooking.modules.trip.dto.PricingRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.service.TripService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TripControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TripService tripService;

    @InjectMocks
    private TripController tripController;

    private ObjectMapper objectMapper;
    private TripResponse mockTripResponse;

    @BeforeEach
    void setUp() {
        PageableHandlerMethodArgumentResolver pageableResolver = new PageableHandlerMethodArgumentResolver();
        pageableResolver.setFallbackPageable(PageRequest.of(0, 20));
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = 
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(tripController)
                .setCustomArgumentResolvers(pageableResolver)
                .setMessageConverters(converter)
                .build();

        mockTripResponse = TripResponse.builder()
                .id(UUID.randomUUID())
                .departureTime(Instant.now().plusSeconds(3600))
                .arrivalTime(Instant.now().plusSeconds(7200))
                .status(TripStatus.SCHEDULED)
                .build();
    }

    @Test
    void searchTrips_success() throws Exception {
        // Arrange
        Page<TripResponse> page = new PageImpl<>(Arrays.asList(mockTripResponse), PageRequest.of(0, 10), 1);
        when(tripService.searchTrips(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/trips/search")
                        .param("origin", "Ho Chi Minh")
                        .param("destination", "Ha Noi"))
                .andExpect(status().isOk());

        verify(tripService).searchTrips(any());
    }

    @Test
    void getAllTrips_success() throws Exception {
        // Arrange
        Page<TripResponse> page = new PageImpl<>(Arrays.asList(mockTripResponse), PageRequest.of(0, 10), 1);
        when(tripService.getAllTrips(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/trips")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(tripService).getAllTrips(any());
    }

    @Test
    void getTripById_success() throws Exception {
        // Arrange
        UUID tripId = mockTripResponse.getId();
        when(tripService.getTripById(tripId)).thenReturn(mockTripResponse);

        // Act & Assert
        mockMvc.perform(get("/api/trips/{id}", tripId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(tripId.toString()));

        verify(tripService).getTripById(tripId);
    }

    @Test
    void createTrip_success() throws Exception {
        // Arrange
        CreateTripRequest request = new CreateTripRequest();
        request.setRouteId(UUID.randomUUID());
        request.setBusId(UUID.randomUUID());
        request.setDepartureTime(Instant.now().plusSeconds(3600));
        request.setArrivalTime(Instant.now().plusSeconds(7200));
        PricingRequest pricing = new PricingRequest();
        pricing.setSeatType(com.awad.ticketbooking.common.enums.SeatType.NORMAL);
        pricing.setPrice(new BigDecimal("200000"));
        request.setPricings(Arrays.asList(pricing));
        when(tripService.createTrip(any(CreateTripRequest.class))).thenReturn(mockTripResponse);

        // Act & Assert
        mockMvc.perform(post("/api/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(tripService).createTrip(any(CreateTripRequest.class));
    }

    @Test
    void updateTrip_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        CreateTripRequest request = new CreateTripRequest();
        request.setRouteId(UUID.randomUUID());
        request.setBusId(UUID.randomUUID());
        request.setDepartureTime(Instant.now().plusSeconds(3600));
        request.setArrivalTime(Instant.now().plusSeconds(7200));
        PricingRequest pricing = new PricingRequest();
        pricing.setSeatType(com.awad.ticketbooking.common.enums.SeatType.NORMAL);
        pricing.setPrice(new BigDecimal("200000"));
        request.setPricings(Arrays.asList(pricing));
        when(tripService.updateTrip(eq(tripId), any(CreateTripRequest.class))).thenReturn(mockTripResponse);

        // Act & Assert
        mockMvc.perform(put("/api/trips/{id}", tripId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(tripService).updateTrip(eq(tripId), any(CreateTripRequest.class));
    }

    @Test
    void deleteTrip_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        doNothing().when(tripService).deleteTrip(tripId, false);

        // Act & Assert
        mockMvc.perform(delete("/api/trips/{id}", tripId))
                .andExpect(status().isNoContent());

        verify(tripService).deleteTrip(tripId, false);
    }

    @Test
    void deleteTrip_withForce_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        doNothing().when(tripService).deleteTrip(tripId, true);

        // Act & Assert
        mockMvc.perform(delete("/api/trips/{id}", tripId)
                        .param("force", "true"))
                .andExpect(status().isNoContent());

        verify(tripService).deleteTrip(tripId, true);
    }

    @Test
    void updateTripStops_success() throws Exception {
        // Arrange
        UUID tripId = mockTripResponse.getId();
        com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest request = 
                new com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest();
        request.setStops(java.util.Collections.emptyList());
        when(tripService.updateTripStops(eq(tripId), any())).thenReturn(mockTripResponse);

        // Act & Assert
        mockMvc.perform(put("/api/trips/{id}/stops", tripId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(tripService).updateTripStops(eq(tripId), any());
    }

    @Test
    void getTripPassengers_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        List<com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse> passengers = Arrays.asList();
        when(tripService.getTripPassengers(tripId)).thenReturn(passengers);

        // Act & Assert
        mockMvc.perform(get("/api/trips/{id}/passengers", tripId))
                .andExpect(status().isOk());

        verify(tripService).getTripPassengers(tripId);
    }

    @Test
    void updateTripStatus_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        TripStatus status = TripStatus.RUNNING;
        when(tripService.updateTripStatus(tripId, status)).thenReturn(mockTripResponse);

        // Act & Assert
        mockMvc.perform(patch("/api/trips/{id}/status", tripId)
                        .param("status", "RUNNING"))
                .andExpect(status().isOk());

        verify(tripService).updateTripStatus(tripId, status);
    }

    @Test
    void checkCanUpdateRecurrence_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        TripService.RecurrenceUpdateCheck check = new TripService.RecurrenceUpdateCheck(true, 0L);
        when(tripService.checkCanUpdateRecurrence(tripId)).thenReturn(check);

        // Act & Assert
        mockMvc.perform(get("/api/trips/{id}/can-update-recurrence", tripId))
                .andExpect(status().isOk());

        verify(tripService).checkCanUpdateRecurrence(tripId);
    }
}
