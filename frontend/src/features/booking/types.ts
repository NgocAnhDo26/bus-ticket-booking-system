import type { SeatType } from "@/features/catalog/types";

export type BookingStatus = "PENDING" | "CONFIRMED" | "PAID" | "PAYMENT_FAILED" | "CANCELLED" | "REFUNDED";

export type TicketInfo = {
    id: string;
    seatCode: string;
    passengerName: string;
    passengerPhone: string;
    price: number;
};

export type StationInfo = {
    id: string;
    name: string;
    city: string;
    address: string;
};

export type RouteInfo = {
    id: string;
    originStation: StationInfo;
    destinationStation: StationInfo;
    durationMinutes: number;
};

export type BusInfo = {
    id: string;
    plateNumber: string;
    operatorName: string;
    busLayoutId: string;
    amenities: string[];
};

export type TripInfo = {
    id: string;
    departureTime: string;
    arrivalTime: string;
    route: RouteInfo;
    bus: BusInfo;
};

export type BookingResponse = {
    id: string;
    code: string;
    status: BookingStatus;
    totalPrice: number;
    passengerName: string;
    passengerPhone: string;
    createdAt: string;
    updatedAt: string;
    trip: TripInfo;
    tickets: TicketInfo[];
    pickupStation?: StationInfo;
    dropoffStation?: StationInfo;
};

export type TicketRequest = {
    seatCode: string;
    passengerName: string;
    passengerPhone: string;
    price: number;
};

export type CreateBookingRequest = {
    tripId: string;
    userId?: string; // Optional for guests
    passengerName: string;
    passengerPhone: string;
    passengerEmail?: string; // For guests to receive tickets
    pickupStationId?: string;
    dropoffStationId?: string;
    totalPrice: number;
    tickets: TicketRequest[];
};


export type UpdateBookingRequest = {
    passengerName: string;
    passengerPhone: string;
    passengerEmail?: string;
    tickets?: TicketRequest[];
};

export type PassengerInfo = {
    seatCode: string;
    seatType: SeatType;
    passengerName: string;
    passengerPhone: string;
    price: number;
};

// Teammate's seat locking types
export type SeatStatus = "LOCKED" | "AVAILABLE" | "BOOKED";

export type SeatStatusMessage = {
    seatCode: string;
    status: SeatStatus;
    lockedByUserId?: string;
};

export type LockSeatRequest = {
    tripId: string;
    seatCode: string;
    guestId?: string;
};
