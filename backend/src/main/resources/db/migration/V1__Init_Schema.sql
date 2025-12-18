-- 1. Enable UUID extension (Required for generating UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Define ENUMs (Custom types for strictly typed data)
CREATE TYPE user_role AS ENUM ('PASSENGER', 'ADMIN');
CREATE TYPE auth_provider AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');
CREATE TYPE bus_type AS ENUM ('NORMAL', 'SLEEPER', 'LIMOUSINE');
CREATE TYPE seat_type AS ENUM ('NORMAL', 'VIP');
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'MAINTENANCE', 'LOCKED');
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

-- ==========================================
-- LAYOUT & SEAT MAP MODULE (NEW)
-- ==========================================

-- Bảng định nghĩa khuôn mẫu sơ đồ (Ví dụ: "Limousine 34 phòng", "Giường nằm 40 chỗ")
CREATE TABLE bus_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- Tên layout để admin dễ chọn
    bus_type bus_type NOT NULL, -- Loại xe áp dụng layout này
    total_seats INT NOT NULL,
    total_floors INT DEFAULT 1, -- 1 tầng hoặc 2 tầng
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bảng định nghĩa vị trí từng ghế trong Layout
-- Bảng này giúp Frontend vẽ được sơ đồ (Matrix/Grid)
CREATE TABLE layout_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    layout_id UUID NOT NULL REFERENCES bus_layouts(id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL, -- Ví dụ: A01, B02
    seat_type seat_type NOT NULL DEFAULT 'NORMAL', -- VIP/NORMAL/SLEEPER (để tính giá)
    
    -- Các trường tọa độ để vẽ UI
    floor_number INT DEFAULT 1 CHECK (floor_number IN (1, 2)), -- Tầng 1 hoặc 2
    row_index INT NOT NULL, -- Hàng thứ mấy (để render grid)
    col_index INT NOT NULL, -- Cột thứ mấy (để render grid)
    
    is_active BOOLEAN DEFAULT TRUE, -- Có thể tạm khóa ghế này nếu bị hỏng vĩnh viễn
    
    UNIQUE(layout_id, seat_code), -- Trong 1 layout không được trùng mã ghế
    UNIQUE(layout_id, floor_number, row_index, col_index) -- Không được trùng tọa độ
);

-- ==========================================
-- CATALOG & FLEET MODULE (UPDATED)
-- ==========================================

CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    bus_layout_id UUID NOT NULL REFERENCES bus_layouts(id), -- Map xe với Layout
    plate_number VARCHAR(20) NOT NULL UNIQUE,
    amenities JSONB, -- Ex: {"wifi": true, "usb": true, "blanket": true}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
    trip_id UUID NOT NULL REFERENCES trips(id),
    user_id UUID NOT NULL REFERENCES users(id),
    total_price DECIMAL(15, 2) NOT NULL,
    status booking_status NOT NULL DEFAULT 'PENDING',
    passenger_name VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Tickets: Chi tiết từng ghế trong 1 booking
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_code VARCHAR(10) NOT NULL, -- Lưu cứng mã ghế (A01) tại thời điểm đặt
    price DECIMAL(15, 2) NOT NULL -- Giá vé tại thời điểm đặt
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