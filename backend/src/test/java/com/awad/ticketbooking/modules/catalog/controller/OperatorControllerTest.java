package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.CreateOperatorRequest;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.service.OperatorService;
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
class OperatorControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OperatorService operatorService;

    @InjectMocks
    private OperatorController operatorController;

    private ObjectMapper objectMapper;
    private Operator mockOperator;

    @BeforeEach
    void setUp() {
        PageableHandlerMethodArgumentResolver pageableResolver = new PageableHandlerMethodArgumentResolver();
        pageableResolver.setFallbackPageable(PageRequest.of(0, 20));
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = 
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(operatorController)
                .setCustomArgumentResolvers(pageableResolver)
                .setMessageConverters(converter)
                .build();

        mockOperator = new Operator();
        mockOperator.setId(UUID.randomUUID());
        mockOperator.setName("Test Operator");
    }

    @Test
    void createOperator_success() throws Exception {
        // Arrange
        CreateOperatorRequest request = new CreateOperatorRequest();
        request.setName("New Operator");
        when(operatorService.createOperator(any(CreateOperatorRequest.class))).thenReturn(mockOperator);

        // Act & Assert
        mockMvc.perform(post("/api/operators")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Operator"));

        verify(operatorService).createOperator(any(CreateOperatorRequest.class));
    }

    @Test
    void getAllOperators_success() throws Exception {
        // Arrange
        Page<Operator> page = new PageImpl<>(Arrays.asList(mockOperator), PageRequest.of(0, 10), 1);
        when(operatorService.getAllOperators(any())).thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/operators")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());

        verify(operatorService).getAllOperators(any());
    }

    @Test
    void updateOperator_success() throws Exception {
        // Arrange
        UUID operatorId = UUID.randomUUID();
        CreateOperatorRequest request = new CreateOperatorRequest();
        request.setName("Updated Operator");
        when(operatorService.updateOperator(eq(operatorId), any(CreateOperatorRequest.class))).thenReturn(mockOperator);

        // Act & Assert
        mockMvc.perform(put("/api/operators/{id}", operatorId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(operatorService).updateOperator(eq(operatorId), any(CreateOperatorRequest.class));
    }

    @Test
    void deleteOperator_success() throws Exception {
        // Arrange
        UUID operatorId = UUID.randomUUID();
        doNothing().when(operatorService).deleteOperator(operatorId, false);

        // Act & Assert
        mockMvc.perform(delete("/api/operators/{id}", operatorId))
                .andExpect(status().isNoContent());

        verify(operatorService).deleteOperator(operatorId, false);
    }

    @Test
    void deleteOperator_withForce_success() throws Exception {
        // Arrange
        UUID operatorId = UUID.randomUUID();
        doNothing().when(operatorService).deleteOperator(operatorId, true);

        // Act & Assert
        mockMvc.perform(delete("/api/operators/{id}", operatorId)
                        .param("force", "true"))
                .andExpect(status().isNoContent());

        verify(operatorService).deleteOperator(operatorId, true);
    }
}
