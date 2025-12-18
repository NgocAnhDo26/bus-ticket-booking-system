-- Local-only seed data for development/testing.
-- Loaded via spring profile: local (see application-local.properties).
-- Uses deterministic UUIDs and ON CONFLICT DO NOTHING for idempotency.

-- Users
INSERT INTO users (id, email, phone, password_hash, full_name, role, auth_provider, created_at, updated_at)
VALUES
    ('5d9f7d8c-0001-4e0a-91a1-000000000001', 'admin@example.com', '+84991234567', '$2a$10$2blWtfHak0whlNOYwn4yPOKpxs9AQ3k9eYRbDd5e/p4iAUnvOVJte', 'Admin Demo', 'ADMIN', 'LOCAL', now(), now()),
    ('5d9f7d8c-0001-4e0a-91a1-000000000002', 'passenger@example.com', '+84997654321', '$2a$10$8b7xOJv/Ud2W7HQwZ0pQ.O9p8HYHS3.sdh0dX8GZFODdgNpTiFqhe', 'Passenger Demo', 'PASSENGER', 'LOCAL', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Operators
INSERT INTO operators (id, name, contact_info, is_active, created_at)
VALUES
    ('af5b1d3a-0001-4c3e-9000-000000000001', 'Sunrise Express', '{"phone": "+84991234567", "email": "ops@sunrise.local"}', TRUE, now()),
    ('af5b1d3a-0001-4c3e-9000-000000000002', 'Central Lines', '{"phone": "+84993456789", "email": "hello@centrallines.local"}', TRUE, now())
ON CONFLICT (id) DO NOTHING;

-- Stations
INSERT INTO stations (id, name, city, address, created_at)
VALUES
    ('9a9c9e10-0001-4c5b-9000-000000000001', 'Ha Noi Central', 'Ha Noi', '1 Le Duan, Hoan Kiem', now()),
    ('9a9c9e10-0001-4c5b-9000-000000000002', 'Da Nang Station', 'Da Nang', '35 Nguyen Van Linh, Hai Chau', now()),
    ('9a9c9e10-0001-4c5b-9000-000000000003', 'Sai Gon Station', 'Ho Chi Minh', '268 Le Duan, District 3', now())
ON CONFLICT (id) DO NOTHING;

-- Bus layouts
INSERT INTO bus_layouts (id, name, bus_type, total_seats, total_floors, description, created_at, total_rows, total_cols)
VALUES
    ('c1a2b3c4-0001-4d5e-9000-000000000001', 'Sleeper 12 (2 floors)', 'SLEEPER', 12, 2, 'Compact 2-floor sleeper demo layout', now(), 2, 6),
    ('c1a2b3c4-0001-4d5e-9000-000000000002', 'Limousine 8', 'LIMOUSINE', 8, 1, '8-seat VIP limousine layout', now(), 4, 2)
ON CONFLICT (id) DO NOTHING;

-- Layout seats for Sleeper 12
INSERT INTO layout_seats (id, layout_id, seat_code, seat_type, floor_number, row_index, col_index, is_active)
VALUES
    ('11111111-0001-4f1f-9000-000000000001', 'c1a2b3c4-0001-4d5e-9000-000000000001', '1A', 'VIP', 1, 1, 1, TRUE),
    ('11111111-0001-4f1f-9000-000000000002', 'c1a2b3c4-0001-4d5e-9000-000000000001', '1B', 'VIP', 1, 1, 2, TRUE),
    ('11111111-0001-4f1f-9000-000000000003', 'c1a2b3c4-0001-4d5e-9000-000000000001', '2A', 'NORMAL', 1, 2, 1, TRUE),
    ('11111111-0001-4f1f-9000-000000000004', 'c1a2b3c4-0001-4d5e-9000-000000000001', '2B', 'NORMAL', 1, 2, 2, TRUE),
    ('11111111-0001-4f1f-9000-000000000005', 'c1a2b3c4-0001-4d5e-9000-000000000001', '3A', 'NORMAL', 1, 3, 1, TRUE),
    ('11111111-0001-4f1f-9000-000000000006', 'c1a2b3c4-0001-4d5e-9000-000000000001', '3B', 'NORMAL', 1, 3, 2, TRUE),
    ('11111111-0001-4f1f-9000-000000000007', 'c1a2b3c4-0001-4d5e-9000-000000000001', '4A', 'VIP', 2, 1, 1, TRUE),
    ('11111111-0001-4f1f-9000-000000000008', 'c1a2b3c4-0001-4d5e-9000-000000000001', '4B', 'VIP', 2, 1, 2, TRUE),
    ('11111111-0001-4f1f-9000-000000000009', 'c1a2b3c4-0001-4d5e-9000-000000000001', '5A', 'NORMAL', 2, 2, 1, TRUE),
    ('11111111-0001-4f1f-9000-000000000010', 'c1a2b3c4-0001-4d5e-9000-000000000001', '5B', 'NORMAL', 2, 2, 2, TRUE),
    ('11111111-0001-4f1f-9000-000000000011', 'c1a2b3c4-0001-4d5e-9000-000000000001', '6A', 'NORMAL', 2, 3, 1, TRUE),
    ('11111111-0001-4f1f-9000-000000000012', 'c1a2b3c4-0001-4d5e-9000-000000000001', '6B', 'NORMAL', 2, 3, 2, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Layout seats for Limousine 8
INSERT INTO layout_seats (id, layout_id, seat_code, seat_type, floor_number, row_index, col_index, is_active)
VALUES
    ('22222222-0001-4f1f-9000-000000000001', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'A1', 'VIP', 1, 1, 1, TRUE),
    ('22222222-0001-4f1f-9000-000000000002', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'A2', 'VIP', 1, 1, 2, TRUE),
    ('22222222-0001-4f1f-9000-000000000003', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'B1', 'VIP', 1, 2, 1, TRUE),
    ('22222222-0001-4f1f-9000-000000000004', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'B2', 'VIP', 1, 2, 2, TRUE),
    ('22222222-0001-4f1f-9000-000000000005', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'C1', 'VIP', 1, 3, 1, TRUE),
    ('22222222-0001-4f1f-9000-000000000006', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'C2', 'VIP', 1, 3, 2, TRUE),
    ('22222222-0001-4f1f-9000-000000000007', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'D1', 'VIP', 1, 4, 1, TRUE),
    ('22222222-0001-4f1f-9000-000000000008', 'c1a2b3c4-0001-4d5e-9000-000000000002', 'D2', 'VIP', 1, 4, 2, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Buses
INSERT INTO buses (id, operator_id, bus_layout_id, plate_number, amenities, is_active, created_at)
VALUES
    ('e2f3a4b5-0001-4c2d-9000-000000000001', 'af5b1d3a-0001-4c3e-9000-000000000001', 'c1a2b3c4-0001-4d5e-9000-000000000001', '29A-12345', '{"wifi": true, "usb": true, "blanket": true}', TRUE, now()),
    ('e2f3a4b5-0001-4c2d-9000-000000000002', 'af5b1d3a-0001-4c3e-9000-000000000002', 'c1a2b3c4-0001-4d5e-9000-000000000002', '43B-67890', '{"wifi": true, "water": true}', TRUE, now())
ON CONFLICT (id) DO NOTHING;

-- Routes
INSERT INTO routes (id, origin_station_id, destination_station_id, duration_minutes, distance_km, is_active, created_at)
VALUES
    ('d4e5f6a7-0001-4b3c-9000-000000000001', '9a9c9e10-0001-4c5b-9000-000000000001', '9a9c9e10-0001-4c5b-9000-000000000002', 900, 765.0, TRUE, now()),
    ('d4e5f6a7-0001-4b3c-9000-000000000002', '9a9c9e10-0001-4c5b-9000-000000000003', '9a9c9e10-0001-4c5b-9000-000000000002', 1050, 950.0, TRUE, now())
ON CONFLICT (id) DO NOTHING;

-- Trips (relative to current date for freshness)
INSERT INTO trips (id, route_id, bus_id, departure_time, arrival_time, status, created_at)
VALUES
    (
        'f7a8b9c0-0001-493a-9000-000000000001',
        'd4e5f6a7-0001-4b3c-9000-000000000001',
        'e2f3a4b5-0001-4c2d-9000-000000000001',
        date_trunc('day', now()) + interval '1 day' + make_interval(hours => 8),
        date_trunc('day', now()) + interval '1 day' + make_interval(hours => 23),
        'SCHEDULED',
        now()
    ),
    (
        'f7a8b9c0-0001-493a-9000-000000000002',
        'd4e5f6a7-0001-4b3c-9000-000000000002',
        'e2f3a4b5-0001-4c2d-9000-000000000002',
        date_trunc('day', now()) + interval '2 day' + make_interval(hours => 7),
        date_trunc('day', now()) + interval '2 day' + make_interval(hours => 23),
        'SCHEDULED',
        now()
    )
ON CONFLICT (id) DO NOTHING;

-- Trip pricing
INSERT INTO trip_pricing (id, trip_id, seat_type, price)
VALUES
    ('77777777-0001-4abc-9000-000000000001', 'f7a8b9c0-0001-493a-9000-000000000001', 'NORMAL', 350000),
    ('77777777-0001-4abc-9000-000000000002', 'f7a8b9c0-0001-493a-9000-000000000001', 'VIP', 500000),
    ('77777777-0001-4abc-9000-000000000003', 'f7a8b9c0-0001-493a-9000-000000000002', 'VIP', 600000)
ON CONFLICT (id) DO NOTHING;

-- Booking and tickets
INSERT INTO bookings (id, trip_id, user_id, total_price, status, passenger_name, passenger_phone, created_at, updated_at)
VALUES
    ('a111b222-0001-4c3d-9000-000000000001', 'f7a8b9c0-0001-493a-9000-000000000001', '5d9f7d8c-0001-4e0a-91a1-000000000002', 850000, 'CONFIRMED', 'Nguyen Van A', '+84991231231', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO tickets (id, booking_id, seat_code, price, passenger_name, passenger_phone)
VALUES
    ('b222c333-0001-4d4e-9000-000000000001', 'a111b222-0001-4c3d-9000-000000000001', '1A', 500000, 'Nguyen Van A', '+84991231231'),
    ('b222c333-0001-4d4e-9000-000000000002', 'a111b222-0001-4c3d-9000-000000000001', '2B', 350000, 'Tran Thi B', '+84993453453')
ON CONFLICT (id) DO NOTHING;

-- Payment for the booking
INSERT INTO payments (id, booking_id, amount, payment_method, transaction_ref, status, payment_time)
VALUES
    ('c333d444-0001-4e5f-9000-000000000001', 'a111b222-0001-4c3d-9000-000000000001', 850000, 'CASH', 'LOCAL-DEMO-001', 'SUCCESS', now())
ON CONFLICT (id) DO NOTHING;

