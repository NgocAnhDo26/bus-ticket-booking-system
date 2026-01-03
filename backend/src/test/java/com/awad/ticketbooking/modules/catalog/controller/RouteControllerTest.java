package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.AddRouteStopRequest;
import com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest;
import com.awad.ticketbooking.modules.catalog.dto.RouteResponse;
import com.awad.ticketbooking.modules.catalog.service.RouteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class RouteControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RouteService routeService;

    @InjectMocks
    private RouteController routeController;

    private ObjectMapper objectMapper;
    private RouteResponse mockRouteResponse;

    @BeforeEach
    void setUp() {
        PageableHandlerMethodArgumentResolver pageableResolver = new PageableHandlerMethodArgumentResolver();
        pageableResolver.setFallbackPageable(PageRequest.of(0, 20));
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = 
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(routeController)
                .setCustomArgumentResolvers(pageableResolver)
                .setMessageConverters(converter)
                .build();

        mockRouteResponse = RouteResponse.builder()
                .id(UUID.randomUUID())
                .name("Route 1")
                .durationMinutes(120)
                .distanceKm(new BigDecimal("100.5"))
                .isActive(true)
                .build();
    }

    @Test
    void getTopRoutes_success() throws Exception {
        // Arrange
        List<RouteResponse> routes = Arrays.asList(mockRouteResponse);
        when(routeService.getTopRoutes()).thenReturn(routes);

        // Act & Assert
        mockMvc.perform(get("/api/routes/top"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Route 1"));

        verify(routeService).getTopRoutes();
    }

    @Test
    void getAllRoutes_success() throws Exception {
        // Arrange
        Page<RouteResponse> page = new PageImpl<>(Arrays.asList(mockRouteResponse), PageRequest.of(0, 10), 1);
        when(routeService.getAllRoutes(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/routes")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(routeService).getAllRoutes(any());
    }

    @Test
    void searchRoutes_success() throws Exception {
        // Arrange
        Page<RouteResponse> page = new PageImpl<>(Arrays.asList(mockRouteResponse), PageRequest.of(0, 10), 1);
        when(routeService.searchRoutes(anyString(), any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/routes/search")
                        .param("query", "test")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(routeService).searchRoutes(eq("test"), any());
    }

    @Test
    void getRouteById_success() throws Exception {
        // Arrange
        UUID routeId = mockRouteResponse.getId();
        when(routeService.getRouteById(routeId)).thenReturn(mockRouteResponse);

        // Act & Assert
        mockMvc.perform(get("/api/routes/{id}", routeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(routeId.toString()));

        verify(routeService).getRouteById(routeId);
    }

    @Test
    void createRoute_success() throws Exception {
        // Arrange
        CreateRouteRequest request = new CreateRouteRequest();
        request.setName("New Route");
        request.setOriginStationId(UUID.randomUUID());
        request.setDestinationStationId(UUID.randomUUID());
        when(routeService.createRoute(any(CreateRouteRequest.class))).thenReturn(mockRouteResponse);

        // Act & Assert
        mockMvc.perform(post("/api/routes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(routeService).createRoute(any(CreateRouteRequest.class));
    }

    @Test
    void updateRoute_success() throws Exception {
        // Arrange
        UUID routeId = mockRouteResponse.getId();
        CreateRouteRequest request = new CreateRouteRequest();
        request.setName("Updated Route");
        request.setOriginStationId(UUID.randomUUID());
        request.setDestinationStationId(UUID.randomUUID());
        when(routeService.updateRoute(eq(routeId), any(CreateRouteRequest.class))).thenReturn(mockRouteResponse);

        // Act & Assert
        mockMvc.perform(put("/api/routes/{id}", routeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(routeService).updateRoute(eq(routeId), any(CreateRouteRequest.class));
    }

    @Test
    void deleteRoute_success() throws Exception {
        // Arrange
        UUID routeId = UUID.randomUUID();
        doNothing().when(routeService).deleteRoute(routeId, false);

        // Act & Assert
        mockMvc.perform(delete("/api/routes/{id}", routeId))
                .andExpect(status().isNoContent());

        verify(routeService).deleteRoute(routeId, false);
    }

    @Test
    void deleteRoute_withForce_success() throws Exception {
        // Arrange
        UUID routeId = UUID.randomUUID();
        doNothing().when(routeService).deleteRoute(routeId, true);

        // Act & Assert
        mockMvc.perform(delete("/api/routes/{id}", routeId)
                        .param("force", "true"))
                .andExpect(status().isNoContent());

        verify(routeService).deleteRoute(routeId, true);
    }

    @Test
    void addRouteStop_success() throws Exception {
        // Arrange
        UUID routeId = UUID.randomUUID();
        AddRouteStopRequest request = new AddRouteStopRequest();
        request.setStationId(UUID.randomUUID());
        when(routeService.addRouteStop(eq(routeId), any(AddRouteStopRequest.class))).thenReturn(mockRouteResponse);

        // Act & Assert
        mockMvc.perform(post("/api/routes/{id}/stops", routeId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(routeService).addRouteStop(eq(routeId), any(AddRouteStopRequest.class));
    }

    @Test
    void deleteRouteStop_success() throws Exception {
        // Arrange
        UUID routeId = UUID.randomUUID();
        UUID stopId = UUID.randomUUID();
        doNothing().when(routeService).deleteRouteStop(routeId, stopId);

        // Act & Assert
        mockMvc.perform(delete("/api/routes/{id}/stops/{stopId}", routeId, stopId))
                .andExpect(status().isNoContent());

        verify(routeService).deleteRouteStop(routeId, stopId);
    }
}
