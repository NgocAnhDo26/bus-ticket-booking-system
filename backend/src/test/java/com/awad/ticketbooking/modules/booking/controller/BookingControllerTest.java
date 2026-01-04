package com.awad.ticketbooking.modules.booking.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.booking.dto.BookingLookupRequest;
import com.awad.ticketbooking.modules.booking.dto.BookingResponse;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.dto.RefundCalculation;
import com.awad.ticketbooking.modules.booking.dto.TicketRequest;
import com.awad.ticketbooking.modules.booking.dto.UpdateBookingRequest;
import com.awad.ticketbooking.modules.booking.service.BookingService;
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
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
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
class BookingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController bookingController;

    private ObjectMapper objectMapper;
    private BookingResponse mockBookingResponse;
    private User testUser;
    private ApplicationUserDetails userDetails;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(bookingController).build();
        objectMapper = new ObjectMapper();

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.PASSENGER);
        userDetails = new ApplicationUserDetails(testUser);

        mockBookingResponse = BookingResponse.builder()
                .id(UUID.randomUUID())
                .code("BK-12345")
                .status(BookingStatus.PENDING)
                .totalPrice(new BigDecimal("200000"))
                .passengerName("Test Passenger")
                .passengerPhone("0123456789")
                .createdAt(Instant.now())
                .build();
    }

    @Test
    void createBooking_success() throws Exception {
        // Arrange
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTripId(UUID.randomUUID());
        request.setPassengerName("Test Passenger");
        request.setPassengerPhone("0123456789");
        request.setPassengerEmail("test@example.com");
        TicketRequest ticket = new TicketRequest();
        ticket.setSeatCode("A01");
        ticket.setPassengerName("Test Passenger");
        ticket.setPassengerPhone("0123456789");
        ticket.setPrice(new BigDecimal("200000"));
        request.setTickets(Arrays.asList(ticket));
        request.setTotalPrice(new BigDecimal("200000"));
        when(bookingService.createBooking(any(CreateBookingRequest.class))).thenReturn(mockBookingResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BK-12345"));

        verify(bookingService).createBooking(any(CreateBookingRequest.class));
    }

    @Test
    void lookupBooking_success() throws Exception {
        // Arrange
        BookingLookupRequest request = new BookingLookupRequest();
        request.setCode("BK-12345");
        request.setEmail("test@example.com");
        when(bookingService.lookupBooking(anyString(), anyString())).thenReturn(mockBookingResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BK-12345"));

        verify(bookingService).lookupBooking("BK-12345", "test@example.com");
    }

    @Test
    void getBookingById_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        when(bookingService.getBookingById(bookingId)).thenReturn(mockBookingResponse);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/{id}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("BK-12345"));

        verify(bookingService).getBookingById(bookingId);
    }

    // Note: getUserBookings tests require Spring Security context and Pageable binding
    // which don't work properly in standalone MockMvc setup.
    // These are tested in integration tests instead.

    @Test
    void getBookedSeatsForTrip_success() throws Exception {
        // Arrange
        UUID tripId = UUID.randomUUID();
        List<String> bookedSeats = Arrays.asList("A01", "A02", "B01");
        when(bookingService.getBookedSeatsForTrip(tripId)).thenReturn(bookedSeats);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/trip/{tripId}/seats", tripId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("A01"))
                .andExpect(jsonPath("$[1]").value("A02"));

        verify(bookingService).getBookedSeatsForTrip(tripId);
    }

    @Test
    void confirmBooking_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        BookingResponse confirmedResponse = BookingResponse.builder()
                .id(bookingId)
                .code("BK-12345")
                .status(BookingStatus.CONFIRMED)
                .build();
        when(bookingService.confirmBooking(bookingId)).thenReturn(confirmedResponse);

        // Act & Assert
        mockMvc.perform(put("/api/bookings/{id}/confirm", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(bookingService).confirmBooking(bookingId);
    }

    @Test
    void updateBooking_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        UpdateBookingRequest request = new UpdateBookingRequest();
        request.setPassengerName("Updated Name");
        request.setPassengerPhone("0987654321");
        when(bookingService.updateBooking(eq(bookingId), any(UpdateBookingRequest.class)))
                .thenReturn(mockBookingResponse);

        // Act & Assert
        mockMvc.perform(put("/api/bookings/{id}", bookingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        verify(bookingService).updateBooking(eq(bookingId), any(UpdateBookingRequest.class));
    }

    @Test
    void cancelBooking_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        BookingResponse cancelledResponse = BookingResponse.builder()
                .id(bookingId)
                .code("BK-12345")
                .status(BookingStatus.CANCELLED)
                .build();
        when(bookingService.cancelBooking(bookingId)).thenReturn(cancelledResponse);

        // Act & Assert
        mockMvc.perform(put("/api/bookings/{id}/cancel", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        verify(bookingService).cancelBooking(bookingId);
    }

    @Test
    void getRefundEstimate_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        RefundCalculation refundCalc = RefundCalculation.builder()
                .refundAmount(new BigDecimal("150000"))
                .refundPercentage(75.0)
                .policyDescription("Partial refund available")
                .isRefundable(true)
                .build();
        when(bookingService.calculateRefund(bookingId)).thenReturn(refundCalc);

        // Act & Assert
        mockMvc.perform(get("/api/bookings/{id}/refund-estimate", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refundAmount").value(150000));

        verify(bookingService).calculateRefund(bookingId);
    }

    @Test
    void checkInPassenger_success() throws Exception {
        // Arrange
        UUID ticketId = UUID.randomUUID();
        when(bookingService.checkInPassenger(ticketId)).thenReturn(mockBookingResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/tickets/{id}/check-in", ticketId))
                .andExpect(status().isOk());

        verify(bookingService).checkInPassenger(ticketId);
    }

    @Test
    void checkInBooking_success() throws Exception {
        // Arrange
        String bookingCode = "BK-12345";
        when(bookingService.checkInBooking(bookingCode)).thenReturn(mockBookingResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/{code}/check-in-booking", bookingCode))
                .andExpect(status().isOk());

        verify(bookingService).checkInBooking(bookingCode);
    }

    // Note: getAdminBookings test requires Spring Security context and Pageable binding
    // which don't work properly in standalone MockMvc setup.
    // This is tested in integration tests instead.

    @Test
    void refundBooking_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        BookingResponse refundedResponse = BookingResponse.builder()
                .id(bookingId)
                .code("BK-12345")
                .status(BookingStatus.REFUNDED)
                .build();
        when(bookingService.refundBooking(bookingId)).thenReturn(refundedResponse);

        // Act & Assert
        mockMvc.perform(post("/api/bookings/{id}/refund", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REFUNDED"));

        verify(bookingService).refundBooking(bookingId);
    }
}
