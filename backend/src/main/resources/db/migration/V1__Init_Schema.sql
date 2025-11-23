-- 1. Enable UUID extension (Required for generating UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define ENUMs (Custom types for strictly typed data)
CREATE TYPE user_role AS ENUM ('PASSENGER', 'ADMIN');
CREATE TYPE auth_provider AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
CREATE TYPE seat_type AS ENUM ('NORMAL', 'VIP', 'SLEEPER');
CREATE TYPE trip_status AS ENUM ('SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');
CREATE TYPE payment_method AS ENUM ('MOMO', 'ZALOPAY', 'CREDIT_CARD', 'CASH');
CREATE TYPE payment_status AS ENUM ('SUCCESS', 'FAILED', 'PENDING');
CREATE TYPE notification_type AS ENUM ('BOOKING_SUCCESS', 'TRIP_UPDATE', 'PROMOTION');

-- 3. Create Tables

-- ==========================================
-- IDENTITY MODULE
-- ==========================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE, -- Nullable if user login via phone only (future proof)
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255), -- Nullable for OAuth users
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'PASSENGER',
    auth_provider auth_provider NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(255), -- Stores Google/FB UID
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CATALOG & FLEET MODULE
-- ==========================================

CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_info JSONB, -- Ex: {"phone": "...", "email": "...", "website": "..."}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    amenities JSONB, -- Ex: {"wifi": true, "usb": true, "blanket": true}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL, -- Ex: A01, B05
    type seat_type NOT NULL DEFAULT 'NORMAL',
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(bus_id, seat_code) -- Prevent duplicate seat codes in one bus
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_station_id UUID NOT NULL REFERENCES stations(id),
    destination_station_id UUID NOT NULL REFERENCES stations(id),
    duration_minutes INT,
    distance_km DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TRIP & PRICING MODULE
-- ==========================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id),
    bus_id UUID NOT NULL REFERENCES buses(id),
    departure_time TIMESTAMPTZ NOT NULL,
    arrival_time TIMESTAMPTZ NOT NULL,
    status trip_status NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_arrival_time CHECK (arrival_time > departure_time)
);

CREATE TABLE trip_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_type seat_type NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    
    UNIQUE(trip_id, seat_type) -- One price per seat type per trip
);

-- ==========================================
-- BOOKING & PAYMENT MODULE
-- ==========================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for guest booking
    trip_id UUID NOT NULL REFERENCES trips(id),
    booking_code VARCHAR(20) NOT NULL UNIQUE, -- Human readable code like #BK123456
    total_amount DECIMAL(15, 2) NOT NULL,
    status booking_status NOT NULL DEFAULT 'PENDING',
    
    -- Guest contact info (if user_id is null)
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    booked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id),
    trip_id UUID NOT NULL REFERENCES trips(id), -- Denormalized for faster querying & constraint
    price DECIMAL(15, 2) NOT NULL, -- Actual price at booking time
    passenger_name VARCHAR(100),
    
    -- CRITICAL: Prevent double booking at DB level (Final defense line after Redis)
    UNIQUE(trip_id, seat_id) 
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    transaction_ref VARCHAR(255), -- Reference ID from MoMo/ZaloPay
    status payment_status NOT NULL DEFAULT 'PENDING',
    payment_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- SUPPORT MODULE
-- ==========================================

CREATE TABLE feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(booking_id) -- One feedback per booking
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Indexes for Performance
CREATE INDEX idx_trips_departure ON trips(departure_time);
CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_routes_origin_dest ON routes(origin_station_id, destination_station_id);