-- Create bus_photos table for storing bus images
CREATE TABLE bus_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    public_id VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for query performance
CREATE INDEX idx_bus_photos_bus_id ON bus_photos(bus_id);
CREATE INDEX idx_bus_photos_bus_id_display_order ON bus_photos(bus_id, display_order);
