package com.awad.ticketbooking.modules.catalog.controller;

import com.awad.ticketbooking.modules.catalog.dto.BusLayoutPayload;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.service.BusLayoutService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class BusLayoutControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BusLayoutService busLayoutService;

    @InjectMocks
    private BusLayoutController busLayoutController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(busLayoutController).build();
    }

    @Test
    void createLayout_ShouldReturnLayout() throws Exception {
        BusLayoutPayload.BusLayoutRequest request = new BusLayoutPayload.BusLayoutRequest();
        request.setName("Limousine 34");
        request.setBusType("LIMOUSINE");
        request.setTotalFloors(2);
        request.setDescription("Luxury");

        BusLayout mockLayout = new BusLayout();
        mockLayout.setId(UUID.randomUUID());
        mockLayout.setName("Limousine 34");
        mockLayout.setBusType("LIMOUSINE");
        mockLayout.setTotalSeats(0);

        when(busLayoutService.createLayout(any())).thenReturn(mockLayout);

        mockMvc.perform(post("/api/bus-layouts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Limousine 34"));
    }

    @Test
    void updateLayoutSeats_ShouldReturn200() throws Exception {
        UUID layoutId = UUID.randomUUID();
        BusLayoutPayload.SeatUpdatePayload payload = new BusLayoutPayload.SeatUpdatePayload();
        List<BusLayoutPayload.LayoutSeatDto> seats = new ArrayList<>();
        BusLayoutPayload.LayoutSeatDto s1 = new BusLayoutPayload.LayoutSeatDto();
        s1.setSeatCode("A01");
        s1.setType("VIP");
        s1.setFloor(1);
        s1.setRow(0);
        s1.setCol(0);
        seats.add(s1);
        payload.setSeats(seats);

        mockMvc.perform(put("/api/bus-layouts/" + layoutId + "/seats")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());
    }

    @Test
    void getLayout_ShouldReturnLayoutWithSeats() throws Exception {
        UUID layoutId = UUID.randomUUID();
        BusLayoutPayload.BusLayoutResponse response = new BusLayoutPayload.BusLayoutResponse();
        response.setId(layoutId);
        response.setName("Test Layout");
        response.setSeats(new ArrayList<>());

        when(busLayoutService.getLayout(eq(layoutId))).thenReturn(response);

        mockMvc.perform(get("/api/bus-layouts/" + layoutId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Layout"));
    }
}
