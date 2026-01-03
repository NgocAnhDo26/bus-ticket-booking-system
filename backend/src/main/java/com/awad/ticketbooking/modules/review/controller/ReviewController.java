package com.awad.ticketbooking.modules.review.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.review.dto.CreateReviewRequest;
import com.awad.ticketbooking.modules.review.dto.OperatorStatsResponse;
import com.awad.ticketbooking.modules.review.dto.ReviewResponse;
import com.awad.ticketbooking.modules.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Endpoints for creating and viewing trip reviews.")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    @PreAuthorize("hasRole('PASSENGER')")
    @Operation(summary = "Create review", description = "Creates a new review for a completed trip. User must own the booking, trip must be COMPLETED, and booking must be CONFIRMED.")
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal ApplicationUserDetails principal) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        ReviewResponse response = reviewService.createReview(request, principal.getUser().getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/operator/{operatorId}")
    @Operation(summary = "Get reviews by operator", description = "Returns a paginated list of reviews for a specific bus operator.")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getReviewsByOperator(
            @PathVariable UUID operatorId,
            Pageable pageable) {
        Page<ReviewResponse> reviews = reviewService.getReviewsByOperator(operatorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/operator/{operatorId}/stats")
    @Operation(summary = "Get operator stats", description = "Returns the average rating and total review count for a specific bus operator.")
    public ResponseEntity<ApiResponse<OperatorStatsResponse>> getOperatorStats(
            @PathVariable UUID operatorId) {
        OperatorStatsResponse stats = reviewService.getOperatorStats(operatorId);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get review by booking ID", description = "Returns the review for a specific booking if it exists.")
    public ResponseEntity<ApiResponse<ReviewResponse>> getReviewByBookingId(
            @PathVariable UUID bookingId) {
        ReviewResponse review = reviewService.getReviewByBookingId(bookingId);
        if (review == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(404, "Review not found", null));
        }
        return ResponseEntity.ok(ApiResponse.success(review));
    }
}
