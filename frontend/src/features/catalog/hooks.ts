import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createBus,
    createOperator,
    createStation,
    createRoute,
    createTrip,
    fetchBuses,
    fetchOperators,
    fetchStations,
    fetchRoutes,
    fetchTrips,
    searchTrips,
} from "./api";
import type { SearchTripRequest } from "./types";

// Stations
export const useStations = () => {
    return useQuery({
        queryKey: ["stations"],
        queryFn: fetchStations,
    });
};

export const useCreateStation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
    });
};

// Operators
export const useOperators = () => {
    return useQuery({
        queryKey: ["operators"],
        queryFn: fetchOperators,
    });
};

export const useCreateOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createOperator,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["operators"] });
        },
    });
};

// Buses
export const useBuses = () => {
    return useQuery({
        queryKey: ["buses"],
        queryFn: fetchBuses,
    });
};

export const useCreateBus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
        },
    });
};

// Routes
export const useRoutes = () => {
    return useQuery({
        queryKey: ["routes"],
        queryFn: fetchRoutes,
    });
};

export const useCreateRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRoute,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
        },
    });
};

// Trips
export const useTrips = () => {
    return useQuery({
        queryKey: ["trips"],
        queryFn: fetchTrips,
    });
};

export const useCreateTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTrip,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
    });
};

export const useSearchTrips = (params: SearchTripRequest) => {
    return useQuery({
        queryKey: ["trips", "search", params],
        queryFn: () => searchTrips(params),
        enabled: !!params.origin && !!params.destination && !!params.date,
    });
};
