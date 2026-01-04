package com.awad.ticketbooking.modules.payment.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.enums.PaymentStatus;
import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.repository.TicketRepository;
import com.awad.ticketbooking.modules.booking.service.SeatLockService;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.payment.dto.CreatePaymentRequest;
import com.awad.ticketbooking.modules.payment.dto.PaymentResponse;
import com.awad.ticketbooking.modules.payment.entity.PaymentTransaction;
import com.awad.ticketbooking.modules.payment.repository.PaymentTransactionRepository;
import com.awad.ticketbooking.modules.payment.repository.PaymentWebhookEventRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import vn.payos.PayOS;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.v2.paymentRequests.PaymentLinkStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PaymentServiceTest {

    @InjectMocks
    private PaymentService paymentService;

    @Mock(answer = org.mockito.Answers.RETURNS_DEEP_STUBS)
    private PayOS payOS;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private PaymentWebhookEventRepository webhookEventRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private EmailService emailService;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private SeatLockService seatLockService;

    private Booking testBooking;
    private PaymentTransaction testTransaction;
    private Trip testTrip;

    @BeforeEach
    void setUp() {
        // Setup station
        Station originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi");
        originStation.setCity("Hanoi");
        originStation.setAddress("123 Main St");

        Station destStation = new Station();
        destStation.setId(UUID.randomUUID());
        destStation.setName("Saigon");
        destStation.setCity("Saigon");
        destStation.setAddress("456 Main St");

        // Setup route
        Route route = new Route();
        route.setId(UUID.randomUUID());
        route.setOriginStation(originStation);
        route.setDestinationStation(destStation);
        route.setDurationMinutes(360);

        // Setup operator and bus
        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName("VietBus");

        BusLayout layout = new BusLayout();
        layout.setId(UUID.randomUUID());
        layout.setTotalSeats(40);

        Bus bus = new Bus();
        bus.setId(UUID.randomUUID());
        bus.setPlateNumber("29A-12345");
        bus.setOperator(operator);
        bus.setBusLayout(layout);
        bus.setAmenities(Collections.singletonList("wifi"));

        // Setup trip
        testTrip = new Trip();
        testTrip.setId(UUID.randomUUID());
        testTrip.setRoute(route);
        testTrip.setBus(bus);
        testTrip.setDepartureTime(Instant.now().plusSeconds(86400));
        testTrip.setArrivalTime(Instant.now().plusSeconds(108000));

        // Setup user
        User user = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .build();
        user.setId(UUID.randomUUID());

        // Setup booking
        testBooking = new Booking();
        testBooking.setId(UUID.randomUUID());
        testBooking.setCode("BK-ABC123");
        testBooking.setTrip(testTrip);
        testBooking.setUser(user);
        testBooking.setPassengerName("Test Passenger");
        testBooking.setPassengerPhone("0123456789");
        testBooking.setPassengerEmail("test@example.com");
        testBooking.setStatus(BookingStatus.PENDING);
        testBooking.setTotalPrice(new BigDecimal("200000"));
        testBooking.setPickupStation(originStation);
        testBooking.setDropoffStation(destStation);

        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setBooking(testBooking);
        ticket.setSeatCode("A1");
        ticket.setPassengerName("Test Passenger");
        ticket.setPassengerPhone("0123456789");
        ticket.setPrice(new BigDecimal("200000"));
        testBooking.setTickets(new ArrayList<>(Collections.singletonList(ticket)));

        // Setup payment transaction
        testTransaction = new PaymentTransaction();
        testTransaction.setId(UUID.randomUUID());
        testTransaction.setBooking(testBooking);
        testTransaction.setOrderCode(System.currentTimeMillis());
        testTransaction.setAmount(new BigDecimal("200000"));
        testTransaction.setStatus(PaymentStatus.PENDING);
        testTransaction.setPaymentLinkId("pl_123");
        testTransaction.setCheckoutUrl("https://pay.payos.vn/web/123");
        testTransaction.setQrCode("qr_data");
    }

    @Test
    void createPayment_success() throws Exception {
        // Arrange
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setBookingId(testBooking.getId());
        request.setReturnUrl("https://example.com/return");
        request.setCancelUrl("https://example.com/cancel");

        CreatePaymentLinkResponse payosResponse = CreatePaymentLinkResponse.builder()
                .paymentLinkId("pl_123")
                .checkoutUrl("https://pay.payos.vn/web/123")
                .qrCode("qr_data")
                .bin("970415")
                .accountNumber("1234567890")
                .accountName("Test Account")
                .amount(100000L)
                .description("Test payment")
                .orderCode(12345L)
                .currency("VND")
                .status(PaymentLinkStatus.PENDING)
                .build();

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(paymentTransactionRepository.findByBookingId(testBooking.getId())).thenReturn(Optional.empty());
        when(paymentTransactionRepository.existsByOrderCode(anyLong())).thenReturn(false);
        when(payOS.paymentRequests().create(any())).thenReturn(payosResponse);
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenReturn(testTransaction);

        // Act
        PaymentResponse response = paymentService.createPayment(request);

        // Assert
        assertNotNull(response);
        assertEquals(testBooking.getId(), response.getBookingId());
        assertNotNull(response.getCheckoutUrl());
        verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
    }

    @Test
    void createPayment_bookingNotFound_throwsException() {
        // Arrange
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setBookingId(UUID.randomUUID());

        when(bookingRepository.findById(request.getBookingId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> paymentService.createPayment(request));
        assertEquals("Booking not found", exception.getMessage());
    }

    @Test
    void createPayment_bookingNotPending_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setBookingId(testBooking.getId());

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> paymentService.createPayment(request));
        assertTrue(exception.getMessage().contains("Only pending bookings can be paid"));
    }

    @Test
    void createPayment_paymentAlreadyExists_throwsException() {
        // Arrange
        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setBookingId(testBooking.getId());

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(paymentTransactionRepository.findByBookingId(testBooking.getId()))
                .thenReturn(Optional.of(testTransaction));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> paymentService.createPayment(request));
        assertEquals("Payment already exists for this booking", exception.getMessage());
    }

    @Test
    void getPaymentByBookingId_success() {
        // Arrange
        when(paymentTransactionRepository.findByBookingId(testBooking.getId()))
                .thenReturn(Optional.of(testTransaction));

        // Act
        PaymentResponse response = paymentService.getPaymentByBookingId(testBooking.getId());

        // Assert
        assertNotNull(response);
        assertEquals(testBooking.getId(), response.getBookingId());
        assertEquals(PaymentStatus.PENDING, response.getStatus());
    }

    @Test
    void getPaymentByBookingId_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(paymentTransactionRepository.findByBookingId(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> paymentService.getPaymentByBookingId(nonExistentId));
        assertTrue(exception.getMessage().contains("Payment not found"));
    }

    @Test
    void getPaymentById_success() {
        // Arrange
        when(paymentTransactionRepository.findById(testTransaction.getId()))
                .thenReturn(Optional.of(testTransaction));

        // Act
        PaymentResponse response = paymentService.getPaymentById(testTransaction.getId());

        // Assert
        assertNotNull(response);
        assertEquals(testTransaction.getId(), response.getId());
    }

    @Test
    void getPaymentById_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(paymentTransactionRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> paymentService.getPaymentById(nonExistentId));
        assertTrue(exception.getMessage().contains("Payment not found"));
    }

    @Test
    void verifyAndUpdatePayment_alreadySuccess_returnsWithoutUpdate() throws Exception {
        // Arrange
        testTransaction.setStatus(PaymentStatus.SUCCESS);
        when(paymentTransactionRepository.findByBookingId(testBooking.getId()))
                .thenReturn(Optional.of(testTransaction));

        // Act
        PaymentResponse response = paymentService.verifyAndUpdatePayment(testBooking.getId());

        // Assert
        assertNotNull(response);
        assertEquals(PaymentStatus.SUCCESS, response.getStatus());
        verify(payOS, never()).paymentRequests();
    }

    @Test
    void verifyAndUpdatePayment_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(paymentTransactionRepository.findByBookingId(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> paymentService.verifyAndUpdatePayment(nonExistentId));
        assertTrue(exception.getMessage().contains("Payment not found"));
    }
}
