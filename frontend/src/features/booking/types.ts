import type { SeatType } from '@/features/catalog/types';
import type {
  LockSeatRequest as ApiLockSeatRequest,
  TicketRequest as ApiTicketRequest,
} from '@/model';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

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
  pickupTripPoint?: { // Added
    id: string;
    scheduledTime: string;
    actualTime?: string;
    surcharge: number;
  };
  dropoffTripPoint?: { // Added
    id: string;
    scheduledTime: string;
    actualTime?: string;
    surcharge: number;
  };
};

// Prefer OpenAPI/Orval request models as the source of truth.
export type TicketRequest = ApiTicketRequest;

export type CreateBookingRequest = {
  tripId: string;
  userId?: string; // Optional for guests
  passengerName: string;
  passengerPhone: string;
  passengerIdNumber?: string;
  passengerEmail?: string; // For guests to receive tickets
  pickupStationId?: string;
  dropoffStationId?: string;
  totalPrice: number;
  tickets: (TicketRequest & { passengerIdNumber?: string })[];
};

export type UpdateBookingRequest = {
  passengerName: string;
  passengerPhone: string;
  passengerIdNumber?: string;
  passengerEmail?: string;
  tickets?: (TicketRequest & { passengerIdNumber?: string })[];
};

export type PassengerInfo = {
  seatCode: string;
  seatType: SeatType;
  passengerName: string;
  passengerPhone: string;
  price: number;
};

// Teammate's seat locking types
export type SeatStatus = 'LOCKED' | 'AVAILABLE' | 'BOOKED';

export type SeatStatusMessage = {
  seatCode: string;
  status: SeatStatus;
  lockedByUserId?: string;
};

// Prefer OpenAPI/Orval request models as the source of truth.
export type LockSeatRequest = ApiLockSeatRequest;
