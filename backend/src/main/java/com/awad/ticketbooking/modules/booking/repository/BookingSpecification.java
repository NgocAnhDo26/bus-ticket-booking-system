package com.awad.ticketbooking.modules.booking.repository;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class BookingSpecification {

    public static Specification<Booking> withFilters(String search, List<BookingStatus> statuses, Instant startDate,
            Instant endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Search by code, passenger name, phone, or email
            if (search != null && !search.trim().isEmpty()) {
                String unknownSearch = "%" + search.toLowerCase() + "%";
                Predicate code = criteriaBuilder.like(criteriaBuilder.lower(root.get("code")), unknownSearch);
                Predicate name = criteriaBuilder.like(criteriaBuilder.lower(root.get("passengerName")), unknownSearch);
                Predicate phone = criteriaBuilder.like(criteriaBuilder.lower(root.get("passengerPhone")),
                        unknownSearch);
                Predicate email = criteriaBuilder.like(criteriaBuilder.lower(root.get("passengerEmail")),
                        unknownSearch);

                predicates.add(criteriaBuilder.or(code, name, phone, email));
            }

            // Filter by status
            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }

            // Filter by date range (createdAt)
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
