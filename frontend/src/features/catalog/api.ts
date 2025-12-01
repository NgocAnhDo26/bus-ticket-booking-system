import { apiClient } from "@/lib/api-client";
import {
    type Bus,
    type CreateBusRequest,
    type CreateOperatorRequest,
    type CreateStationRequest,
    type Operator,
    type Station,
    type Route,
    type CreateRouteRequest,
    type Trip,
    type CreateTripRequest,
    type SearchTripRequest,
} from "./types";

// Stations
export const fetchStations = async (): Promise<Station[]> => {
    const response = await apiClient.get<Station[]>("/stations");
    return response.data;
};

export const createStation = async (
    data: CreateStationRequest,
): Promise<Station> => {
    const response = await apiClient.post<Station>("/stations", data);
    return response.data;
};

// Operators
export const fetchOperators = async (): Promise<Operator[]> => {
    const response = await apiClient.get<Operator[]>("/operators");
    return response.data;
};

export const createOperator = async (
    data: CreateOperatorRequest,
): Promise<Operator> => {
    const response = await apiClient.post<Operator>("/operators", data);
    return response.data;
};

// Buses
export const fetchBuses = async (): Promise<Bus[]> => {
    const response = await apiClient.get<Bus[]>("/buses");
    return response.data;
};

export const createBus = async (data: CreateBusRequest): Promise<Bus> => {
    const response = await apiClient.post<Bus>("/buses", data);
    return response.data;
};

// Routes
export const fetchRoutes = async (): Promise<Route[]> => {
    const response = await apiClient.get<Route[]>("/routes");
    return response.data;
};

export const createRoute = async (data: CreateRouteRequest): Promise<Route> => {
    const response = await apiClient.post<Route>("/routes", data);
    return response.data;
};

// Trips
export const fetchTrips = async (): Promise<Trip[]> => {
    const response = await apiClient.get<Trip[]>("/trips");
    return response.data;
};

export const searchTrips = async (
    params: SearchTripRequest,
): Promise<Trip[]> => {
    const response = await apiClient.get<{ content: Trip[] } | Trip[]>("/trips/search", { params });
    // Handle Spring Data Page response
    if (response.data && 'content' in response.data) {
        return response.data.content;
    }
    // Fallback if it returns a list directly
    return Array.isArray(response.data) ? response.data : [];
};

export const createTrip = async (data: CreateTripRequest): Promise<Trip> => {
    const response = await apiClient.post<Trip>("/trips", data);
    return response.data;
};
