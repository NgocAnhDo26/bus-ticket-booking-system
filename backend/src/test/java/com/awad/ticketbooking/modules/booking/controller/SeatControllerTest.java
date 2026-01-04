package com.awad.ticketbooking.modules.booking.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.booking.dto.LockSeatRequest;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.service.SeatLockService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SeatControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SeatLockService seatLockService;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private SeatController seatController;

    private ObjectMapper objectMapper;
    private User testUser;
    private ApplicationUserDetails userDetails;

    @BeforeEach
    void setUp() {
        AuthenticationPrincipalArgumentResolver authResolver = new AuthenticationPrincipalArgumentResolver();
        mockMvc = MockMvcBuilders.standaloneSetup(seatController)
                .setCustomArgumentResolvers(authResolver)
                .build();
        objectMapper = new ObjectMapper();

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.PASSENGER);
        userDetails = new ApplicationUserDetails(testUser);
    }
    
    private void setupSecurityContext() {
        SecurityContext context = new SecurityContextImpl();
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }
    
    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void lockSeat_success() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            LockSeatRequest request = new LockSeatRequest();
            request.setTripId(UUID.randomUUID());
            request.setSeatCode("A01");
            when(bookingRepository.existsByTripIdAndTicketsSeatCodeAndStatusNot(any(), anyString(), any()))
                    .thenReturn(false);
            when(seatLockService.lockSeat(any(), anyString(), any())).thenReturn(true);

            // Act & Assert
            mockMvc.perform(post("/api/bookings/seats/lock")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(seatLockService).lockSeat(any(), anyString(), any());
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void lockSeat_alreadyBooked() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            LockSeatRequest request = new LockSeatRequest();
            request.setTripId(UUID.randomUUID());
            request.setSeatCode("A01");
            when(bookingRepository.existsByTripIdAndTicketsSeatCodeAndStatusNot(any(), anyString(), any()))
                    .thenReturn(true);

            // Act & Assert
            mockMvc.perform(post("/api/bookings/seats/lock")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());

            verify(seatLockService, never()).lockSeat(any(), anyString(), any());
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void lockSeat_alreadyLocked() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            LockSeatRequest request = new LockSeatRequest();
            request.setTripId(UUID.randomUUID());
            request.setSeatCode("A01");
            when(bookingRepository.existsByTripIdAndTicketsSeatCodeAndStatusNot(any(), anyString(), any()))
                    .thenReturn(false);
            when(seatLockService.lockSeat(any(), anyString(), any())).thenReturn(false);

            // Act & Assert
            mockMvc.perform(post("/api/bookings/seats/lock")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict());

            verify(seatLockService).lockSeat(any(), anyString(), any());
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void lockSeat_withGuestId() throws Exception {
        // Arrange
        LockSeatRequest request = new LockSeatRequest();
        request.setTripId(UUID.randomUUID());
        request.setSeatCode("A01");
        request.setGuestId(UUID.randomUUID().toString());
        when(bookingRepository.existsByTripIdAndTicketsSeatCodeAndStatusNot(any(), anyString(), any()))
                .thenReturn(false);
        when(seatLockService.lockSeat(any(), anyString(), any())).thenReturn(true);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/seats/lock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(seatLockService).lockSeat(any(), anyString(), any());
    }

    @Test
    void unlockSeat_success() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            LockSeatRequest request = new LockSeatRequest();
            request.setTripId(UUID.randomUUID());
            request.setSeatCode("A01");
            doNothing().when(seatLockService).unlockSeat(any(), anyString(), any());

            // Act & Assert
            mockMvc.perform(post("/api/bookings/seats/unlock")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());

            verify(seatLockService).unlockSeat(any(), anyString(), any());
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void getSeatStatus_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        Map<String, UUID> lockedSeats = new HashMap<>();
        lockedSeats.put("A01", UUID.randomUUID());
        when(bookingRepository.findAllByTripIdAndStatusNot(any(), any())).thenReturn(java.util.Collections.emptyList());
        when(seatLockService.getLockedSeats(tripId)).thenReturn(lockedSeats);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/seats/{tripId}", tripId))
                .andExpect(status().isOk());

        verify(seatLockService).getLockedSeats(tripId);
    }
}
