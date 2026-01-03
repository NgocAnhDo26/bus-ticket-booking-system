package com.awad.ticketbooking.common.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailServiceTest {

    @InjectMocks
    private EmailService emailService;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    private Booking testBooking;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@example.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Bus Ticket Booking");

        // Setup stations
        Station originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi Station");
        originStation.setCity("Hanoi");

        Station destStation = new Station();
        destStation.setId(UUID.randomUUID());
        destStation.setName("Saigon Station");
        destStation.setCity("Saigon");

        // Setup route
        Route route = new Route();
        route.setId(UUID.randomUUID());
        route.setOriginStation(originStation);
        route.setDestinationStation(destStation);

        // Setup operator
        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName("VietBus");

        // Setup bus
        Bus bus = new Bus();
        bus.setId(UUID.randomUUID());
        bus.setPlateNumber("29A-12345");
        bus.setOperator(operator);

        // Setup trip
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());
        trip.setRoute(route);
        trip.setBus(bus);
        trip.setDepartureTime(Instant.now().plusSeconds(86400));

        // Setup booking
        testBooking = new Booking();
        testBooking.setId(UUID.randomUUID());
        testBooking.setCode("BK-ABC123");
        testBooking.setTrip(trip);
        testBooking.setPassengerName("Test Passenger");
        testBooking.setPassengerPhone("0123456789");
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testBooking.setTotalPrice(new BigDecimal("200000"));
        testBooking.setPickupStation(originStation);

        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setBooking(testBooking);
        ticket.setSeatCode("A1");
        ticket.setPassengerName("Test Passenger");
        testBooking.setTickets(new ArrayList<>(Collections.singletonList(ticket)));
    }

    @Test
    void sendBookingConfirmationEmail_success() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        emailService.sendBookingConfirmationEmail(testBooking, "test@example.com");

        // Assert
        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendTripReminderEmail_success() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        emailService.sendTripReminderEmail(testBooking, "test@example.com");

        // Assert
        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendActivationEmail_success() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        emailService.sendActivationEmail("test@example.com", "Test User", "activation-token");

        // Assert
        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendPasswordResetEmail_success() {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doNothing().when(mailSender).send(any(MimeMessage.class));

        // Act
        emailService.sendPasswordResetEmail("test@example.com", "Test User", "reset-token");

        // Assert
        verify(mailSender).createMimeMessage();
        verify(mailSender).send(any(MimeMessage.class));
    }
}
