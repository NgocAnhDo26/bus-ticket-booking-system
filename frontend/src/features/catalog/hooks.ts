import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addRouteStop,
  createBus,
  createOperator,
  createRoute,
  createStation,
  createTrip,
  deleteBus,
  deleteOperator,
  deleteRoute,
  deleteRouteStop,
  deleteStation,
  deleteTrip,
  fetchBuses,
  fetchOperators,
  fetchRoutes,
  fetchStations,
  fetchTrips,
  getTripById,
  searchRoutes,
  searchStations,
  searchTrips,
  updateBus,
  updateOperator,
  updateRoute,
  updateStation,
  updateTrip,
  updateTripStops,
} from './api';
import { fetchBusLayouts } from './api';
import type {
  AddRouteStopRequest,
  CreateBusRequest,
  CreateOperatorRequest,
  CreateRouteRequest,
  CreateStationRequest,
  CreateTripRequest,
  SearchTripRequest,
  UpdateTripStopsRequest,
} from './types';

// Stations
export const useStations = () => {
  return useQuery({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });
};

export const useSearchStations = (query: string) => {
  return useQuery({
    queryKey: ['stations', 'search', query],
    queryFn: () => (query ? searchStations(query) : fetchStations()),
  });
};

export const useCreateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};

export const useUpdateStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateStationRequest }) =>
      updateStation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};

export const useDeleteStation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteStation(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
    },
  });
};

// Operators
export const useOperators = () => {
  return useQuery({
    queryKey: ['operators'],
    queryFn: fetchOperators,
  });
};

export const useCreateOperator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOperator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
};

export const useUpdateOperator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOperatorRequest }) =>
      updateOperator(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
};

export const useDeleteOperator = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteOperator(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
    },
  });
};

// Buses
export const useBuses = () => {
  return useQuery({
    queryKey: ['buses'],
    queryFn: fetchBuses,
  });
};

export const useCreateBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

export const useUpdateBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBusRequest }) => updateBus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['bus', variables.id] });
    },
  });
};

export const useDeleteBus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteBus(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
};

export const useBusById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['bus', id],
    queryFn: () => import('./api').then((mod) => mod.getBusById(id!)),
    enabled: !!id,
  });
};

// Routes
export const useRoutes = () => {
  return useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutes,
  });
};

export const useSearchRoutes = (query: string) => {
  return useQuery({
    queryKey: ['routes', 'search', query],
    queryFn: () => searchRoutes(query),
    enabled: !!query,
  });
};

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

export const useUpdateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateRouteRequest }) => updateRoute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

export const useRouteById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['route', id],
    queryFn: () => import('./api').then((mod) => mod.getRouteById(id!)),
    enabled: !!id,
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteRoute(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
  });
};

export const useAddRouteStop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: AddRouteStopRequest }) =>
      addRouteStop(routeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
    },
  });
};

export const useDeleteRouteStop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, stopId }: { routeId: string; stopId: string }) =>
      deleteRouteStop(routeId, stopId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route', variables.routeId] });
    },
  });
};

// Trips
export const useTrips = () => {
  return useQuery({
    queryKey: ['trips'],
    queryFn: fetchTrips,
  });
};

export const useTripById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: () => getTripById(id!),
    enabled: !!id,
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTripRequest }) => updateTrip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => deleteTrip(id, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useUpdateTripStops = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTripStopsRequest }) =>
      updateTripStops(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};

export const useSearchTrips = (params: SearchTripRequest) => {
  return useQuery({
    queryKey: ['trips', 'search', params],
    queryFn: () => searchTrips(params),
    enabled: !!params.origin && !!params.destination && !!params.date,
  });
};

export const useBusLayouts = () => {
  return useQuery({
    queryKey: ['busLayouts'],
    queryFn: fetchBusLayouts,
  });
};

export const useTripPassengers = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ['tripPassengers', tripId],
    queryFn: () => import('./api').then((mod) => mod.getTripPassengers(tripId!)),
    enabled: !!tripId,
  });
};

export const useUpdateTripStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      import('./api').then((mod) => mod.updateTripStatus(id, status)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', data.id] });
    },
  });
};

export const useCheckCanUpdateRecurrence = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ['trip', tripId, 'can-update-recurrence'],
    queryFn: () => import('./api').then((mod) => mod.checkCanUpdateRecurrence(tripId!)),
    enabled: !!tripId,
  });
};
