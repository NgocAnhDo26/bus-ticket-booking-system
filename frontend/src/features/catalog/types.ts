export type { CreateStationRequest } from '@/model';
export type {
  CreateTripRequest as OrvalCreateTripRequest,
  PricingRequest as OrvalPricingRequest,
} from '@/model';

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

export type BusLayout = {
  id: string;
  name: string;
  busType: string;
  totalSeats: number;
  totalFloors: number;
  description?: string;
  layoutMatrix?: { rows: unknown[]; totalRows: number; totalCols: number }; // Optional for full details
};

export type Bus = {
  id: string;
  operator: Operator;
  plateNumber: string;
  busLayout: BusLayout;
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

export type TripSchedule = {
  id: string;
  departureTime: string; // "HH:mm:ss"
  frequency?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
};

export type TripPoint = {
  id: string;
  station: Station;
  scheduledTime: string; // ISO timestamp
  actualTime?: string; // ISO timestamp
  surcharge: number;
  pointOrder: number;
  pointType: 'PICKUP' | 'DROPOFF' | 'BOTH';
};

export type Route = {
  id: string;
  originStation: Station;
  destinationStation: Station;
  durationMinutes: number;
  distanceKm: number;
  isActive: boolean;
  createdAt: string;
  stops: {
    id: string;
    station?: Station;
    customName?: string;
    customAddress?: string;
    stopOrder: number;
    durationMinutesFromOrigin: number;
    defaultSurcharge?: number; // Added
    stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
  }[];
};

export type AddRouteStopRequest = {
  stationId: string;
  stopOrder: number;
  durationMinutesFromOrigin: number;
  defaultSurcharge?: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
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
  tripSchedule?: TripSchedule; // Added
  departureTime: string;
  arrivalTime: string;
  status: string;
  tripPricings: TripPricing[];
  tripPoints: TripPoint[]; // Added
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

export type TripStopDto = {
  stationId?: string; // Optional - either stationId or customAddress required
  customName?: string; // Used when stationId is null
  customAddress?: string; // Used when stationId is null
  stopOrder: number;
  durationMinutesFromOrigin: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
};

export type UpdateTripStopsRequest = {
  stops: TripStopDto[];
};
