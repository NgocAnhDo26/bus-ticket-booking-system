package com.awad.ticketbooking.modules.review.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.review.dto.CreateReviewRequest;
import com.awad.ticketbooking.modules.review.dto.OperatorStatsResponse;
import com.awad.ticketbooking.modules.review.dto.ReviewResponse;
import com.awad.ticketbooking.modules.review.service.ReviewService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ReviewControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ReviewService reviewService;

    @InjectMocks
    private ReviewController reviewController;

    private ObjectMapper objectMapper;
    private ReviewResponse mockReviewResponse;
    private User testUser;
    private ApplicationUserDetails userDetails;

    @BeforeEach
    void setUp() {
        PageableHandlerMethodArgumentResolver pageableResolver = new PageableHandlerMethodArgumentResolver();
        pageableResolver.setFallbackPageable(PageRequest.of(0, 20));
        AuthenticationPrincipalArgumentResolver authResolver = new AuthenticationPrincipalArgumentResolver();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        objectMapper.disable(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        org.springframework.http.converter.json.MappingJackson2HttpMessageConverter converter = 
                new org.springframework.http.converter.json.MappingJackson2HttpMessageConverter(objectMapper);
        mockMvc = MockMvcBuilders.standaloneSetup(reviewController)
                .setCustomArgumentResolvers(pageableResolver, authResolver)
                .setMessageConverters(converter)
                .build();

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.PASSENGER);
        userDetails = new ApplicationUserDetails(testUser);

        mockReviewResponse = ReviewResponse.builder()
                .id(UUID.randomUUID())
                .rating(5)
                .comment("Great trip!")
                .build();
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
    void createReview_success() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            CreateReviewRequest request = new CreateReviewRequest();
            request.setBookingId(UUID.randomUUID());
            request.setRating(5);
            request.setComment("Great trip!");
            when(reviewService.createReview(any(CreateReviewRequest.class), any(UUID.class)))
                    .thenReturn(mockReviewResponse);

            // Act & Assert
            mockMvc.perform(post("/api/reviews")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.rating").value(5));

            verify(reviewService).createReview(any(CreateReviewRequest.class), any(UUID.class));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void createReview_unauthorized() throws Exception {
        // Arrange
        CreateReviewRequest request = new CreateReviewRequest();
        request.setBookingId(UUID.randomUUID());
        request.setRating(5);

        // Act & Assert
        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getReviewsByOperator_success() throws Exception {
        // Arrange
        UUID operatorId = UUID.randomUUID();
        Page<ReviewResponse> page = new PageImpl<>(Arrays.asList(mockReviewResponse), PageRequest.of(0, 10), 1);
        when(reviewService.getReviewsByOperator(operatorId, PageRequest.of(0, 10)))
                .thenReturn(page);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/operator/{operatorId}", operatorId)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].rating").value(5));

        verify(reviewService).getReviewsByOperator(eq(operatorId), any());
    }

    @Test
    void getOperatorStats_success() throws Exception {
        // Arrange
        UUID operatorId = UUID.randomUUID();
        OperatorStatsResponse stats = OperatorStatsResponse.builder()
                .averageRating(4.5)
                .totalReviews(10L)
                .build();
        when(reviewService.getOperatorStats(operatorId)).thenReturn(stats);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/operator/{operatorId}/stats", operatorId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.averageRating").value(4.5))
                .andExpect(jsonPath("$.data.totalReviews").value(10));

        verify(reviewService).getOperatorStats(operatorId);
    }

    @Test
    void getReviewByBookingId_success() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        when(reviewService.getReviewByBookingId(bookingId)).thenReturn(mockReviewResponse);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/booking/{bookingId}", bookingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rating").value(5));

        verify(reviewService).getReviewByBookingId(bookingId);
    }

    @Test
    void getReviewByBookingId_notFound() throws Exception {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        when(reviewService.getReviewByBookingId(bookingId)).thenReturn(null);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/booking/{bookingId}", bookingId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        verify(reviewService).getReviewByBookingId(bookingId);
    }
}
