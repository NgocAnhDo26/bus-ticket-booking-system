-- Cập nhật bảng route_stops để làm template chuẩn hơn
ALTER TABLE route_stops
    ADD COLUMN IF NOT EXISTS default_surcharge DECIMAL(15, 2) DEFAULT 0;

-- Tạo bảng trip_schedules (Quản lý lịch chạy lặp lại)
CREATE TABLE trip_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id),
    bus_id UUID NOT NULL REFERENCES buses(id), -- Xe mặc định sẽ chạy
    
    -- Cấu hình thời gian
    departure_time TIME NOT NULL, -- Chỉ lưu giờ (VD: 08:00:00), không lưu ngày
    frequency VARCHAR(50), -- VD: 'DAILY', 'MON,WED,FRI', 'WEEKEND'
    
    -- Hiệu lực của lịch này
    start_date DATE NOT NULL,
    end_date DATE, -- Null nghĩa là chạy vô thời hạn
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cập nhật bảng trips (Liên kết với Schedule)
ALTER TABLE trips
    ADD COLUMN trip_schedule_id UUID REFERENCES trip_schedules(id);

-- Tạo bảng trip_points (Điểm dừng thực tế - Quan trọng nhất)
CREATE TABLE trip_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES stations(id), -- Điểm dừng vật lý
    route_stop_id UUID REFERENCES route_stops(id), -- Tham chiếu ngược về template (nếu cần)
    
    point_order INT NOT NULL, -- Thứ tự: 1, 2, 3 (Copy từ route_stops)
    point_type VARCHAR(20) NOT NULL, -- 'PICKUP', 'DROPOFF', 'BOTH'
    
    -- QUAN TRỌNG: Dữ liệu vận hành thực tế
    scheduled_time TIMESTAMPTZ NOT NULL, -- Giờ đến dự kiến (Tính toán = Trip Departure + Offset)
    actual_time TIMESTAMPTZ, -- Giờ đến thực tế (cập nhật khi xe chạy - realtime tracking)
    
    surcharge DECIMAL(15, 2) DEFAULT 0, -- Giá phụ thu tại thời điểm này
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(trip_id, station_id, point_type) -- Một chuyến không nên có 2 điểm đón trùng nhau tại 1 trạm
);

-- Index để tìm chuyến theo giờ đón nhanh hơn
CREATE INDEX idx_trip_points_time ON trip_points(station_id, scheduled_time);

-- Cập nhật bookings (Trỏ vào Trip Points thay vì Station)
ALTER TABLE bookings
    ADD COLUMN pickup_trip_point_id UUID REFERENCES trip_points(id),
    ADD COLUMN dropoff_trip_point_id UUID REFERENCES trip_points(id);
