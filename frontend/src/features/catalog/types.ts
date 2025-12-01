export type Station = {
    id: string;
    name: string;
    city: string;
    address: string;
    createdAt: string;
};

export type CreateStationRequest = {
    name: string;
    city: string;
    address: string;
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
    capacity: number;
    amenities: string[];
    isActive: boolean;
    createdAt: string;
};

export type CreateBusRequest = {
    operatorId: string;
    plateNumber: string;
    capacity: number;
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
    NORMAL: "NORMAL",
    VIP: "VIP",
    SLEEPER: "SLEEPER",
} as const;

export type SeatType = (typeof SeatType)[keyof typeof SeatType];

export type PricingRequest = {
    seatType: SeatType;
    price: number;
};

export type TripPricing = {
    id: string;
    seatType: SeatType;
    price: number;
};

export type Trip = {
    id: string;
    route: Route;
    bus: Bus;
    departureTime: string;
    arrivalTime: string;
    status: string;
    tripPricings: TripPricing[];
    createdAt: string;
};

export type CreateTripRequest = {
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
    amenities?: string[];
    seatType?: SeatType;
    sortBy?: string;
    page?: number;
    size?: number;
};
