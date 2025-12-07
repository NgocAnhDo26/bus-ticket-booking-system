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

export const updateStation = async (id: string, data: CreateStationRequest): Promise<Station> => {
    const response = await apiClient.put<Station>(`/stations/${id}`, data);
    return response.data;
};

export const deleteStation = async (id: string, force?: boolean): Promise<void> => {
    await apiClient.delete(`/stations/${id}`, { params: { force } });
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

export const updateOperator = async (id: string, data: CreateOperatorRequest): Promise<Operator> => {
    const response = await apiClient.put<Operator>(`/operators/${id}`, data);
    return response.data;
};

export const deleteOperator = async (id: string, force?: boolean): Promise<void> => {
    await apiClient.delete(`/operators/${id}`, { params: { force } });
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

export const updateBus = async (id: string, data: CreateBusRequest): Promise<Bus> => {
    const response = await apiClient.put<Bus>(`/buses/${id}`, data);
    return response.data;
};

export const deleteBus = async (id: string, force?: boolean): Promise<void> => {
    await apiClient.delete(`/buses/${id}`, { params: { force } });
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

export const updateRoute = async (id: string, data: CreateRouteRequest): Promise<Route> => {
    const response = await apiClient.put<Route>(`/routes/${id}`, data);
    return response.data;
};

export const deleteRoute = async (id: string, force?: boolean): Promise<void> => {
    await apiClient.delete(`/routes/${id}`, { params: { force } });
};

// Trips
export const fetchTrips = async (): Promise<Trip[]> => {
    const response = await apiClient.get<Trip[]>("/trips");
    return response.data;
};

export const getTripById = async (id: string): Promise<Trip> => {
    const response = await apiClient.get<Trip>(`/trips/${id}`);
    return response.data;
};

export const searchTrips = async (
    params: SearchTripRequest,
): Promise<Trip[]> => {
    const searchParams = new URLSearchParams();
    if (params.origin) searchParams.append("origin", params.origin);
    if (params.destination) searchParams.append("destination", params.destination);
    if (params.date) searchParams.append("date", params.date);
    if (params.minPrice) searchParams.append("minPrice", params.minPrice.toString());
    if (params.maxPrice) searchParams.append("maxPrice", params.maxPrice.toString());
    if (params.minTime) searchParams.append("minTime", params.minTime);
    if (params.maxTime) searchParams.append("maxTime", params.maxTime);
    if (params.operatorIds) {
        params.operatorIds.forEach(id => searchParams.append("operatorIds", id));
    }
    if (params.seatType) searchParams.append("seatType", params.seatType);

    const response = await apiClient.get<{ content: Trip[] } | Trip[]>("/trips/search", { params: searchParams });
    // Handle Spring Data Page response
    if (response.data && 'content' in response.data) {
        return (response.data as { content: Trip[] }).content;
    }
    // Fallback if it returns a list directly
    return Array.isArray(response.data) ? response.data : [];
};

export const createTrip = async (data: CreateTripRequest): Promise<Trip> => {
    const response = await apiClient.post<Trip>("/trips", data);
    return response.data;
};

export const updateTrip = async (id: string, data: CreateTripRequest): Promise<Trip> => {
    const response = await apiClient.put<Trip>(`/trips/${id}`, data);
    return response.data;
};

export const deleteTrip = async (id: string, force?: boolean): Promise<void> => {
    await apiClient.delete(`/trips/${id}`, { params: { force } });
};
