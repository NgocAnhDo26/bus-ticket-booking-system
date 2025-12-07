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
    getTripById,
    searchTrips,
    updateBus,
    deleteBus,
    updateRoute,
    deleteRoute,
    updateTrip,
    deleteTrip,
    updateStation,
    deleteStation,
    updateOperator,
    deleteOperator,
} from "./api";
import type {
    SearchTripRequest,
    CreateStationRequest,
    CreateOperatorRequest,
    CreateBusRequest,
    CreateRouteRequest,
    CreateTripRequest
} from "./types";

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

export const useUpdateStation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateStationRequest }) => updateStation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stations"] });
        },
    });
};

export const useDeleteStation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteStation(id, force),
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

export const useUpdateOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateOperatorRequest }) => updateOperator(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["operators"] });
        },
    });
};

export const useDeleteOperator = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteOperator(id, force),
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



export const useUpdateBus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateBusRequest }) => updateBus(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["buses"] });
        },
    });
};

export const useDeleteBus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteBus(id, force),
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



export const useUpdateRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateRouteRequest }) => updateRoute(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["routes"] });
        },
    });
};

export const useDeleteRoute = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteRoute(id, force),
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

export const useTripById = (id: string | undefined) => {
    return useQuery({
        queryKey: ["trip", id],
        queryFn: () => getTripById(id!),
        enabled: !!id,
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



export const useUpdateTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateTripRequest }) => updateTrip(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
        },
    });
};

export const useDeleteTrip = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteTrip(id, force),
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

