import {
  createBus as orvalCreateBus,
  deleteBus as orvalDeleteBus,
  getAllBuses as orvalGetAllBuses,
  updateBus as orvalUpdateBus,
} from '@/features/api/bus-controller/bus-controller';
// Bus Layouts
import { getAllLayouts as orvalGetAllLayouts } from '@/features/api/bus-layout-controller/bus-layout-controller';
import {
  createOperator as orvalCreateOperator,
  deleteOperator as orvalDeleteOperator,
  getAllOperators as orvalGetAllOperators,
  updateOperator as orvalUpdateOperator,
} from '@/features/api/operator-controller/operator-controller';
import {
  createRoute as orvalCreateRoute,
  deleteRoute as orvalDeleteRoute,
  getAllRoutes as orvalGetAllRoutes,
  updateRoute as orvalUpdateRoute,
} from '@/features/api/route-controller/route-controller';
import {
  createStation as orvalCreateStation,
  deleteStation as orvalDeleteStation,
  getAllStations as orvalGetAllStations,
  updateStation as orvalUpdateStation,
} from '@/features/api/station-controller/station-controller';
import {
  createTrip as orvalCreateTrip,
  deleteTrip as orvalDeleteTrip,
  getAllTrips as orvalGetAllTrips,
  getTripById as orvalGetTripById,
  searchTrips as orvalSearchTrips,
  updateTrip as orvalUpdateTrip,
} from '@/features/api/trips/trips';
import { apiClient } from '@/lib/api-client';
import type {
  Bus as ApiBus,
  BusLayout as ApiBusLayout,
  CreateBusRequest as ApiCreateBusRequest,
  CreateOperatorRequest as ApiCreateOperatorRequest,
  CreateRouteRequest as ApiCreateRouteRequest,
  CreateStationRequest as ApiCreateStationRequest,
  CreateTripRequest as ApiCreateTripRequest,
  Operator as ApiOperator,
  Route as ApiRoute,
  SearchTripRequest as ApiSearchTripRequest,
  Station as ApiStation,
  OperatorInfo,
  PagedModelRouteResponse,
  PagedModelStation,
  RouteResponse,
  SearchTripsParams,
  StationInfo,
  TripPricingInfo,
  TripPricingInfoSeatType,
  TripResponse,
  TripResponseStatus,
} from '@/model';

import {
  type AddRouteStopRequest,
  type Bus,
  type CreateBusRequest,
  type CreateOperatorRequest,
  type CreateRouteRequest,
  type CreateStationRequest,
  type CreateTripRequest,
  type Operator,
  type Route,
  type SearchTripRequest,
  type Station,
  type Trip,
  type UpdateTripStopsRequest,
} from './types';
import type { BusLayout } from './types';

const DEFAULT_PAGEABLE = { page: 0, size: 1000 };

const toStation = (s: ApiStation | StationInfo | undefined): Station => ({
  id: s?.id ?? '',
  name: s?.name ?? '',
  city: s?.city ?? '',
  address: 'address' in (s ?? {}) ? ((s as ApiStation).address ?? '') : '',
  createdAt: 'createdAt' in (s ?? {}) ? ((s as ApiStation).createdAt ?? '') : '',
});

const toOperator = (o: ApiOperator | OperatorInfo | undefined): Operator => ({
  id: o?.id ?? '',
  name: o?.name ?? '',
  contactInfo:
    'contactInfo' in (o ?? {})
      ? (((o as ApiOperator).contactInfo ?? {}) as Record<string, string | undefined>)
      : {},
  isActive: 'isActive' in (o ?? {}) ? Boolean((o as ApiOperator).isActive) : true,
  createdAt: 'createdAt' in (o ?? {}) ? ((o as ApiOperator).createdAt ?? '') : '',
});

const toRoute = (r: ApiRoute | RouteResponse | undefined): Route => ({
  id: r?.id ?? '',
  originStation: toStation(
    (r as ApiRoute | undefined)?.originStation ?? (r as RouteResponse | undefined)?.originStation,
  ),
  destinationStation: toStation(
    (r as ApiRoute | undefined)?.destinationStation ??
      (r as RouteResponse | undefined)?.destinationStation,
  ),
  durationMinutes: r?.durationMinutes ?? 0,
  distanceKm: 'distanceKm' in (r ?? {}) ? ((r as ApiRoute).distanceKm ?? 0) : 0,
  isActive: 'isActive' in (r ?? {}) ? Boolean((r as ApiRoute | RouteResponse).isActive) : true,
  createdAt: 'createdAt' in (r ?? {}) ? ((r as ApiRoute).createdAt ?? '') : '',
  stops: [],
});

const toApiBusLayoutSummary = (bl: ApiBusLayout | undefined): Bus['busLayout'] => ({
  id: bl?.id ?? '',
  name: bl?.name ?? '',
  busType: bl?.busType ?? '',
  totalSeats: bl?.totalSeats ?? 0,
  totalFloors: bl?.totalFloors ?? 1,
  description: bl?.description,
});

const toBus = (b: ApiBus | undefined): Bus => ({
  id: b?.id ?? '',
  operator: toOperator(b?.operator),
  plateNumber: b?.plateNumber ?? '',
  busLayout: toApiBusLayoutSummary(b?.busLayout),
  amenities: (b?.amenities ?? []) as string[],
  isActive: Boolean(b?.isActive ?? true),
  createdAt: b?.createdAt ?? '',
});

const toTripPricing = (p: TripPricingInfo | undefined) => ({
  id: p?.id ?? '',
  seatType: (p?.seatType as unknown as TripPricingInfoSeatType) ?? 'NORMAL',
  price: p?.price ?? 0,
});

const toTrip = (t: TripResponse | undefined): Trip => ({
  id: t?.id ?? '',
  route: {
    id: t?.route?.id ?? '',
    originStation: toStation(t?.route?.originStation),
    destinationStation: toStation(t?.route?.destinationStation),
    durationMinutes: t?.route?.durationMinutes ?? 0,
    distanceKm: 0,
    isActive: true,
    createdAt: '',
    stops: (t?.route?.stops ?? []).map(
      (s: {
        id?: string;
        station?: unknown;
        customName?: string;
        customAddress?: string;
        stopOrder?: number;
        durationMinutesFromOrigin?: number;
        stopType?: string;
      }) => ({
        id: s.id ?? '',
        station: s.station ? toStation(s.station) : undefined,
        customName: s.customName,
        customAddress: s.customAddress,
        stopOrder: s.stopOrder ?? 0,
        durationMinutesFromOrigin: s.durationMinutesFromOrigin ?? 0,
        stopType: (s.stopType ?? 'BOTH') as 'PICKUP' | 'DROPOFF' | 'BOTH',
      }),
    ),
  },
  bus: {
    id: t?.bus?.id ?? '',
    plateNumber: t?.bus?.plateNumber ?? '',
    operator: toOperator(t?.bus?.operator),
    totalSeats: t?.bus?.totalSeats ?? 0,
    busLayoutId: t?.bus?.busLayoutId ?? '',
    amenities: (t?.bus?.amenities ?? []) as string[],
  },
  departureTime: t?.departureTime ?? '',
  arrivalTime: t?.arrivalTime ?? '',
  status: (t?.status as unknown as TripResponseStatus) ?? 'ACTIVE',
  tripPricings: (t?.tripPricings ?? []).map(toTripPricing),
  tripPoints: [],
  createdAt: '',
});

// Stations
export const fetchStations = async (): Promise<Station[]> => {
  const resp = await orvalGetAllStations({ pageable: DEFAULT_PAGEABLE });
  return (resp.content ?? []).map(toStation);
};

export const createStation = async (data: CreateStationRequest): Promise<Station> => {
  const resp = await orvalCreateStation(data as unknown as ApiCreateStationRequest);
  return toStation(resp);
};

export const updateStation = async (id: string, data: CreateStationRequest): Promise<Station> => {
  const resp = await orvalUpdateStation(id, data as unknown as ApiCreateStationRequest);
  return toStation(resp);
};

export const deleteStation = async (id: string, force?: boolean): Promise<void> => {
  await orvalDeleteStation(id, force ? { force } : undefined);
};

export const searchStations = async (query: string): Promise<Station[]> => {
  const response = await apiClient.get<PagedModelStation>(`/api/stations/search`, {
    params: { query, page: 0, size: 20 },
  });
  return (response.data.content ?? []).map(toStation);
};

// Operators
export const fetchOperators = async (): Promise<Operator[]> => {
  const resp = await orvalGetAllOperators({ pageable: DEFAULT_PAGEABLE });
  return (resp.content ?? []).map(toOperator);
};

export const createOperator = async (data: CreateOperatorRequest): Promise<Operator> => {
  const resp = await orvalCreateOperator(data as unknown as ApiCreateOperatorRequest);
  return toOperator(resp);
};

export const updateOperator = async (
  id: string,
  data: CreateOperatorRequest,
): Promise<Operator> => {
  const resp = await orvalUpdateOperator(id, data as unknown as ApiCreateOperatorRequest);
  return toOperator(resp);
};

export const deleteOperator = async (id: string, force?: boolean): Promise<void> => {
  await orvalDeleteOperator(id, force ? { force } : undefined);
};

// Buses
export const fetchBuses = async (): Promise<Bus[]> => {
  const resp = await orvalGetAllBuses({ pageable: DEFAULT_PAGEABLE });
  return (resp.content ?? []).map(toBus);
};

export const createBus = async (data: CreateBusRequest): Promise<Bus> => {
  const resp = await orvalCreateBus(data as unknown as ApiCreateBusRequest);
  return toBus(resp);
};

export const updateBus = async (id: string, data: CreateBusRequest): Promise<Bus> => {
  const resp = await orvalUpdateBus(id, data as unknown as ApiCreateBusRequest);
  return toBus(resp);
};

export const deleteBus = async (id: string, force?: boolean): Promise<void> => {
  await orvalDeleteBus(id, force ? { force } : undefined);
};

// Routes
export const fetchRoutes = async (): Promise<Route[]> => {
  const resp = await orvalGetAllRoutes({ pageable: DEFAULT_PAGEABLE });
  return (resp.content ?? []).map(toRoute);
};

export const createRoute = async (data: CreateRouteRequest): Promise<Route> => {
  const resp = await orvalCreateRoute(data as unknown as ApiCreateRouteRequest);
  return toRoute(resp);
};

export const updateRoute = async (id: string, data: CreateRouteRequest): Promise<Route> => {
  const resp = await orvalUpdateRoute(id, data as unknown as ApiCreateRouteRequest);
  return toRoute(resp);
};

export const deleteRoute = async (id: string, force?: boolean): Promise<void> => {
  await orvalDeleteRoute(id, force ? { force } : undefined);
};

export const addRouteStop = async (routeId: string, data: AddRouteStopRequest): Promise<Route> => {
  const response = await apiClient.post<Route>(`/api/routes/${routeId}/stops`, data);
  return response.data;
};

export const searchRoutes = async (query: string): Promise<Route[]> => {
  const response = await apiClient.get<PagedModelRouteResponse>(`/api/routes/search`, {
    params: { query, page: 0, size: 20 },
  });
  return (response.data.content ?? []).map(toRoute);
};

export const deleteRouteStop = async (routeId: string, stopId: string): Promise<void> => {
  await apiClient.delete(`/api/routes/${routeId}/stops/${stopId}`);
};

// Trips
export const fetchTrips = async (): Promise<Trip[]> => {
  const resp = await orvalGetAllTrips({ pageable: DEFAULT_PAGEABLE });
  return (resp.content ?? []).map(toTrip);
};

export const getTripById = async (id: string): Promise<Trip> => {
  const resp = await orvalGetTripById(id);
  return toTrip(resp);
};

export const searchTrips = async (
  params: SearchTripRequest,
): Promise<{
  trips: Trip[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}> => {
  // OpenAPI currently models `/trips/search` params as `{ request: SearchTripRequest }`.
  // If the backend supports extra fields (e.g. `seatType`) that aren't in the spec yet,
  // we still pass them through to preserve existing UI behavior.
  const request: ApiSearchTripRequest & { seatType?: string } = {
    origin: params.origin,
    destination: params.destination,
    date: params.date,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minTime: params.minTime,
    maxTime: params.maxTime,
    amenities: params.amenities,
    operatorIds: params.operatorIds,
    sortBy: params.sortBy,
    page: params.page,
    size: params.size,
    seatType: params.seatType,
  };

  const orvalParams: SearchTripsParams = { request };
  const resp = await orvalSearchTrips(orvalParams);
  const trips = (resp.content ?? []).map(toTrip);
  const pageMetadata = resp.page ?? {};

  return {
    trips,
    pagination: {
      page: (pageMetadata.number ?? 0) + 1, // Convert 0-based to 1-based
      size: pageMetadata.size ?? 10,
      totalElements: pageMetadata.totalElements ?? trips.length,
      totalPages: pageMetadata.totalPages ?? 1,
    },
  };
};

export const createTrip = async (data: CreateTripRequest): Promise<Trip> => {
  const resp = await orvalCreateTrip(data as unknown as ApiCreateTripRequest);
  return toTrip(resp);
};

export const updateTrip = async (id: string, data: CreateTripRequest): Promise<Trip> => {
  const resp = await orvalUpdateTrip(id, data as unknown as ApiCreateTripRequest);
  return toTrip(resp);
};

export const updateTripStops = async (id: string, data: UpdateTripStopsRequest): Promise<Trip> => {
  const response = await apiClient.put<TripResponse>(`/api/trips/${id}/stops`, data);
  return toTrip(response.data);
};

export const getTripPassengers = async (id: string): Promise<import('./types').TripPassenger[]> => {
  const response = await apiClient.get<import('./types').TripPassenger[]>(
    `/api/trips/${id}/passengers`,
  );
  return response.data;
};

export const updateTripStatus = async (id: string, status: string): Promise<Trip> => {
  const response = await apiClient.patch<TripResponse>(`/api/trips/${id}/status`, undefined, {
    params: { status },
  });
  return toTrip(response.data);
};

export const deleteTrip = async (id: string, force?: boolean): Promise<void> => {
  await orvalDeleteTrip(id, force ? { force } : undefined);
};

const toBusLayout = (bl: ApiBusLayout | undefined): BusLayout => ({
  id: bl?.id ?? '',
  name: bl?.name ?? '',
  busType: bl?.busType ?? '',
  totalSeats: bl?.totalSeats ?? 0,
  totalFloors: bl?.totalFloors ?? 1,
  description: bl?.description,
  layoutMatrix: { rows: [], totalRows: 0, totalCols: 0 }, // Simplified for dropdown
});

export const fetchBusLayouts = async (): Promise<BusLayout[]> => {
  const resp = await orvalGetAllLayouts();
  return (resp ?? []).map(toBusLayout); // The controller returns List<BusLayoutResponse>, not Page
};
