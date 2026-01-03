package com.awad.ticketbooking.modules.review.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.enums.TripStatus;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.review.dto.CreateReviewRequest;
import com.awad.ticketbooking.modules.review.dto.OperatorStatsResponse;
import com.awad.ticketbooking.modules.review.dto.ReviewResponse;
import com.awad.ticketbooking.modules.review.entity.Review;
import com.awad.ticketbooking.modules.review.repository.ReviewRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReviewServiceTest {

    @InjectMocks
    private ReviewService reviewService;

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private BookingRepository bookingRepository;

    private Booking testBooking;
    private User testUser;
    private Trip testTrip;
    private Review testReview;
    private UUID operatorId;

    @BeforeEach
    void setUp() {
        operatorId = UUID.randomUUID();

        // Setup stations
        Station originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi");
        originStation.setCity("Hanoi");

        Station destStation = new Station();
        destStation.setId(UUID.randomUUID());
        destStation.setName("Saigon");
        destStation.setCity("Saigon");

        // Setup route
        Route route = new Route();
        route.setId(UUID.randomUUID());
        route.setOriginStation(originStation);
        route.setDestinationStation(destStation);

        // Setup user
        testUser = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .build();
        testUser.setId(UUID.randomUUID());

        // Setup trip
        testTrip = new Trip();
        testTrip.setId(UUID.randomUUID());
        testTrip.setRoute(route);
        testTrip.setStatus(TripStatus.COMPLETED);
        testTrip.setDepartureTime(Instant.now().minusSeconds(86400));

        // Setup booking
        testBooking = new Booking();
        testBooking.setId(UUID.randomUUID());
        testBooking.setCode("BK-ABC123");
        testBooking.setTrip(testTrip);
        testBooking.setUser(testUser);
        testBooking.setPassengerName("Test Passenger");
        testBooking.setStatus(BookingStatus.CONFIRMED);

        // Setup review
        testReview = new Review();
        testReview.setId(UUID.randomUUID());
        testReview.setBooking(testBooking);
        testReview.setRating(5);
        testReview.setComment("Great service!");
        testReview.setCreatedAt(Instant.now());
    }

    @Test
    void createReview_success() {
        // Arrange
        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(5);
        request.setComment("Great service!");

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(reviewRepository.findByBookingId(testBooking.getId())).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenReturn(testReview);

        // Act
        ReviewResponse response = reviewService.createReview(request, testUser.getId());

        // Assert
        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Great service!", response.getComment());
        verify(reviewRepository).save(any(Review.class));
    }

    @Test
    void createReview_bookingNotFound_throwsException() {
        // Arrange
        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(UUID.randomUUID());

        when(bookingRepository.findById(request.getBookingId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(request, testUser.getId()));
        assertEquals("Booking not found", exception.getMessage());
    }

    @Test
    void createReview_bookingNotBelongToUser_throwsException() {
        // Arrange
        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(testBooking.getId());

        UUID differentUserId = UUID.randomUUID();

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(request, differentUserId));
        assertEquals("Booking does not belong to the user", exception.getMessage());
    }

    @Test
    void createReview_tripNotCompleted_throwsException() {
        // Arrange
        testTrip.setStatus(TripStatus.RUNNING);

        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(testBooking.getId());

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(request, testUser.getId()));
        assertEquals("Cannot review a trip that is not completed", exception.getMessage());
    }

    @Test
    void createReview_bookingNotConfirmed_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.PENDING);

        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(testBooking.getId());

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(request, testUser.getId()));
        assertEquals("Cannot review a booking that is not confirmed", exception.getMessage());
    }

    @Test
    void createReview_alreadyExists_throwsException() {
        // Arrange
        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(testBooking.getId());

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(reviewRepository.findByBookingId(testBooking.getId())).thenReturn(Optional.of(testReview));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(request, testUser.getId()));
        assertEquals("Review already exists for this booking", exception.getMessage());
    }

    @Test
    void getReviewsByOperator_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Review> page = new PageImpl<>(Collections.singletonList(testReview));

        when(reviewRepository.findByOperatorIdWithRouteInfo(operatorId, pageable)).thenReturn(page);

        // Act
        Page<ReviewResponse> response = reviewService.getReviewsByOperator(operatorId, pageable);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(5, response.getContent().get(0).getRating());
    }

    @Test
    void getReviewByBookingId_found_success() {
        // Arrange
        when(reviewRepository.findByBookingId(testBooking.getId())).thenReturn(Optional.of(testReview));

        // Act
        ReviewResponse response = reviewService.getReviewByBookingId(testBooking.getId());

        // Assert
        assertNotNull(response);
        assertEquals(5, response.getRating());
        assertEquals("Great service!", response.getComment());
    }

    @Test
    void getReviewByBookingId_notFound_returnsNull() {
        // Arrange
        when(reviewRepository.findByBookingId(testBooking.getId())).thenReturn(Optional.empty());

        // Act
        ReviewResponse response = reviewService.getReviewByBookingId(testBooking.getId());

        // Assert
        assertNull(response);
    }

    @Test
    void getOperatorStats_success() {
        // Arrange
        when(reviewRepository.findAverageRatingByOperatorId(operatorId)).thenReturn(4.5);
        when(reviewRepository.countByOperatorId(operatorId)).thenReturn(10L);

        // Act
        OperatorStatsResponse response = reviewService.getOperatorStats(operatorId);

        // Assert
        assertNotNull(response);
        assertEquals(4.5, response.getAverageRating());
        assertEquals(10L, response.getTotalReviews());
    }

    @Test
    void getOperatorStats_noReviews_returnsDefaults() {
        // Arrange
        when(reviewRepository.findAverageRatingByOperatorId(operatorId)).thenReturn(null);
        when(reviewRepository.countByOperatorId(operatorId)).thenReturn(null);

        // Act
        OperatorStatsResponse response = reviewService.getOperatorStats(operatorId);

        // Assert
        assertNotNull(response);
        assertNull(response.getAverageRating());
        assertEquals(0L, response.getTotalReviews());
    }

    @Test
    void createReview_guestBooking_throwsException() {
        // Arrange
        testBooking.setUser(null); // Guest booking

        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(testBooking.getId());

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> reviewService.createReview(request, testUser.getId()));
        assertEquals("Booking does not belong to the user", exception.getMessage());
    }
}
