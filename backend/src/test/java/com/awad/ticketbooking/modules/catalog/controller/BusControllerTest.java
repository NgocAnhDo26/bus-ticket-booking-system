package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateBusRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.service.BusService;
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
class BusControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BusService busService;

    @InjectMocks
    private BusController busController;

    private ObjectMapper objectMapper;
    private Bus mockBus;

    @BeforeEach
    void setUp() {
        PageableHandlerMethodArgumentResolver pageableResolver = new PageableHandlerMethodArgumentResolver();
        pageableResolver.setFallbackPageable(PageRequest.of(0, 20));
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = 
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(busController)
                .setCustomArgumentResolvers(pageableResolver)
                .setMessageConverters(converter)
                .build();

        mockBus = new Bus();
        mockBus.setId(UUID.randomUUID());
        mockBus.setPlateNumber("ABC-123");
    }

    @Test
    void createBus_success() throws Exception {
        // Arrange
        CreateBusRequest request = new CreateBusRequest();
        request.setPlateNumber("NEW-123");
        request.setOperatorId(UUID.randomUUID());
        request.setBusLayoutId(UUID.randomUUID());
        when(busService.createBus(any(CreateBusRequest.class))).thenReturn(mockBus);

        // Act & Assert
        mockMvc.perform(post("/api/buses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plateNumber").value("ABC-123"));

        verify(busService).createBus(any(CreateBusRequest.class));
    }

    @Test
    void updateBus_success() throws Exception {
        // Arrange
        UUID busId = UUID.randomUUID();
        CreateBusRequest request = new CreateBusRequest();
        request.setPlateNumber("UPD-123");
        request.setOperatorId(UUID.randomUUID());
        request.setBusLayoutId(UUID.randomUUID());
        when(busService.updateBus(eq(busId), any(CreateBusRequest.class))).thenReturn(mockBus);

        // Act & Assert
        mockMvc.perform(put("/api/buses/{id}", busId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(busService).updateBus(eq(busId), any(CreateBusRequest.class));
    }

    @Test
    void deleteBus_success() throws Exception {
        // Arrange
        UUID busId = UUID.randomUUID();
        doNothing().when(busService).deleteBus(busId, false);

        // Act & Assert
        mockMvc.perform(delete("/api/buses/{id}", busId))
                .andExpect(status().isNoContent());

        verify(busService).deleteBus(busId, false);
    }

    @Test
    void deleteBus_withForce_success() throws Exception {
        // Arrange
        UUID busId = UUID.randomUUID();
        doNothing().when(busService).deleteBus(busId, true);

        // Act & Assert
        mockMvc.perform(delete("/api/buses/{id}", busId)
                        .param("force", "true"))
                .andExpect(status().isNoContent());

        verify(busService).deleteBus(busId, true);
    }

    @Test
    void getAllBuses_success() throws Exception {
        // Arrange - Create a simpler bus with required fields for JSON serialization
        Bus simpleBus = new Bus();
        simpleBus.setId(UUID.randomUUID());
        simpleBus.setPlateNumber("TEST-123");
        // Set required fields to avoid serialization issues
        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName("Test Operator");
        simpleBus.setOperator(operator);
        BusLayout busLayout = new BusLayout();
        busLayout.setId(UUID.randomUUID());
        busLayout.setName("Test Layout");
        simpleBus.setBusLayout(busLayout);
        Page<Bus> page = new PageImpl<>(Arrays.asList(simpleBus), PageRequest.of(0, 10), 1);
        when(busService.getAllBuses(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/buses")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(busService).getAllBuses(any());
    }

    @Test
    void getBusById_success() throws Exception {
        // Arrange
        UUID busId = mockBus.getId();
        when(busService.getBusById(busId)).thenReturn(mockBus);

        // Act & Assert
        mockMvc.perform(get("/api/buses/{id}", busId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(busId.toString()));

        verify(busService).getBusById(busId);
    }
}
