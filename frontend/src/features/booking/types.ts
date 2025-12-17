import type { SeatType } from '@/features/catalog/types';
import type {
  CreateBookingRequest as ApiCreateBookingRequest,
  LockSeatRequest as ApiLockSeatRequest,
  TicketRequest as ApiTicketRequest,
} from '@/model';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

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
  code: string;
  status: BookingStatus;
  totalPrice: number;
  passengerName: string;
  passengerPhone: string;
  createdAt: string;
  updatedAt: string;
  trip: TripInfo;
  tickets: TicketInfo[];
};

// Prefer OpenAPI/Orval request models as the source of truth.
export type TicketRequest = ApiTicketRequest;

// Prefer OpenAPI/Orval request models as the source of truth.
export type CreateBookingRequest = ApiCreateBookingRequest;

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
