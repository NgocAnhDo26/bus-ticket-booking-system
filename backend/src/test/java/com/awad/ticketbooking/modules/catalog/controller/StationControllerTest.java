package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateStationRequest;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.service.StationService;
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

import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class StationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StationService stationService;

    @InjectMocks
    private StationController stationController;

    private ObjectMapper objectMapper;
    private Station mockStation;

    @BeforeEach
    void setUp() {
        PageableHandlerMethodArgumentResolver pageableResolver = new PageableHandlerMethodArgumentResolver();
        pageableResolver.setFallbackPageable(PageRequest.of(0, 20));
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = 
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(stationController)
                .setCustomArgumentResolvers(pageableResolver)
                .setMessageConverters(converter)
                .build();

        mockStation = new Station();
        mockStation.setId(UUID.randomUUID());
        mockStation.setName("Test Station");
        mockStation.setCity("Test City");
        mockStation.setAddress("Test Address");
    }

    @Test
    void createStation_success() throws Exception {
        // Arrange
        CreateStationRequest request = new CreateStationRequest();
        request.setName("New Station");
        request.setCity("New City");
        request.setAddress("New Address");
        when(stationService.createStation(any(CreateStationRequest.class))).thenReturn(mockStation);

        // Act & Assert
        mockMvc.perform(post("/api/stations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Station"));

        verify(stationService).createStation(any(CreateStationRequest.class));
    }

    @Test
    void getAllStations_success() throws Exception {
        // Arrange
        Page<Station> page = new PageImpl<>(Arrays.asList(mockStation), PageRequest.of(0, 10), 1);
        when(stationService.getAllStations(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/stations")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(stationService).getAllStations(any());
    }

    @Test
    void searchStations_success() throws Exception {
        // Arrange
        Page<Station> page = new PageImpl<>(Arrays.asList(mockStation), PageRequest.of(0, 10), 1);
        when(stationService.searchStations(anyString(), any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/stations/search")
                        .param("query", "test")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(stationService).searchStations(eq("test"), any());
    }

    @Test
    void updateStation_success() throws Exception {
        // Arrange
        UUID stationId = UUID.randomUUID();
        CreateStationRequest request = new CreateStationRequest();
        request.setName("Updated Station");
        request.setCity("Updated City");
        request.setAddress("Updated Address");
        when(stationService.updateStation(eq(stationId), any(CreateStationRequest.class))).thenReturn(mockStation);

        // Act & Assert
        mockMvc.perform(put("/api/stations/{id}", stationId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(stationService).updateStation(eq(stationId), any(CreateStationRequest.class));
    }

    @Test
    void deleteStation_success() throws Exception {
        // Arrange
        UUID stationId = UUID.randomUUID();
        doNothing().when(stationService).deleteStation(stationId, false);

        // Act & Assert
        mockMvc.perform(delete("/api/stations/{id}", stationId))
                .andExpect(status().isNoContent());

        verify(stationService).deleteStation(stationId, false);
    }

    @Test
    void deleteStation_withForce_success() throws Exception {
        // Arrange
        UUID stationId = UUID.randomUUID();
        doNothing().when(stationService).deleteStation(stationId, true);

        // Act & Assert
        mockMvc.perform(delete("/api/stations/{id}", stationId)
                        .param("force", "true"))
                .andExpect(status().isNoContent());

        verify(stationService).deleteStation(stationId, true);
    }
}
