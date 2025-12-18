package com.awad.ticketbooking.modules.payment.repository;

import com.awad.ticketbooking.modules.payment.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {

    Optional<PaymentTransaction> findByOrderCode(Long orderCode);

    Optional<PaymentTransaction> findByBookingId(UUID bookingId);

    boolean existsByOrderCode(Long orderCode);
}
