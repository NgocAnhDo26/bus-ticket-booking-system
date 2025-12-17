export type { CreateStationRequest } from '@/model';
export type { CreateTripRequest as OrvalCreateTripRequest, PricingRequest as OrvalPricingRequest } from '@/model';

export type Station = {
  id: string;
  name: string;
  city: string;
  address: string;
  createdAt: string;
};

export type Operator = {
  id: string;
  name: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  isActive: boolean;
  createdAt: string;
};

export type CreateOperatorRequest = {
  name: string;
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  isActive?: boolean;
};

export type Bus = {
  id: string;
  operator: Operator;
  plateNumber: string;
  busLayout: {
    id: string;
    name: string;
    busType: string;
    totalSeats: number;
    totalFloors: number;
    description?: string;
  };
  amenities: string[];
  isActive: boolean;
  createdAt: string;
};

export type CreateBusRequest = {
  operatorId: string;
  busLayoutId: string;
  plateNumber: string;
  amenities: string[];
  isActive?: boolean;
};

export type Route = {
  id: string;
  originStation: Station;
  destinationStation: Station;
  durationMinutes: number;
  distanceKm: number;
  isActive: boolean;
  createdAt: string;
};

export type CreateRouteRequest = {
  originStationId: string;
  destinationStationId: string;
  durationMinutes: number;
  distanceKm: number;
};

export const SeatType = {
  NORMAL: 'NORMAL',
  VIP: 'VIP',
} as const;

export type SeatType = (typeof SeatType)[keyof typeof SeatType];

export type PricingRequest = {
  // Deprecated: kept for source compatibility; prefer the OpenAPI type below.
  seatType: SeatType;
  price: number;
};

export type TripPricing = {
  id: string;
  seatType: SeatType;
  price: number;
};

export type BusInfo = {
  id: string;
  plateNumber: string;
  operator: {
    id: string;
    name: string;
  };
  totalSeats: number;
  busLayoutId: string;
  amenities: string[];
};

export type Trip = {
  id: string;
  route: Route;
  bus: BusInfo;
  departureTime: string;
  arrivalTime: string;
  status: string;
  tripPricings: TripPricing[];
  createdAt: string;
};

export type CreateTripRequest = {
  // Deprecated: kept for source compatibility; prefer the OpenAPI type below.
  routeId: string;
  busId: string;
  departureTime: string;
  arrivalTime: string;
  pricings: PricingRequest[];
};

export type SearchTripRequest = {
  origin?: string;
  destination?: string;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  minTime?: string;
  maxTime?: string;
  amenities?: string[];
  operatorIds?: string[];
  seatType?: SeatType;
  sortBy?: string;
  page?: number;
  size?: number;
};
