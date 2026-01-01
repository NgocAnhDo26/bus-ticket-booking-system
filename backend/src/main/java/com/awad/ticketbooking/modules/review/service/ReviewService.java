package com.awad.ticketbooking.modules.review.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.enums.TripStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.review.dto.CreateReviewRequest;
import com.awad.ticketbooking.modules.review.dto.ReviewResponse;
import com.awad.ticketbooking.modules.review.entity.Review;
import com.awad.ticketbooking.modules.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, UUID userId) {
        // Find booking
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Validate booking belongs to user
        if (booking.getUser() == null || !booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Booking does not belong to the user");
        }

        // Validate trip is COMPLETED
        if (booking.getTrip().getStatus() != TripStatus.COMPLETED) {
            throw new RuntimeException("Cannot review a trip that is not completed");
        }

        // Validate booking is CONFIRMED
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new RuntimeException("Cannot review a booking that is not confirmed");
        }

        // Check if review already exists
        if (reviewRepository.findByBookingId(request.getBookingId()).isPresent()) {
            throw new RuntimeException("Review already exists for this booking");
        }

        // Create review
        Review review = new Review();
        review.setBooking(booking);
        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review savedReview = reviewRepository.save(review);
        return mapToResponse(savedReview);
    }

    public Page<ReviewResponse> getReviewsByOperator(UUID operatorId, Pageable pageable) {
        Page<Review> reviews = reviewRepository.findByOperatorIdWithRouteInfo(operatorId, pageable);
        return reviews.map(this::mapToResponse);
    }

    public ReviewResponse getReviewByBookingId(UUID bookingId) {
        return reviewRepository.findByBookingId(bookingId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    private ReviewResponse mapToResponse(Review review) {
        Booking booking = review.getBooking();
        var trip = booking.getTrip();
        var route = trip.getRoute();
        var user = booking.getUser();

        return ReviewResponse.builder()
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .user(ReviewResponse.UserInfo.builder()
                        .name(user != null ? user.getFullName() : booking.getPassengerName())
                        .avatarUrl(user != null ? user.getAvatarUrl() : null)
                        .build())
                .route(ReviewResponse.RouteInfo.builder()
                        .originCity(route.getOriginStation().getCity())
                        .destinationCity(route.getDestinationStation().getCity())
                        .build())
                .tripDate(trip.getDepartureTime())
                .build();
    }
}
