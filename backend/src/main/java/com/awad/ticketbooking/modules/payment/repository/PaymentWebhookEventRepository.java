package com.awad.ticketbooking.modules.payment.repository;

import com.awad.ticketbooking.modules.payment.entity.PaymentWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, UUID> {

    List<PaymentWebhookEvent> findByOrderCode(Long orderCode);

    boolean existsByOrderCodeAndStatus(Long orderCode, String status);
}
