import type { SeatType } from "@/features/catalog/types";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

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
    status: BookingStatus;
    totalPrice: number;
    passengerName: string;
    passengerPhone: string;
    createdAt: string;
    updatedAt: string;
    trip: TripInfo;
    tickets: TicketInfo[];
};

export type TicketRequest = {
    seatCode: string;
    passengerName: string;
    passengerPhone: string;
    price: number;
};

export type CreateBookingRequest = {
    tripId: string;
    userId: string;
    passengerName: string;
    passengerPhone: string;
    totalPrice: number;
    tickets: TicketRequest[];
};

export type PassengerInfo = {
    seatCode: string;
    seatType: SeatType;
    passengerName: string;
    passengerPhone: string;
    price: number;
};
