-- Payment transactions table to track PayOS payment requests
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    order_code BIGINT UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    payment_link_id VARCHAR(100),
    checkout_url TEXT,
    qr_code TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Webhook events log for audit and idempotency
CREATE TABLE payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code BIGINT NOT NULL,
    event_type VARCHAR(50),
    payload TEXT,
    status VARCHAR(20) NOT NULL,
    processed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_payment_transactions_booking_id ON payment_transactions(booking_id);
CREATE INDEX idx_payment_transactions_order_code ON payment_transactions(order_code);
CREATE INDEX idx_payment_webhook_events_order_code ON payment_webhook_events(order_code);
