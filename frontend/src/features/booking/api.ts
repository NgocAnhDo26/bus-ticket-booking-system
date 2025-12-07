import { apiClient } from "@/lib/api-client";
import type { BookingResponse, CreateBookingRequest, LockSeatRequest } from "./types";
import { type Trip } from "@/features/catalog/types";

// Booking CRUD APIs
export const createBooking = async (
    request: CreateBookingRequest
): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>("/bookings", request);
    return response.data;
};

export const getBookingById = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${id}`);
    return response.data;
};

export const getUserBookings = async (
    page = 0,
    size = 10
): Promise<{ content: BookingResponse[]; totalPages: number; totalElements: number }> => {
    const response = await apiClient.get<{
        content: BookingResponse[];
        totalPages: number;
        totalElements: number;
    }>("/bookings/user", {
        params: { page, size },
    });
    return response.data;
};

export const getBookedSeatsForTrip = async (tripId: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/bookings/trip/${tripId}/seats`);
    return response.data;
};

export const confirmBooking = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.put<BookingResponse>(`/bookings/${id}/confirm`, {});
    return response.data;
};

export const cancelBooking = async (id: string): Promise<BookingResponse> => {
    const response = await apiClient.put<BookingResponse>(`/bookings/${id}/cancel`, {});
    return response.data;
};

export const lookupBooking = async (code: string, email: string): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>("/bookings/lookup", { code, email });
    return response.data;
};

// Seat locking APIs from teammate
export const bookingApi = {
    lockSeat: async (data: LockSeatRequest) => {
        return apiClient.post("/bookings/seats/lock", data);
    },

    unlockSeat: async (data: LockSeatRequest) => {
        return apiClient.post("/bookings/seats/unlock", data);
    },

    getSeatStatus: async (tripId: string) => {
        const response = await apiClient.get<Record<string, string>>(`/bookings/seats/${tripId}`);
        return response.data;
    },

    getTrip: async (tripId: string) => {
        const response = await apiClient.get<Trip>(`/trips/${tripId}`);
        return response.data;
    },
};
